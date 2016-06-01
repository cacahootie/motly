
var fs = require("fs");
var path = require('path');

var express = require('express');
var nunjucks = require("nunjucks");
var request = require('superagent');

var basefolder = path.join(__dirname, 'demo');

var app = express();
var router = express.Router();
app.use("/", router);

nunjucks.configure({
    autoescape: true
});

var config = JSON.parse(
    fs.readFileSync(path.join(basefolder, 'config.json')).toString()
);

var GetData = function(robj, res) {
    console.log(robj.url)
    request
      .get(robj.url)
      .end(function(e, d){
        RenderData(d.body, res)
      });
}

var RenderData = function(context, res) {
    fs.readFile(path.join(basefolder, 'index.html'), function (e, d){
        res.end(nunjucks.renderString(d.toString(), context));
    });
}

var MakeRoute = function(route) {
    router.get(route, function(req, res) {
        GetData(config[route].context, res);
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