'use strict'

const morgan = require("morgan")

const shouldLog = require("../lib/logger").shouldLog

exports.errors = function (app) {
    app.use(function(err, req, res, next) {
        console.error(err.stack)
        res.status(500).send('Something broke!')
    })
    if ( shouldLog(app) ) {
        app.use(morgan('combined'))
    }
}
