const express = require('express')
const { Client } = require('@elastic/elasticsearch')
const { getEmbedding } = require('./embedding')
const { server } = require('./routes/route')
const app = express()
const port = 3000

// Connect to your Elasticsearch instance
const client = new Client({ node: 'http://localhost:9200' })

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
