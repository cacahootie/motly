# motly
templating server which merges web-service json with nunjucks templates.

# installation
`npm install -g motly` (once the package is there... soon).

# concept
Motly provides a service which can be used for the local development, live
testing and deployment of dynamic HTML templating.  Motly's core goal is to
serve one or more projects that are defined by a JSON file which specifies a
template and one or more back-end apis from which to get a JSON context.  The
idea is to create a "view-only" layer that delegates all handling of data to
different microservices.  One advantage of this approach is that for templates
rendered using publicly accessible apis, the same templates (and filters, and
routing) are able to be used either on the server or the client. (client-side is
currently vapor-ware)

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
in every project.  For contexts that are defined with a `ttl` parameter, each
unique url accessed (i.e. via templating) is cached for that number of
miliseconds in-memory.  Choose this `ttl` wisely both for memory management and
freshness purposes, as it will completely ignore any cache headers from what
you've requested.  There is also a `NOCACHE` environment variable that is
respected by all aspects of the cache, from templates to data contexts.

# usage
This application has two usage modes, local development and github mode.  In
local development mode, it uses a `config.json` file either in the current dir,
or defined in the environment variable `PROJECT_DIR`.  Local mode always runs
in NOCACHE mode as well, as it is intended for development purposes.

```bash
$ PROJECT_DIR='../motly-test' PORT=8001 motly
```

In GitHub mode, the`GH_USER` and `GH_REPO` environment variables are used to
define a location to look for either a `whitelist.json` or a `config.json`.  In
the case of finding a whitelist, the server will parse the whitelist and
instantiate the multiple GitHub repositories defined, each of which should have
a `config.json` which will be used for that project.

```bash
$ PORT=8009 GH_USER=cacahootie GH_REPO=motly-test NOCACHE=true motly
```

The server may be run using `motly`.  Unless you're changing code in motly
itself, there's no need to run it under nodemon or the like, just use NOCACHE or
local mode... except for changes to `config.json` which do require a restart.
In public/cached environments, github webhooks can be used to cause a server
restart, which will work for either config or template changes.

# template projects
A project is either a local folder or a github repository which contains a
`config.json` with the appropriate structure, namely, and object with keys
corresponding to routes (starting with `/`), where the values are objects
which describe the route using keys such as `template` and `context`, as well
as other optional keys.

An example project demonstrating the capabilities of motly is available in the
[motly-demo](https://github.com/cacahootie/motly-demo/) repository.  The
whitelist example is in the
[motly-test](https://github.com/cacahootie/motly-test/) repo.

##### single route example
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
Assuming that the JSON at the specified URL looks like this:
```javascript
[
    {
        "userId": 1,
        "id": 1,
        "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
        "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
    },
    ...
]
```
The template will have available an iterable that you could make use of like:
```html
{% for item in items %}
    {{ item.userId }}
    {{ item.title }}
{% endfor %}
```
Where did `items` come from, you ask?  Well, because of how the templates work,
the context itself needs to be an object, but an array could be valid json.  To
handle this case, arrays are given to the template inside a context object under
`items`.  If instead, the JSON looked like this:
```javascript
{
    "results":[
        {
            "userId": 1,
            "id": 1,
            "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
        },
        ...
    ]
}
```
we could access that iterable as `{{ results }}` instead of `{{ items }}`.  It is
best practice not to return a bare array as a JSON result, but this will
automatically handle that case for apis you don't control.

## multiple request context
Sometimes you want to render a particular template using more than one different
JSON request.  Motly allows you to do this!

##### multi-context example
```javascript
{
    "/places":{
        "template":"places.html",
        "ttl":60000,
        "context":{
            "cities":{
                "url":"http://relately.slothattax.me/select/world/cities",
                "ttl":60000
            },
            "countries":{
                "url":"http://relately.slothattax.me/select/world/countries",
                "ttl":60000
            }
        }
    }
}
```
Which we could use like this:
```html
{% for item in cities %}
    {{ item.name }}
{% endfor %}
{% for item in countries %}
    {{ item.name }}
{% endfor %}
```

# Context Request Templating
Sometimes what you render on the page can only be known at the time of the
request.  For instance, user data can only be passed to a back-end api if there
is some mechanism of communication.  Luckily, there is... the express request
object is available for templating the URL and the final response.  This allows
you to use url path or query string parameters as part of your api request, or
to use some aspect of the request in your templates or filters.

##### query string example
```javascript
{
    "/namegenerator":{
        "template":"names.html",
        "context":{
            "url":"http://uinames.com/api/?{{ req.queryString }}"
        }
    }
}
```

##### url path parameter example
```javascript
{
    "/posts/:id":{
        "template":"post.html",
        "context":{
            "url":"http://jsonplaceholder.typicode.com/posts/{{ req.params.id }}",
            "ttl":60000
        }
    }
}
```

##### post with json body example
```javascript
{
    "/cities_post":{
        "template":"a.html",
        "context":{
            "url":"http://relately.slothattax.me/select",
            "method":"post",
            "body":{
                "columns":["name"],
                "target":"world.city",
                "all":[
                    {
                        "left_operand": "countrycode",
                        "operator": "=",
                        "right_operand": "{{ req.query.countrycode }}"
                    }
                ]
            }
        }
    }
}
```
