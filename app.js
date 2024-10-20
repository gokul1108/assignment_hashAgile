const { Client } = require("@elastic/elasticsearch");
const fs = require("fs");
const csv = require("csv-parser");

const client = new Client({ node: "http://localhost:9200" });

async function createCollection(p_collection_name) {
    console.log("\n=== Creating Collections ===");
    try {
        const response = await client.indices.create({
            index: p_collection_name,
            body: {
                mappings: {
                    properties: {
                        Department: { type: "keyword" },
                        Gender: { type: "keyword" },
                        "Employee ID": { type: "keyword" }
                    }
                }
            }
        });
        console.log(`\nCollection ${p_collection_name} created successfully`);
    } catch (error) {
        if (error.meta?.body?.error?.type === 'resource_already_exists_exception') {
            console.log(`\nCollection ${p_collection_name} already exists`);
        } else {
            console.error("\nError creating collection:", error.meta?.body?.error || error);
        }
    }
}

async function indexData(p_collection_name, p_exclude_column) {
    
    const employeeData = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream("EmployeeSampleData1.csv")
            .pipe(csv())
            .on("data", (row) => {
                delete row[p_exclude_column];
                employeeData.push(row);
            })
            .on("end", async () => {
                try {
                    const operations = employeeData.flatMap(doc => [
                        { index: { _index: p_collection_name } },
                        doc
                    ]);

                    const { body: bulkResponse } = await client.bulk({
                        refresh: true,
                        body: operations
                    });
                    console.log("\n=== Indexing Data ===");

                    console.log(`Successfully indexed ${employeeData.length} documents in ${p_collection_name}`);
                    resolve();
                } catch (error) {
                    console.error("Error indexing data:", error);
                    reject(error);
                }
            })
            .on("error", (error) => {
                console.error("Error reading CSV file:", error);
                reject(error);
            });
    });
}

async function searchByColumn(p_collection_name, p_column_name, p_column_value) {
    
  try {
    await client.indices.refresh({ index: p_collection_name });

    const response = await client.search({
      index: p_collection_name,
      body: {
        query: {
          match: {
            [p_column_name]: p_column_value,
          },
        },
        size: 100
      },
    });

    const hits = response.hits.hits;
    console.log(`\n=== Searching ${p_column_name} ===`);
    if (hits.length > 0) {
      console.log(`\nFound ${hits.length} matches for ${p_column_name}: ${p_column_value} in ${p_collection_name}`);
    
      console.log(`\nNo matches found for ${p_column_name}: ${p_column_value}`);
    }
  } catch (error) {
    console.error("\nError searching data:", error.meta?.body?.error || error);
  }
}

async function delEmpById(p_collection_name, employeeId) {
    
    try {
    
        const response = await client.search({
          index: p_collection_name,
          body: {
            query: {
              match: {
                "Employee ID": employeeId,
              },
            },
          },
        });
    
        
        const hits = response.hits.hits;
        if (hits.length > 0) {
          for (const hit of hits) {
            const documentId = hit._id; 
            
            await client.delete({
              index: p_collection_name,
              id: documentId,
            });
            
          }
          console.log("\n=== Deleting Employee ===");
          console.log(`Employee ID: ${employeeId} deleted`);
        } else {
          console.log(`No documents found with Employee ID: ${employeeId}`);
        }
      } catch (error) {
        console.error("Error deleting employee:", error.meta.body.error);
      }
      
}

async function getEmpCount(p_collection_name) {
  try {
    // Refresh index before counting
    await client.indices.refresh({ index: p_collection_name });
    
    const response = await client.count({
      index: p_collection_name,
    });
    console.log(`\nTotal employees in ${p_collection_name}: ${response.count} `);
    return response.count;
  } catch (error) {
    console.error("\nError getting employee count:", error.meta?.body?.error || error);
    return 0;
  }
}

async function getDepFacet(p_collection_name) {
    
    try {
        
        // Refresh index before aggregating
        await client.indices.refresh({ index: p_collection_name });
        
        const response = await client.search({
            index: p_collection_name,
            body: {
                size: 0,
                aggs: {
                    departments_keyword: {
                        terms: { 
                            field: "Department.keyword",
                            size: 100,
                            min_doc_count: 1
                        }
                    },
                    departments_raw: {
                        terms: {
                            field: "Department",
                            size: 100,
                            min_doc_count: 1
                        }
                    }
                }
            }
        });

        const keywordBuckets = response.aggregations?.departments_keyword?.buckets || [];
        const rawBuckets = response.aggregations?.departments_raw?.buckets || [];

        
        console.log("\n=== Department facet ===");
        if (rawBuckets.length > 0) {
            console.log("\nDepartment facet:");
            rawBuckets.forEach(bucket => {
                console.log(`${bucket.key}: ${bucket.doc_count} employees`);
            });
        }

        if (keywordBuckets.length === 0 && rawBuckets.length === 0) {
            console.log("\nNo department data found");
        
        }

    } catch (error) {
        console.error("\nDetailed error in getDepFacet:", JSON.stringify(error, null, 2));
    }
}


const v_nameCollection = "hash_gokulr";
const v_phoneCollection = "hash_2148";

async function main() {
    try {
       
        await createCollection(v_nameCollection);
        await createCollection(v_phoneCollection);

        console.log("\n=== count  Data ===");
        await getEmpCount(v_nameCollection);
        

        await Promise.all([
            indexData(v_nameCollection, "Department"),
            indexData(v_phoneCollection, "Gender")
        ]);

        
        await client.indices.refresh({ 
            index: [v_nameCollection, v_phoneCollection] 
        });

        
        await delEmpById(v_nameCollection, "E02004");
        
        await getEmpCount(v_phoneCollection);
        
        await searchByColumn(v_nameCollection, "Department", "IT");
        await searchByColumn(v_nameCollection, "Gender", "Male");
        await searchByColumn(v_phoneCollection, "Department", "IT");
        await getDepFacet(v_nameCollection);
        await getDepFacet(v_phoneCollection);

    } catch (error) {
        console.error("Error in main execution:", error);
    } finally {
        await client.close();
    }
}

main();