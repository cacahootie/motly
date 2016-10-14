
var urllib = require('url')

var express = require('express')
var morgan = require("morgan")

var template = require('./template')
var route_processor = require('./route_processor')

var configuration = require('./configuration')

exports.get_instance = function(project_dir) {
    var env = configuration.get_env(project_dir)
    var app = express()
    app.env = env

    env.route_processor = route_processor.NewProcessor(app)
    env.templater = template.NewEngine(app)

    var embed_router = express.Router()
    embed_router.get('/oembed/api', function(req, res) {
        var parsed = urllib.parse(req.query.url).pathname
        req.url = parsed
        req.query.format = 'json'
        return app.handle(req, res)
    })
    app.use('/', embed_router)
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
    var port = process.env.PORT || 8000
    return app.listen(port, '127.0.0.1', function(e) {
        console.log("Running motly on port: " + port)
    })
}
