const { getEmbedding } = require("../embedding")
const { Client } = require('@elastic/elasticsearch')
const { Document } = require("../models/document_model")
const client = new Client({ node: 'http://localhost:9200' })
const { Op } = require('sequelize');

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
    app.get('/api/vector-search', async (req, res) => {
        const { search } = req.query
        console.log(search)
        try {
            const queryVector = await getEmbedding(search) // Get embedding for the concatenated text
            console.log(queryVector)
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
                        excludes: ["vector", "text"]
                    },
                    // min_score: 1.8
                },
            })
            const data = response.hits.hits
            console.log(data)
            let arrId = []
            for (let i = 0; i < data.length; i++) {
                arrId.push(data[i]._source.id)
            }
            console.log(arrId)
            const document = await Document.findAll({
                where: {
                    id: {
                        [Op.in]: arrId
                    }
                },
                attributes: { exclude: ['content'] }
            })
            res.status(200).json({ code: 200, data: document })
        } catch (error) {
            console.error(error) // Log any errors
            res.status(500).json({ error: error })
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
        try {
            document.vector = await getEmbedding(`${document.text}`)
            console.log(document)
            const response = await client.index({
                index: 'test_vector',
                body: document,
                refresh: 'true',
            })
            console.log(response)
            res.json({ result: response, _id: response.body })
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