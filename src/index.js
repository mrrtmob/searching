const express = require('express')
const { Client } = require('@elastic/elasticsearch')
const { server } = require('./routes/route')
const app = express()
const port = 3000

// Connect to your Elasticsearch instance
const client = new Client({ node: 'http://localhost:9200' })
// Middleware to set the Access-Control-Allow-Origin header
app.use((req, res, next) => {
    // Allow requests only from localhost
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4000'); // add the port if it's not on default (e.g., http://localhost:3000)
    // Set other CORS headers if needed
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
// Middleware to parse JSON requests
app.use(express.json())

// Define a function to check and create index with mappings
async function ensureIndexExists(indexName) {
    const indexExists = await client.indices.exists({ index: indexName })
    if (!indexExists.body) {
        await client.indices.create({
            index: indexName,
            body: {
                mappings: {
                    properties: {
                        vector: {
                            type: "dense_vector",
                            dims: 1536
                        },
                        number: {
                            type: "text"
                        },
                        title: {
                            type: "text"
                        },
                        description: {
                            type: "text"
                        }
                    }
                }
            }
        })
        console.log(`Index ${indexName} created with mappings.`)
    } else {
        console.log(`Index ${indexName} already exists.`)
    }
}

// Example usage
ensureIndexExists('test_vector').catch(console.error)



server(app)

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
})
