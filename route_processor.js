
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

    var RoutesFromConfig = function(user, repo, config) {
        var router = express.Router({strict: true})
        if (env.local) {
            var static_path = path.join(env.project_dir, 'static')
            app.use("/", router)
            app.use("/static", express.static(static_path))
            console.log("Static set up to " + static_path)
        } else {
            app.use("/" + user + '/' + repo, router)
        }
        for (var route in config) {
            if (!config.hasOwnProperty(route)) continue
            if (repo) {
                console.log("\nInitializing route: /" + repo + route)
            } else {
                console.log("\nInitializing route: " + route)
            }
            if (config[route].context && config[route].context.url) {
                console.log("Route context from: " + config[route].context.url)
            }
            env.templater.GetHandler(config, user, repo, route, router)
        }
    }

    var RoutesFromRepo = function(user, repo) {
        console.log("\nInitializing routes from repo: " + repo)
        env.templater.GetJson(user, repo, 'master', 'config.json', function(e, d) {
            RoutesFromConfig(user, repo, d)
        });
        app.get('/:user/:repo/:branch/static/*', function(req, res) {
            res.redirect(env.public_static_base + req.url)
        })
    }

    var local_routes = function () {
        console.log("\nInitializing routes from local")
        var config = self.get_local_json('config.json')
        RoutesFromConfig(false, false, config)
    }

    var git_routes = function () {
        env.templater.GetJson(
            env.whitelist_gh_user,
            env.whitelist_gh_repo,
            'master',
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
