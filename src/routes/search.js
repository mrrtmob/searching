const { getEmbedding } = require("../embedding")
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

const search = (app) => {
    // Define a route for Elasticsearch queries
    app.post('/search', async (req, res) => {
        const { index, query } = req.body
        try {
            const response = await client.search({
                index,
                body: {
                    query: {
                        multi_match: {
                            query: query,
                            fields: ['text', 'number']
                        },
                    },
                    _source: {
                        excludes: ["vector"]
                    },
                },
            })
            console.log(response) // Log the response object
            res.json(response)
        } catch (error) {
            console.error(error) // Log any errors
            res.status(500).json({ error: error.message })
        }
    })

    // Enhanced search route for complex queries
    app.post('/advanced-search', async (req, res) => {
        const { index, body: queryBody } = req.body
        try {
            const { body } = await client.search({
                index,
                body: queryBody,
            })
            res.json(body)
        } catch (error) {
            res.status(500).json({ error: error.message })
        }
    })

    // Vector-based search route
    app.get('/vector-search', async (req, res) => {
        const { search } = req.query // Assume title and description are provided for generating the query vector
        try {
            const queryVector = await getEmbedding(search) // Get embedding for the concatenated text

            const response = await client.search({
                index: "test_vector",
                body: {
                    query: {
                        bool: {
                            must: {
                                script_score: {
                                    query: {
                                        match_all: {}
                                    },
                                    script: {
                                        source: "cosineSimilarity(params.query_vector, 'vector') + 1.0",
                                        params: {
                                            query_vector: queryVector
                                        }
                                    }
                                }
                            }
                        }
                    },
                    _source: {
                        excludes: ["vector"]
                    },
                    // min_score: 1.8
                },
            })
            console.log(response)
            res.json(response.hits.hits)
        } catch (error) {
            console.error(error) // Log any errors
            res.status(500).json({ error: error.message })
        }
    })
    // Route for uploading documents
    app.post('/upload', async (req, res) => {
        const { index, document } = req.body
        try {
            const response = await client.index({
                index,
                body: document,
                refresh: 'true',
            })
            console.log(response) // Log the entire response
            res.json({ result: 'created', _id: response.body })
        } catch (error) {
            console.error(error) // Log the error for more details
            res.status(500).json({ error: error.message })
        }
    })

    // Route for uploading documents
    app.post('/upload-vector', async (req, res) => {
        const { document } = req.body
        document.vector = await getEmbedding(`title: ${document.title}
    description: ${document.description}
    `)
        try {
            const response = await client.index({
                index: 'test_vector',
                body: document,
                refresh: 'true',
            })
            console.log(response)
            res.json({ result: 'created', _id: response.body })
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: error.message })
        }
    })



    // Route for deleting an index
    app.delete('/delete-index', async (req, res) => {
        const { index } = req.body // Get the index to delete from the request body
        try {
            const response = await client.indices.delete({
                index,
            })
            console.log(response) // Log the response for debugging
            res.json({ result: 'deleted', index })
        } catch (error) {
            console.error(error) // Log the error for more details
            if (error.meta && error.meta.body && error.meta.body.error.type === 'index_not_found_exception') {
                res.status(404).json({ error: `Index '${index}' not found` })
            } else {
                res.status(500).json({ error: error.message })
            }
        }
    })
}

module.exports = { search }