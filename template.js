
var fs = require('fs')
var path = require('path')
var urllib = require('url')

var cache = require('memory-cache')
var github = require("github-api")
var nunjucks = require("nunjucks")
var parallel = require('run-parallel')
var request = require('superagent')

nunjucks.configure({
    autoescape: true
})

var GitLoader = nunjucks.Loader.extend({
    async: true,

    init: function(env, repo, branch) {
        this.repo = repo
        this.env = env
        this.branch = branch || 'master'
    },

    getSource: function(name, cb) {
        var getContents = function(repo, branch, name, cb) {
            repo.getContents(branch, name, 'raw', cb)
        }

        var env = this.env,
            noCache = env.NOCACHE

        if (this.env.github) {
            var branch = this.branch
            console.log("Getting source for: " + name)
            getContents(this.repo, branch, name, function(e,src) {
                if (e) {
                    return getContents(env.base_repo, 'master', name, function (e, src) {
                        console.log("Got source from base for: " + name)
                        cb(e,{
                            src: src,
                            path: name,
                            noCache: noCache
                        })
                    })
                }
                console.log("Got source from project for: " + name + " from branch: " + branch)
                cb(e,{
                    src: src,
                    path: name,
                    noCache: noCache
                })
            })
        } else if (this.env.local) {
            fs.readFile(path.join(this.env.project_dir || '', name), function(e,src) {
                cb(e,{
                    src: src,
                    path: name,
                    noCache: noCache
                })
            })
        }
    }
});

exports.NewEngine = function (app) {
    var self = {},
        env = app.env,
        nuns = {}

    var get_nunenv = function(repo, branch) {
        var key = repo.__fullname + ":" + branch
        if (!nuns[key]) {
            nuns[key] = new nunjucks.Environment(
                new GitLoader(env, repo, branch)
            )
        }
        return nuns[key]
    }

    var do_request = function (robj, cb) {
        var url = nunjucks.renderString(robj.url, robj)
        var cresult = cache.get(url)
        if (robj.ttl) {
            if (cresult) return cb(null, cresult)
        }
        console.log('getting: ' + url)
        var r = request[robj.method || 'get'](url)
        if (robj.method == 'post') {
            r.send(robj.body)
        }
        r.end(function(e,d) {
            if (typeof(d) === 'undefined') {
                return cb(new Error("no data"), null)
            }
            if (d.body[0]) {
                var results = {"items": d.body}
                cache.put(url, results, 1000 * 60)
                return cb(e, results)
            }
            if (robj.ttl) cache.put(url, d.body, robj.ttl)
            return cb(e, d.body)
        })
    }

    var request_closure = function(robj) {
        return function(c) {
            do_request(robj,c)
        }
    }

    var get_context_data = function(robj, cb) {
        if (robj.url) {
            return do_request(robj, cb)
        }
        var pobj = {}
        for (var r in robj) {
            if (r == 'req') continue
            pobj[r] = request_closure(robj[r])
        }
        parallel(pobj, function(e, results) {
            return cb(e, results)
        })
    }

    var render_data = function(repo, cfg, context, res, req) {
        context.req = req
        get_nunenv(repo, req.params.branch).render(cfg.template, context, function (e,d) {
            if (cfg.ttl) cache.put(req.url, d, cfg.ttl)
            res.end(d)
        })
    }

    self.GetSource = function(repo, name, cb) {
        console.log("Getting: " + name)
        return repo.getContents('master', name, 'raw', cb)
    }

    self.GetHandler = function(config, repo, route, router) {
        var handler = function(req, res) {
            if (config[route].ttl) {
                var cresult = cache.get(req.url)
                if (cresult) return res.end(cresult)
            }
            var robj = {}
            if (config[route].context) {
                robj = JSON.parse(JSON.stringify(config[route].context))
            }
            robj.req = req
            req.queryString = urllib.parse(req.url).query
            get_context_data(robj, function(e, d) {
                render_data(repo, config[route], d, res, req)
            })
        }

        router.get('/:branch' + route, handler)
        router.get(route, handler)
    }

    return self;
}
