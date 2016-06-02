
var fs = require("fs");
var path = require('path');

var express = require('express');
var github = require("github-api");
var morgan = require("morgan");


var getters = require('./getters')
var get_local_text = getters.get_local_text

var env = {'local': true}
if (process.env.GITHUB || process.env.GH_REPO) {
    var git = new github({token: get_local_text('.github_token')});
    env = {'github':true}
}

var app = express();

getters = getters.getter_environment(env)
var get_local_json = getters.get_local_json
var GetTemplateSource = getters.GetTemplateSource
var GetData = getters.GetData
var RenderData = getters.RenderData


var MakeRoute = function(config, repo, route, router) {
    router.get(route, function(req, res) {
        GetData(config[route].context, function(e, d) {
            RenderData(repo, d.body, res)
        });
    });
}

var RoutesFromConfig = function(repo, prefix, config) {
    var router = express.Router()
    if (env.local) {
        app.use("/", router)
    }
    app.use("/" + prefix, router);
    for (var route in config) {
        if (!config.hasOwnProperty(route)) continue
        console.log("Initializing route: /" + prefix + route)
        console.log("Route context from: " + config[route].context.url + "\n")
        MakeRoute(config, repo, route, router)
    }
}

var RoutesFromRepo = function(user, repo) {
    console.log("\nInitializing routes from repo: " + repo + "\n");
    var prefix = repo,
        gh_repo = git.getRepo(user, repo);
    GetTemplateSource(gh_repo, 'config.json', function(e, d) {
        RoutesFromConfig(gh_repo, prefix, d);
    });
}

if (env.github) {
    var repo = git.getRepo(process.env.GH_USER, process.env.GH_REPO)
    GetTemplateSource(repo, "whitelist.json", function (e, whitelist) {
        console.log(e)
        whitelist.forEach(function(d) {
            RoutesFromRepo(d.username, d.repository);
        })
    })
} else {
    console.log("\nInitializing routes from local\n");
    var config = get_local_json('config.json');
    RoutesFromConfig(false, false, config);
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
