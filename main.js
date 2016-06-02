
var fs = require("fs")
var path = require('path')

var express = require('express')
var github = require("github-api")
var morgan = require("morgan");

var getters = require('./getters')
var template = require('./template')
var configuration = require('./configuration')
var route_processor = require('./route_processor')

var env = configuration.get_env()

var app = express();

env.templater = template.NewEngine(env)
env.route_processor = route_processor.NewProcessor(app, env)
env.git = new github({token: getters.get_local_text('.github_token')});
var GetTemplateSource = env.templater.GetTemplateSource
var RenderData = env.templater.RenderData
var MakeRoute = env.templater.MakeRoute

env.route_processor.Routes()

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!')
})
app.use(morgan('combined'))

exports.app = app;

var main = function(){
    var port = process.env.PORT || 8000;
    app.listen(port, '127.0.0.1', function(e) {
        console.log("Running motly on port: " + port)
    })
}

if (require.main === module) {
    main();
}
