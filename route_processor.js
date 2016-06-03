
var fs = require('fs')
var path = require('path')

var express = require('express')

exports.NewProcessor = function(app) {
    var self = {},
        env = app.env

    var basefolder = env.project_dir || ''

    self.get_local_json = function(fname) {
        return JSON.parse(fs.readFileSync(path.join(basefolder, fname)).toString())
    }

    self.get_local_text = function(fname) {
        return fs.readFileSync(fname).toString()
    }

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
            env.templater.GetHandler(config, repo, route, router)
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

    self.Routes = function () {
        if (env.github) {
            var whitelist_repo = env.git.getRepo(process.env.GH_USER, process.env.GH_REPO)
            env.templater.GetTemplateSource(whitelist_repo, "whitelist.json", function (e, whitelist) {
                if (e) console.log(e)
                whitelist.forEach(function(d) {
                    self.RoutesFromRepo(d.username, d.repository)
                })
            })
        } else {
            console.log("\nInitializing routes from local\n")
            var config = self.get_local_json('config.json')
            self.RoutesFromConfig(false, false, config)
        }
    }

    return self
}
