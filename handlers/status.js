'use strict'

exports.status = function (app) {
    app.get('/status', function(req, res) {
        res.end(app.env.version)
    })
}
