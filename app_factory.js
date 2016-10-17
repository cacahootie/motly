'use strict'

const express = require('express')

const template = require('./lib/template'),
      routes = require('./lib/routes').routes,
      embed = require('./handlers/embed').embed,
      status = require('./handlers/status').status,
      errors = require('./handlers/errors').errors,
      configuration = require('./lib/configuration').get_env,
      log = require('./lib/logger').log


exports.get_instance = function(project_dir, NODE_ENV) {
    let app = express()

    app.env = configuration(project_dir, NODE_ENV)
    app.env.templater = template.NewEngine(app)

    embed(app)
    status(app)
    errors(app)
    routes(app)

    return app
}

exports.get_running = function() {
    let app = exports.get_instance()
    return app.listen(app.env.PORT, '127.0.0.1', function(e) {
        log(app, "Running motly on port: " + app.env.PORT)
    })
}
