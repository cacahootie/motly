# motly
templating server which merges web-service json with nunjucks templates.

# installation
`npn instasll motly`

# usage
This application has two usage modes, local development and github mode.  In
local development mode, it uses a `config.json` file either in the current dir,
or defined in the environment variable `PROJECT_DIR`.  The server may be run
using `node main.js`, or run using nodemon and the included nodemon file
(recommended)
