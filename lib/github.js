'use strict'

const request = require("superagent")

var get_github_base = function(env, user, repo, branch, name, cb, attr) {
    console.log(`Getting: ${ name }`)
    const url = `${ env.static_base }/${ user }/${ repo }/${ branch }/${ name }`
        r = request.get(url)

    console.log(`Getting ${ url }`)
    r.end(function(e,d) {
        if (d && d[attr]) {
            return cb(e, d[attr])
        }
        return cb(new Error("no data"), null)
    })
}

var get_github_source = function(env, user, repo, branch, name, cb) {
    return get_github_base(env, user, repo, branch, name, cb, 'text')
}

var get_github_json = function(env, user, repo, branch, name, cb) {
    return get_github_base(env, user, repo, branch, name, cb, 'body')
}
