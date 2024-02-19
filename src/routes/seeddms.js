const { Document } = require("../models/document_model")

const seeddms = (app) => {
    app.get('/api/documents', async (req, res) => {
        try {
            const response = await Document.findAll()
            res.status(200).json({
                code: 200,
                data: response
            })
        }
        catch (e) {
            res.status(400).json({
                code: 400,
                message: e
            })
        }
    })
    app.get('/api/document/:id', async (req, res) => {
        const { id } = req.params
        try {
            const response = await Document.findOne({ where: { id } })
            res.status(200).json({
                code: 200,
                data: response
            })
        }
        catch (e) {
            res.status(400).json({
                code: 400,
                message: e
            })
        }
    })
}
module.exports = { seeddms }