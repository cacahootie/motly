
var fs = require('fs')
var path = require('path')

var express = require('express')

exports.NewProcessor = function(app) {
    var self = {},
        env = app.env

    var basefolder = env.project_dir || ''

    self.get_local_json = function(fname) {
        return JSON.parse(
            fs.readFileSync(path.join(basefolder, fname)).toString()
        )
    }

    self.get_local_text = function(fname) {
        try {
            return fs.readFileSync(fname).toString()
        } catch (e) {
            return null
        }
    }

    var RoutesFromConfig = function(repo, prefix, config) {
        var router = express.Router({strict: true})
        if (env.local) {
            app.use("/", router)
        }
        app.use("/" + prefix, router)
        for (var route in config) {
            if (!config.hasOwnProperty(route)) continue
            console.log("Initializing route: /" + prefix + route)
            if (config[route].context) {
                console.log("Route context from: " + config[route].context.url + "\n")
            }
            env.templater.GetHandler(config, repo, route, router)
        }
    }

    var RoutesFromRepo = function(user, repo) {
        console.log("\nInitializing routes from repo: " + repo + "\n")
        var prefix = repo,
            gh_repo = env.git.getRepo(user, repo);
        env.templater.GetSource(gh_repo, 'config.json', function(e, d) {
            RoutesFromConfig(gh_repo, prefix, d)
        });
    }

    var local_routes = function () {
        console.log("\nInitializing routes from local\n")
        var config = self.get_local_json('config.json')
        RoutesFromConfig(false, false, config)
    }

    var git_routes = function () {
        var whitelist_repo = env.git.getRepo(
            env.whitelist_gh_user, env.whitelist_gh_repo
        )
        env.templater.GetSource(
            whitelist_repo,
            "whitelist.json",
            function (e, whitelist) {
                if (e) return console.log(e)
                whitelist.forEach(function(d) {
                    RoutesFromRepo(d.username, d.repository)
                })
            }
        )
    }

    self.Routes = function () {
        if (env.github) return git_routes()
        return local_routes()
    }

    return self
}
