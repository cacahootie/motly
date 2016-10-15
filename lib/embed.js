'use strict'

const urllib = require('url')

const express = require('express')


exports.embed_router = function embed (app) {
    var embed_router = express.Router()
    embed_router.get('/oembed/api', function(req, res) {
        var parsed = urllib.parse(req.query.url).pathname
        req.url = parsed
        req.query.format = 'json'
        return app.handle(req, res)
    })
    app.use('/', embed_router)    
}
