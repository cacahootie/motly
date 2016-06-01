
var fs = require("fs");
var path = require('path');

var express = require('express');
var github = require("github-api");
var nunjucks = require("nunjucks");
var request = require('superagent');

var basefolder = path.join(__dirname, 'demo');

var env = {'local': true}
if (process.env.GITHUB || process.env.GH_REPO) {
    var git = new github();
    env = {'github':true}
}

var app = express();
var router = express.Router();
app.use("/", router);

nunjucks.configure({
    autoescape: true
});

var get_local_json = function(fname) {
    return JSON.parse(fs.readFileSync(path.join(basefolder, '../../motly-test', fname)).toString())
}

var whitelist = get_local_json('whitelist.json');

var GetData = function(robj, cb) {
    request
      .get(robj.url)
      .end(cb);
}

var GetGithubSource = function(repo, fname, cb) {
    if (env.github) {
        return repo.getContents('master', fname, 'raw', cb)
    } else if (env.local) {
        return fs.readFile(path.join(basefolder, '../../motly-test/' + fname), cb);    
    }
}

var RenderData = function(repo, context, res) {
    GetGithubSource(repo, "index.html", function (e, d){
        res.end(nunjucks.renderString(d.toString(), context));
    });
}

var MakeRoute = function(config, repo, route) {
    router.get(route, function(req, res) {
        GetData(config[route].context, function(e, d) {
            RenderData(repo, d.body, res)
        });
    });
}

var RoutesFromConfig = function(repo, config) {
    for (var route in config) {
        if (!config.hasOwnProperty(route)) continue;
        MakeRoute(config, repo, route)
    }
}

var RoutesFromRepo = function(user, repo) {
    console.log(repo);
    repo = git.getRepo(user, repo);
    GetGithubSource(repo, 'config.json', function(e, d) {
        RoutesFromConfig(repo, d);
    });
}

if (env.github) {
    if (process.env.GH_REPO && process.env.GH_USER) {
        RoutesFromRepo(process.env.GH_USER, process.env.GH_REPO);
    } else if (whitelist.length > 0) {
        whitelist.forEach(function(d) {
            RoutesFromRepo(d.username, d.repository);
        })
    }
} else {
    var config = get_local_json('config.json');
    RoutesFromConfig(false, config);
}

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

exports.app = app;

var main = function(){
    var port = process.env.PORT || 8000;
    return app.listen(port, '0.0.0.0', function(err) {
        if (!err) {
            if (!process.env.TESTING) {
                console.log("Listening on port: " + port);
            }
        } else {
            process.exit(0);
        }
    });
}

if (require.main === module) {
    main();
}
