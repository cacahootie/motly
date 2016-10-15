'use strict'

const express = require('express'),
      morgan = require("morgan")

const template = require('./lib/template'),
      route_processor = require('./lib/route_processor'),
      embed = require('./lib/embed')

const configuration = require('./lib/configuration')

exports.get_instance = function(project_dir) {
    var env = configuration.get_env(project_dir)
    var app = express()
    app.env = env

    env.route_processor = route_processor.NewProcessor(app)
    env.templater = template.NewEngine(app)

    embed.embed_router(app)

    app.get('/status', function(req, res) {
        res.end(env.version)
    })

    env.route_processor.Routes()

    app.use(function(err, req, res, next) {
        console.error(err.stack)
        res.status(500).send('Something broke!')
    })
    app.use(morgan('combined'))

    return app
}

exports.get_running = function() {
    var app = exports.get_instance()
    var port = app.env.PORT
    return app.listen(port, '127.0.0.1', function(e) {
        console.log("Running motly on port: " + port)
    })
}
