
var fs = require('fs')
var path = require('path')

var request = require('superagent')

var basefolder = path.join(__dirname)

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
