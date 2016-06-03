
var fs = require('fs')
var path = require('path')

var github = require("github-api")
var nunjucks = require("nunjucks")
var request = require('superagent')

var getters = require('./getters')

var basefolder = path.join(__dirname)

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
        console.log("Getting source for: " + name)
        if (this.env.github) {
            this.repo.getContents('master', name, 'raw', function(e,src) {
                cb(e,{
                    src: src,
                    path: name,
                    noCache: false
                })
            })
        } else if (this.env.local) {
            fs.readFile(path.join(basefolder, '../motly-test/' + name), function(e,src) {
                cb(e,{
                    src: src,
                    path: name,
                    noCache: false
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
            nuns[repo.__fullname] = new nunjucks.Environment(new GitLoader(env, repo))
        }
        return nuns[repo.__fullname]
    }

    self.GetTemplateSource = function(repo, name, cb) {
        console.log("Getting: " + name) 
        return repo.getContents('master', name, 'raw', cb)
    }

    self.RenderData = function(repo, context, res) {
        get_nunenv(repo).render('index.html', context, function (e,d) {
            res.end(d)
        })
        
    }

    self.MakeRoute = function(config, repo, route, router) {
        router.get(route, function(req, res) {
            getters.get_context_data(config[route].context, function(e, d) {
                self.RenderData(repo, d.body, res)
            })
        })
    }

    return self;
}
