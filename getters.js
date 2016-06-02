
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

exports.getter_environment = function (env) {
    var self = {};
    
    if (env.github) {
        self.git = new github()
    }

    self.get_local_json = function(fname) {
        return JSON.parse(fs.readFileSync(path.join(basefolder, '../motly-test', fname)).toString())
    }

    self.GetTemplateSource = function(repo, fname, cb) {
        if (env.github) {
            console.log("Getting: " + fname) 
            return repo.getContents('master', fname, 'raw', cb)
        } else if (env.local) {
            return fs.readFile(path.join(basefolder, '../motly-test/' + fname), cb)
        }
    }

    self.GetData = function(robj, cb) {
        request
          .get(robj.url)
          .end(cb)
    }

    self.RenderData = function(repo, context, res) {
        self.GetTemplateSource(repo, "index.html", function (e, d){
            res.end(nunjucks.renderString(d.toString(), context))
        });
    }

    return self;
}
