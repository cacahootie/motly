
var fs = require('fs')
var path = require('path')
var urllib = require('url')

var cache = require('memory-cache')
var nunjucks = require("nunjucks")
var parallel = require('run-parallel')
var request = require('superagent')

nunjucks.configure({ autoescape: true })


var get_github_base = function(env, user, repo, branch, name, cb, attr) {
    var url = env.static_base + "/" + user + "/" + repo + "/" + branch + "/" + name,
        r = request.get(url)

    console.log("Getting " + url)
    r.end(function(e,d) {
        if (d && d[attr]) {
            return cb(e, d[attr])
        }
        return cb(new Error("no data"), null)
    })
}

var get_github_source = function(env, user, repo, branch, name, cb) {
    return get_github_base(env, user, repo, branch, name, cb, 'text')
}

var get_github_json = function(env, user, repo, branch, name, cb) {
    return get_github_base(env, user, repo, branch, name, cb, 'body')
}

var GitLoader = nunjucks.Loader.extend({
    async: true,

    init: function(env, user, repo, branch) {
        this.user = user
        this.repo = repo
        this.env = env
        this.branch = branch || 'master'
    },

    getSource: function(name, cb) {
        var user = this.user,
            repo = this.repo,
            branch = this.branch,
            env = this.env,
            noCache = env.NOCACHE

        function package_result(e, src) {
            return cb(e, {
                src: src,
                path: name,
                noCache: noCache
            })
        }

        if (env.github) {
            var branch = this.branch
            console.log("Getting source for: " + name)
            get_github_source(env, user, repo, branch, name, function(e,src) {
                if (e) {
                    return get_github_source(env, env.base_user, env.base_repo_name, 'master', name, function (e, src) {
                        console.log("Got source from base for: " + name)
                        package_result(e, src)
                    })
                }
                console.log("Got source from project for: " + name + " from branch: " + branch)
                package_result(e, src)
            })
        } else if (env.local) {
            fs.readFile(path.join(env.project_dir || '', name), function(e,src) {
                if (!src) {
                    console.log(path.join(env.base_dir, name))
                    fs.readFile(path.join(env.base_dir, name), function(e,src) {
                        package_result(e, src.toString('utf8'))
                    })
                } else {
                    package_result(e, src.toString('utf8'))
                }
            })
        }
    }
})

exports.NewEngine = function (app) {
    var self = {},
        env = app.env,
        nuns = {}

    function get_nunenv(user, repo, branch) {
        var key = user + ':' + repo + ":" + branch
        if (!nuns[key]) {
            nuns[key] = new nunjucks.Environment(
                new GitLoader(env, user, repo, branch)
            )
        }
        return nuns[key]
    }

    function eachRecursive (obj, robj) {
        for (var k in obj) {
            if (typeof obj[k] === 'string') {
                obj[k] = nunjucks.renderString(obj[k], robj)
                continue
            } else if (typeof obj[k] == 'object' && obj[k] !== null) {
                eachRecursive(obj[k], robj)
                continue
            }
        }
        return obj
    }

    function render_object(robj) {
        obj = JSON.parse(JSON.stringify(robj.body))
        return eachRecursive(obj, robj)
    }

    function do_request(robj, cb) {
        var url = nunjucks.renderString(robj.url, robj)
        var cresult = cache.get(url)
        if (robj.ttl) {
            if (cresult) return cb(null, cresult)
        }
        console.log('getting: ' + url)
        if (env.NOCACHE) {
            url += '?cachebuster=' + Date.now()
        }
        var r = request[robj.method || 'get'](url)
        if (robj.method == 'post') {
            r.send(render_object(robj))
        }

        r.end(function(e,d) {
            if (typeof(d) === 'undefined') {
                return cb(new Error("no data"), null)
            }
            if (d.type == 'text/html') {
                return cb(e, d.text)
            } else if (d.body[0]) {
                var results = {"items": d.body}
                cache.put(url, results, 1000 * 60)
                return cb(e, results)
            }
            // if (robj.ttl) cache.put(url, d.body, robj.ttl)
            return cb(e, d.body)
        })
    }

    function request_closure(robj) {
        return function(c) {
            do_request(robj,c)
        }
    }

    function get_context_data(robj, cb) {
        if (robj.url) {
            return do_request(robj, cb)
        }
        var pobj = {}
        for (var r in robj) {
            if (r == 'req') continue
            robj[r].req = robj.req
            pobj[r] = request_closure(robj[r])
        }
        parallel(pobj, function(e, results) {
            return cb(e, results)
        })
    }

    function render_embed(cfg, res, d) {
        var embed = {
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
            for (var key in cfg.embed.meta) {
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
            context.static_base = env.public_static_base + "/" + user + "/" + repo + "/" + req.params.branch + "/"
        }
        get_nunenv(user, repo, req.params.branch).render(
            req.query.format == 'json' && cfg.embed && cfg.embed.template ? 
                cfg.embed.template : cfg.template,
            context,
            function (e,d) {
                if (cfg.ttl) cache.put(req.url, d, cfg.ttl)
                if (req.query.format == 'json') return render_embed(cfg, res, d)
                else return res.end(d)
            }
        )
    }

    self.GetSource = function(user, repo, branch, name, cb) {
        console.log("Getting: " + name)
        return get_github_source(env, user, repo, branch, name, cb)
    }

    self.GetJson = function(user, repo, branch, name, cb) {
        console.log("Getting: " + name)
        return get_github_json(env, user, repo, branch, name, cb)
    }

    self.GetHandler = function(config, user, repo, route, router) {
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
                render(user, repo, config[route], d, res, req)
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
