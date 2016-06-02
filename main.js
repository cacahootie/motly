
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
var git = env.git
var GetTemplateSource = env.templater.GetTemplateSource
var RenderData = env.templater.RenderData
var MakeRoute = env.templater.MakeRoute

if (env.github) {
    var whitelist_repo = git.getRepo(process.env.GH_USER, process.env.GH_REPO)
    GetTemplateSource(whitelist_repo, "whitelist.json", function (e, whitelist) {
        if (e) console.log(e)
        whitelist.forEach(function(d) {
            env.route_processor.RoutesFromRepo(d.username, d.repository);
        })
    })
} else {
    console.log("\nInitializing routes from local\n");
    var config = getters.get_local_json('config.json');
    env.route_processor.RoutesFromConfig(false, false, config);
}

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
