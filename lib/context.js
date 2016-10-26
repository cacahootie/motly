'use strict'

var parallel = require('run-parallel'),
    request = require('superagent'),
    sa_logger = require('superagent-logger'),
    nunjucks = require("nunjucks")

var shouldLog = require('./logger').shouldLog


function do_request(app, robj, cb) {
    var env = app.env,
        url = nunjucks.renderString(robj.url, robj),
        baseUrl = url
    
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
            if (app && app.locals && app.locals.cache) {
                return app.locals.cache.get(baseUrl, (e, d) => {
                    return cb(null, d)
                })
            } else {
                return cb(null, null)
            }
        }

        let retVal
        if (d.type === 'text/html') {
            retVal = d.text
        } else if (d.body[0]) {
            retVal = { "results": d.body }
        } else {
            retVal = d.body
        }
        if (app && app.locals && app.locals.cache) {
            app.locals.cache.put(baseUrl, retVal)
        }
        return cb(null, retVal)
    })
}

function request_closure(app, robj) {
    return function(c) {
        do_request(app, robj,c)
    }
}

function nested_closure(app, robj) {
    return function(c) {
        exports.getContext(app, robj, c)
    }
}

exports.getContext = function getContext (app, robj, cb) {
    if (robj.url) {
        return do_request(app, robj, cb)
    }
    var pobj = {}
    for (var r in robj) {
        if (r === 'req') continue
        robj[r].req = robj.req
        if (robj[r].url) {
            pobj[r] = request_closure(app, robj[r])
        } else {
            pobj[r] = nested_closure(app, robj[r])
        }
    }
    parallel(pobj, function(e, results) {
        return cb(e, results)
    })
}
