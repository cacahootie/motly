'use strict'

const express = require('express')

const template = require('./lib/template'),
      routes = require('./lib/route_processor'),
      embed = require('./handlers/embed').embed,
      status = require('./handlers/status').status,
      errors = require('./handlers/errors').errors,
      configuration = require('./lib/configuration').get_env


exports.get_instance = function(project_dir) {
    let app = express()
    app.env = configuration(project_dir),
    app.env.templater = template.NewEngine(app)

    embed(app)
    status(app)
    errors(app)
    routes.NewProcessor(app).Routes()

    return app
}

exports.get_running = function() {
    let app = exports.get_instance()
    return app.listen(app.env.PORT, '127.0.0.1', function(e) {
        console.log("Running motly on port: " + app.env.PORT)
    })
}
