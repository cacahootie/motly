
var fs = require("fs");
var path = require('path');

var express = require('express');
var nunjucks = require("nunjucks");

var basefolder = path.join(__dirname, 'demo');

var app = express();
var router = express.Router();
app.use("/", router);

nunjucks.configure({
    autoescape: true
});

router.get("/", function(req, res) {
    fs.readFile(path.join(basefolder, 'index.html'), function (e, d){
        console.log(d)
        res.end(nunjucks.renderString(d.toString() , {
            "results":[
                {"name":"Nigeria"},
                {"name":"Niger"},
            ]
        }));
    }); 
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