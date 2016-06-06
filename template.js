
var fs = require('fs')
var path = require('path')
var urllib = require('url')

var github = require("github-api")
var nunjucks = require("nunjucks")
var parallel = require('run-parallel')
var request = require('superagent')

nunjucks.configure({
    autoescape: true
})

var GitLoader = nunjucks.Loader.extend({
    async: true,

    init: function(env, repo) {
        this.repo = repo
        this.env = env
    },

    getSource: function(name, cb) {
        var getContents = function(repo, branch, name, cb) {
            repo.getContents(branch, name,'raw', cb)
        }

        console.log("Getting source for: " + name)
        var env = this.env,
            noCache = env.NOCACHE

        if (this.env.github) {
            getContents(this.repo, 'master', name, function(e,src) {
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
                console.log("Got source from project for: " + name)
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

    var get_nunenv = function(repo) {
        if (!nuns[repo.__fullname]) {
            nuns[repo.__fullname] = new nunjucks.Environment(
                new GitLoader(env, repo)
            )
        }
        return nuns[repo.__fullname]
    }

    var do_request = function (robj, cb) {
        var url = nunjucks.renderString(robj.url, robj)
        console.log('getting: ' + url)
        request
          .get(url)
          .end(function(e,d) {
              if (typeof(d) === 'undefined') {
                  return cb(new Error("no data"), null)
              }
              if (d.body[0]) {
                  return cb(e, {"items": d.body})
              }
              cb(e, d.body)
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

    var render_data = function(repo, t_name, context, res) {
        get_nunenv(repo).render(t_name, context, function (e,d) {
            res.end(d)
        })
    }

    self.GetSource = function(repo, name, cb) {
        console.log("Getting: " + name)
        return repo.getContents('master', name, 'raw', cb)
    }

    self.GetHandler = function(config, repo, route, router) {
        router.get(route, function(req, res) {
            var robj = JSON.parse(JSON.stringify(config[route].context))
            robj.req = req
            req.queryString = urllib.parse(req.url).query
            get_context_data(robj, function(e, d) {
                render_data(repo, config[route].template, d, res)
            })
        })
    }

    return self;
}
