
var fs = require("fs");
var path = require('path');

var express = require('express');
var github = require("github-api");
var nunjucks = require("nunjucks");
var request = require('superagent');

var basefolder = path.join(__dirname, 'demo');

var git = new github();
var repo = git.getRepo('cacahootie', 'motly');

var app = express();
var router = express.Router();
app.use("/", router);

nunjucks.configure({
    autoescape: true
});

var get_config = function(fname) {
    return JSON.parse(fs.readFileSync(path.join(basefolder, fname)).toString())
}

var config = get_config('config.json');

var GetData = function(robj, cb) {
    request
      .get(robj.url)
      .end(cb);
}

var GetTemplate = function(env, fname, cb) {
    if (env.github) {
        return repo.getContents('master', 'demo/index.html', 'raw', cb)
    } else if (env.local) {
        return fs.readFile(path.join(basefolder, 'index.html'), cb);    
    }
}

var RenderData = function(context, res) {
    GetTemplate({"github":true}, "demo/index.html", function (e, d){
        res.end(nunjucks.renderString(d.toString(), context));
    });
}

var MakeRoute = function(route) {
    router.get(route, function(req, res) {
        GetData(config[route].context, function(e, d) {
            RenderData(d.body, res)
        });
    });
}

for (var route in config) {
    if (!config.hasOwnProperty(route)) continue;
    MakeRoute(route)
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
