var parallel = require('run-parallel'),
    request = require('superagent'),
    nunjucks = require("nunjucks"),
    parallel = require('run-parallel')


function do_request(env, robj, cb) {
    var url = nunjucks.renderString(robj.url, robj)
    if (env && env.NOCACHE) {
        url += '?cachebuster=' + Date.now()
    }
    console.log('getting: ' + url)
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

function request_closure(env, robj) {
    return function(c) {
        do_request(env, robj,c)
    }
}

function nested_closure(env, robj) {
    return function(c) {
        exports.getContext(env, robj, c)
    }
}

exports.getContext = function getContext (env, robj, cb) {
    if (robj.url) {
        return do_request(env, robj, cb)
    }
    var pobj = {}
    for (var r in robj) {
        if (r == 'req') continue
        robj[r].req = robj.req
        if (robj[r].url) {
            pobj[r] = request_closure(env, robj[r])
        } else {
            pobj[r] = nested_closure(env, robj[r])
        }
    }
    parallel(pobj, function(e, results) {
        return cb(e, results)
    })
}
