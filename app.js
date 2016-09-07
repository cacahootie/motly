#!/usr/bin/env node

var githubhook = require('githubhook')
var app = require('./app_factory')

var main = function(){
    var app_instance = app.get_running()
    var github = githubhook({
        secret: app_instance.__githubtoken
    })
    github.listen()
    github.on('*', function (event, repo, ref, data) {
        console.log("received githubhook restart")
        app_instance.close()
        console.log("previous instance shut down")
        app_instance = app.get_running()
    })   
}

main()
