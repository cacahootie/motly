
var githubhook = require('githubhook')
var app = require('./app')

var getters = require('./getters')

var main = function(){
    var github = githubhook({
        secret: getters.get_local_text('.github_token')
    })
    var app_instance = app.get_running()

    github.listen();
    github.on('*', function (event, repo, ref, data) {
        console.log("received githubhook restart")
        app_instance.close()
        console.log("previous instance shut down")
        app_instance = app.get_running()
    })
    
}

if (require.main === module) {
    main();
}
