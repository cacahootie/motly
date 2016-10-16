
const fs = require('fs'),
      path = require('path')

const nunjucks = require("nunjucks")

const github = require('./github')


exports.GitLoader = nunjucks.Loader.extend({
    async: true,

    init: function(env, user, repo, branch) {
        this.user = user
        this.repo = repo
        this.env = env
        this.branch = branch || 'master'
    },

    getSource: function(name, cb) {
        var user = this.user,
            repo = this.repo,
            branch = this.branch,
            env = this.env,
            noCache = env.NOCACHE

        function package_result(e, src) {
            return cb(e, {
                src: src,
                path: name,
                noCache: noCache
            })
        }

        if (env.github) {
            var branch = this.branch
            console.log(`Getting source for: ${ name }`)
            github.get_github_source(env, user, repo, branch, name, function(e,src) {
                if (e) {
                    return get_github_source(env, env.base_user, env.base_repo_name, 'master', name, function (e, src) {
                        console.log(`Got source from base for: ${ name }`)
                        package_result(e, src)
                    })
                }
                console.log(`Got source from project for: ${ name } from branch: ${ branch }`)
                package_result(e, src)
            })
        } else if (env.local) {
            fs.readFile(path.join(env.project_dir || '', name), function(e,src) {
                if (!src) {
                    console.log(path.join(env.base_dir, name))
                    fs.readFile(path.join(env.base_dir, name), function(e,src) {
                        package_result(e, src.toString('utf8'))
                    })
                } else {
                    package_result(e, src.toString('utf8'))
                }
            })
        }
    }
})