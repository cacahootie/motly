
var main = function(){
    var app = require('./app').get_running()
}

if (require.main === module) {
    main();
}
