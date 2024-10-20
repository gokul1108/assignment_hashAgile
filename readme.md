# Elasticsearch Employee Data Management

This project implements an employee data management system using Elasticsearch. It provides functionality for creating collections, indexing employee data, searching, and generating department-wise analytics.

## Prerequisites

- Node.js (v14 or higher)
- Docker Desktop
- Employee sample dataset (CSV format)

## Installation

### 1. Set Up Elasticsearch and Kibana

First, create a Docker network for Elasticsearch:

```bash
docker network create elastic
```

#### Install and Run Elasticsearch:

```bash
# Pull Elasticsearch image
docker pull docker.elastic.co/elasticsearch/elasticsearch:7.17.24

# Run Elasticsearch container
docker run --name es01-test --net elastic \
  -p 127.0.0.1:9200:9200 -p 127.0.0.1:9300:9300 \
  -e "discovery.type=single-node" \
  docker.elastic.co/elasticsearch/elasticsearch:7.17.24
```

#### Install and Run Kibana:

```bash
# Pull Kibana image
docker pull docker.elastic.co/kibana/kibana:7.17.24

# Run Kibana container
docker run --name kib01-test --net elastic \
  -p 127.0.0.1:5601:5601 \
  -e "ELASTICSEARCH_HOSTS=http://es01-test:9200" \
  docker.elastic.co/kibana/kibana:7.17.24
```

Access Kibana at: http://localhost:5601

### 2. Project Setup

1. Clone this repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install @elastic/elasticsearch csv-parser
```

3. Place your employee dataset (CSV format) in the project root directory.

## Project Structure

```
├── app.js              # Main application file
├── EmployeeSampleData1.csv    # Employee dataset
├── package.json
└── README.md
```

## Features

The application provides the following functionalities:

1. **Create Collection** (`createCollection`)
   - Creates Elasticsearch indices with proper mappings for employee data

2. **Index Data** (`indexData`)
   - Indexes employee data from CSV file
   - Supports column exclusion

3. **Search Operations** (`searchByColumn`)
   - Search employees by any column value
   - Supports exact matches

4. **Employee Management** (`delEmpById`)
   - Delete employees by their ID
   - Maintains data consistency

5. **Analytics** (`getDepFacet`)
   - Department-wise employee distribution
   - Aggregation capabilities

## Usage


1. Start the application:
```bash
node app.js
```

2. The application will execute the following operations in sequence:
   - Create two collections (nameCollection and phoneCollection)
   - Index employee data into both collections
   - Perform search operations
   - Generate department-wise analytics

## Function Reference

### `createCollection(p_collection_name)`
Creates a new Elasticsearch index with specified mappings.

```javascript
await createCollection('hash_employeeData');
```

### `indexData(p_collection_name, p_exclude_column)`
Indexes CSV data into the specified collection.

```javascript
await indexData('hash_employeeData', 'Department');
```

### `searchByColumn(p_collection_name, p_column_name, p_column_value)`
Searches for employees matching specific criteria.

```javascript
await searchByColumn('hash_employeeData', 'Department', 'IT');
```

### `delEmpById(p_collection_name, employeeId)`
Deletes an employee by their ID.

```javascript
await delEmpById('hash_employeeData', 'E02004');
```

### `getDepFacet(p_collection_name)`
Generates department-wise distribution of employees.

```javascript
await getDepFacet('hash_employeeData');
```



## Dependencies

- [@elastic/elasticsearch](https://www.npmjs.com/package/@elastic/elasticsearch): Elasticsearch client for Node.js
- [csv-parser](https://www.npmjs.com/package/csv-parser): CSV file parsing utility


