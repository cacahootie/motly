'use strict'

const urllib = require('url')

const nunjucks = require("nunjucks"),
      _ = require("lodash")

const context = require("./context"),
      github = require("./github"),
      GitLoader = require("./gitloader").GitLoader,
      log = require("./logger").log


exports.NewEngine = function (app) {
    let self = {},
        env = app.env,
        nuns = {}

    nunjucks.configure({
        autoescape: true,
        noCache: env.NOCACHE
    })

    function get_nunenv(user, repo, branch) {
        let key = `${ user }:${ repo }:${ branch }`
        if (!nuns[key]) {
            nuns[key] = new nunjucks.Environment(
                new GitLoader(app, user, repo, branch)
            )
        }
        return nuns[key]
    }

    function render_embed(cfg, res, d) {
        let embed = {
            "version": "1.0",
            "type": "rich",
            "html":d,
            "width": 990,
            "height": 300,
            "title": "",
            "url": "",
            "author_name": "",
            "author_url": "",
            "provider_name": "",
            "provider_url": ""
        }
        if (cfg.embed) {
            for (let key in cfg.embed.meta) {
                if (!cfg.embed.meta.hasOwnProperty(key)) continue
                embed[key] = cfg.embed.meta[key]
            }
        }
        return res.json(embed)
    }

    function render(user, repo, cfg, context, res, req) {
        context.req = req
        if (env.local) {
            context.static_base = ""
        } else {
            context.static_base = 
                `${ env.public_static_base }/${ user }/${ repo }/${ req.params.branch }/`
        }
        get_nunenv(user, repo, req.params.branch).render(
            req.query.format === 'json' && cfg.embed && cfg.embed.template ? 
                cfg.embed.template : cfg.template,
            context,
            function (e,d) {
                if (req.query.format === 'json') {
                    res.header("Content-Type", "application/json")
                    return render_embed(cfg, res, d)
                } else {
                    res.header("Content-Type", "text/html")
                    return res.end(d)
                }
            }
        )
    }

    self.GetSource = function(user, repo, branch, name, cb) {
        return github.get_github_source(app, user, repo, branch, name, cb)
    }

    self.GetJson = function(user, repo, branch, name, cb) {
        return github.get_github_json(app, user, repo, branch, name, cb)
    }

    self.GetHandler = function(config, user, repo, route, router) {
        let handler = function(req, res) {
            let robj = {}
            if (config[route].context) {
                robj = _.clone(config[route].context)
            }
            robj.req = req
            req.queryString = urllib.parse(req.url).query
            context.getContext(env, robj, function(e, d) {
                if (e) {
                    // log(app, e)
                }
                if (req.query.context == 'true') {
                    return res.json(d)
                } else {
                    return render(user, repo, config[route], d, res, req)
                }
            })
        }

        if (env.local) {
            router.get(route, handler)
        } else {
            router.get('/:branch' + route, handler)
        }
    }

    return self;
}
