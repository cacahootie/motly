'use strict'

const mCache = require('memory-cache')
let redis = false

if (process.env.LOCAL_REDIS) {
    redis = require('redis')
}

exports.cache = function cache (app) {
    const self = {}
    let cache

    if (process.env.LOCAL_REDIS) {
        cache = redis.createClient()
    } else {
        cache = mCache
    }

    self.put = function put (key, item) {
        cache.put(key, item)
    }

    self.get = function get (key, cb) {
        let value = cache.get(key)
        cb(null, value)
    }

    app.locals.cache = self
    return self
}
