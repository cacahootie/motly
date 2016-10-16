'use strict'

const morgan = require("morgan")

exports.errors = function (app) {
    app.use(function(err, req, res, next) {
        console.error(err.stack)
        res.status(500).send('Something broke!')
    })
    app.use(morgan('combined'))
}
