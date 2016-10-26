'use strict'

const request = require("superagent"),
      sa_logger = require("superagent-logger")

const shouldLog = require("./logger").shouldLog

function get_github_base(app, user, repo, branch, name, cb, attr) {
    const env = app.env,
          url = `${ env.static_base }/${ user }/${ repo }/${ branch }/${ name }`,
          r = request.get(url)

    if ( shouldLog(env) ) {
        r.use(sa_logger)
    }

    r.end(function(e,d) {
        if (d && d[attr]) {
            app.locals.cache.put(url, d)
            return cb(e, d[attr])
        } else {
            app.locals.cache.get(url, (e, d) => {
                if (d && d[attr]) {
                    cb(null, d[attr])
                } else {
                    cb(new Error(`no data for ${ url }`), null)
                }
            })
        }
    })
}

exports.get_github_source = function(app, user, repo, branch, name, cb) {
    return get_github_base(app, user, repo, branch, name, cb, 'text')
}

exports.get_github_json = function(app, user, repo, branch, name, cb) {
    return get_github_base(app, user, repo, branch, name, cb, 'body')
}
