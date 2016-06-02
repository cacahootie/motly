
var githubhook = require('githubhook')
var app = require('./app')

var main = function(){
    var github = githubhook()
    var app_instance = app.get_running()

    github.listen();
    github.on('*', function (event, repo, ref, data) {
        console.log("received githubhook restart")
        app.close()
        console.log("previous instance shut down")
        app = app.get_running()
    })
    
}

if (require.main === module) {
    main();
}
