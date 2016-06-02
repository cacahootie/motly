
var fs = require('fs')
var path = require('path')

var github = require("github-api");
var nunjucks = require("nunjucks");
var request = require('superagent')

var basefolder = path.join(__dirname)

nunjucks.configure({
    autoescape: true
});

exports.get_local_text = function(fname) {
    return fs.readFileSync(fname).toString()
}

exports.get_local_json = function(fname) {
    return JSON.parse(fs.readFileSync(path.join(basefolder, '../motly-test', fname)).toString())
}

exports.GetContextData = function(robj, cb) {
    request
      .get(robj.url)
      .end(cb)
}

exports.NewEngine = function (env) {
    var self = {};

    self.GetTemplateSource = function(repo, fname, cb) {
        if (env.github) {
            console.log("Getting: " + fname) 
            return repo.getContents('master', fname, 'raw', cb)
        } else if (env.local) {
            return fs.readFile(path.join(basefolder, '../motly-test/' + fname), cb)
        }
    }

    self.RenderData = function(repo, context, res) {
        self.GetTemplateSource(repo, "index.html", function (e, d){
            res.end(nunjucks.renderString(d.toString(), context))
        });
    }

    self.MakeRoute = function(config, repo, route, router) {
        router.get(route, function(req, res) {
            exports.GetContextData(config[route].context, function(e, d) {
                self.RenderData(repo, d.body, res)
            })
        })
    }

    return self;
}
