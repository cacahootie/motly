var parallel = require('run-parallel'),
    request = require('superagent'),
    sa_logger = require('superagent-logger'),
    nunjucks = require("nunjucks")

var shouldLog = require('./logger').shouldLog


function do_request(env, robj, cb) {
    var url = nunjucks.renderString(robj.url, robj)
    if (env && env.NOCACHE) {
        url += '?cachebuster=' + Date.now()
    }
    var r = request[robj.method || 'get'](url)
    if ( shouldLog(env) ) {
        r.use(sa_logger)
    }
    if (robj.method === 'post') {
        r.send(render_object(robj))
    }

    r.end(function(e,d) {
        if (e) {
            return cb(null, null)
        }
        if (d.type === 'text/html') {
            return cb(null, d.text)
        } else if (d.body[0]) {
            return cb(null, { "results": d.body })
        } else {
            return cb(null, d.body)
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
        if (r === 'req') continue
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
