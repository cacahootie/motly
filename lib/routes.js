'use strict'

const fs = require('fs'),
      path = require('path')

const express = require('express')

const log = require('./logger').log

exports.routes = function(app) {
    let env = app.env,
        basefolder = env.project_dir || ''

    function get_local_json (basefolder, fname) {
        return JSON.parse(
            fs.readFileSync(
                path.join(basefolder, fname)
            ).toString()
        )
    }

    function RoutesFromConfig (user, repo, config) {
        let router = express.Router({strict: true})
        
        router.get('/favicon.ico', function(req, res) {
            res.status(404).send("Ain't here")
        })

        if (env.local) {
            var static_path = path.join(env.project_dir, 'static')
            app.use("/", router)
            app.use("/static", express.static(static_path))
            log(app, `Static set up to ${ static_path }`)
        } else {
            app.use("/" + user + '/' + repo, router)
        }
        for (let route of Object.keys(config)) {
            if (repo) {
                log(app, "\nInitializing route: /" + repo + route)
            } else {
                log(app, "\nInitializing route: " + route)
            }
            if (config[route].context && config[route].context.url) {
                log(app, "Route context from: " + config[route].context.url)
            }
            env.templater.GetHandler(config, user, repo, route, router)
        }
    }

    function RoutesFromRepo (user, repo) {
        log(app, "\nInitializing routes from repo: " + repo)
        env.templater.GetJson(user, repo, 'master', 'config.json', function(e, d) {
            RoutesFromConfig(user, repo, d)
        });
        app.get('/:user/:repo/:branch/static/*', function(req, res) {
            res.redirect(env.public_static_base + req.url)
        })
    }

    function local_routes () {
        log(app, "\nInitializing routes from local")
        var config = get_local_json(basefolder, 'config.json')
        RoutesFromConfig(false, false, config)
    }

    function git_routes () {
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

    function generateRoutes () {
        if (env.github) {
            return git_routes()
        } else {
            return local_routes()
        }
    }

    return generateRoutes()
}
