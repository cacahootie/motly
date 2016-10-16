'use strict'

const urllib = require('url'),
      express = require('express')


exports.embed = function embed (app) {
    return app.use('/', express.Router().get('/oembed/api', function(req, res) {
        let parsed = urllib.parse(req.query.url).pathname
        req.url = parsed
        req.query.format = 'json'
        return app.handle(req, res)
    }))
}
