# motly
templating server which merges web-service json with nunjucks templates.

# installation
`npm install -g motly`

# concept
Motly provides a service which can be used for the local development, live
testing and deployment of dynamic HTML templating.  Motly's core goal is to
serve one or more projects that are defined by a JSON file which specifies a
template and one or more back-end apis from which to get a JSON context.  The
idea is to create a "view-only" layer that delegates all handling of data to
different microservices.  One advantage of this approach is that for templates
rendered using publicly accessible apis, the same templates (and filters, and
routing) are able to be used either on the server or the client.

One of the key features of Motly is the ability to set up one server and use
a whitelist system to deploy new projects, transparently providing access to
all branches published in the GitHub repo.  This means that you can develop,
test and deploy code by managing branches in GitHub without any build process
required.  Motly provides github webhooks capability to restart the server
whenever any of the repositories it is serving are modified (well, really,
any webhook you configure with the correct secret will cause the routing to
reload).

Motly is designed with performance and developer ease in mind.  Motly makes use
of nunjucks' caching and compilation capabilities, and also uses an in-memory
cache for data contexts.  The routing system is lazy-loading, which means
that the first time a page is rendered, the template is fetched from github,
compiled then rendered.  However, the next time, the cached, compiled template
will be used, resulting in quick performance.  The further benefit is that the
server only loads routes that are needed, rather than pre-loading every branch
in every project.

# usage
This application has two usage modes, local development and github mode.  In
local development mode, it uses a `config.json` file either in the current dir,
or defined in the environment variable `PROJECT_DIR`.  In GitHub mode, the
`GH_USER` and `GH_REPO` environment variables are used to define a location
to look for either a `whitelist.json` or a `config.json`.  In the case of
finding a whitelist, the server will parse the whitelist and instantiate the
multiple GitHub repositories defined, each of which should have a `config.json`
which will be used for that project.

The server may be run using `node main.js`, or run using nodemon and the
included nodemon file (recommended), or using some more complex solution of your
choosing.

# template projects
A project is either a local folder or a github repository which contains a
`config.json` with the appropriate structure, namely, and object with keys
corresponding to routes (starting with `/`), where the values are objects
which describe the route using keys such as `template` and `context`, as well
as other optional keys.

### single route example
```javascript
{
    "/posts/":{
        "template":"posts.html",
        "ttl":60000,
        "context":{
            "url":"http://jsonplaceholder.typicode.com/posts/",
            "ttl":60000
        }
    }
}
```
For more a more complex example, look at `/motly-demo`.
