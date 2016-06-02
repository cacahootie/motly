
var express = require('express')
var github = require("github-api")

var getters = require('./getters')

var git = new github({token: getters.get_local_text('.github_token')});

exports.NewProcessor = function(app, env) {
    
    var self = {}

    self.RoutesFromConfig = function(repo, prefix, config) {
        var router = express.Router()
        if (env.local) {
            app.use("/", router)
        }
        app.use("/" + prefix, router)
        for (var route in config) {
            if (!config.hasOwnProperty(route)) continue
            console.log("Initializing route: /" + prefix + route)
            console.log("Route context from: " + config[route].context.url + "\n")
            env.templater.MakeRoute(config, repo, route, router)
        }
    }

    self.RoutesFromRepo = function(user, repo) {
        console.log("\nInitializing routes from repo: " + repo + "\n")
        var prefix = repo,
            gh_repo = env.git.getRepo(user, repo);
        env.templater.GetTemplateSource(gh_repo, 'config.json', function(e, d) {
            self.RoutesFromConfig(gh_repo, prefix, d)
        });
    }

    return self
}
