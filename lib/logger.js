'use strict'

function shouldLog (app) {
    if (!app) return false

    let env = app.NODE_ENV ? app : app.env

    if (env.NODE_ENV == 'development' || env.NODE_ENV == 'debug') {
        return true
    }
    return false
}

exports.shouldLog = shouldLog

exports.log = function log (app, msg) {
    if (shouldLog(app)) {
        console.log(msg)
    }
}
