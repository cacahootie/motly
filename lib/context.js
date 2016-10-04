var parallel = require('run-parallel'),
    request = require('superagent'),
    nunjucks = require("nunjucks"),
    parallel = require('run-parallel')

var env = null

function do_request(robj, cb) {
    var url = nunjucks.renderString(robj.url, robj)
    console.log('getting: ' + url)
    if (env && env.NOCACHE) {
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
        } else {
            return cb(e, d.body)
        }
    })
}

function request_closure(robj) {
    return function(c) {
        do_request(robj,c)
    }
}

function nested_closure(robj) {
    return function(c) {
        exports.getContext(robj, c)
    }
}

exports.getContext = function getContext (robj, cb) {
    if (robj.url) {
        return do_request(robj, cb)
    }
    var pobj = {}
    for (var r in robj) {
        if (r == 'req') continue
        robj[r].req = robj.req
        if (robj[r].url) {
            pobj[r] = request_closure(robj[r])
        } else {
            pobj[r] = nested_closure(robj[r])
        }
    }
    parallel(pobj, function(e, results) {
        return cb(e, results)
    })
}
