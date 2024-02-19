const { search } = require("./search")
const { seeddms } = require("./seeddms")

const server = (app) => {
    search(app)
    seeddms(app)
}

module.exports = { server }