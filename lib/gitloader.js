'use strict'

const fs = require('fs'),
      path = require('path')

const nunjucks = require("nunjucks")

const github = require('./github'),
      log = require('./logger').log


exports.GitLoader = nunjucks.Loader.extend({
    async: true,

    init: function(app, user, repo, branch) {
        this.user = user
        this.repo = repo
        this.env = app.env
        this.app = app
        this.branch = branch || 'master'
    },

    getSource: function(name, cb) {
        let user = this.user,
            repo = this.repo,
            branch = this.branch,
            env = this.env,
            app = this.app,
            noCache = env.NOCACHE

        function package_result(e, src) {
            return cb(e, {
                src: src,
                path: name,
                noCache: noCache
            })
        }

        if (env.github) {
            log(app, `Getting source for: ${ name }`)
            github.get_github_source(env, user, repo, branch, name, function(e,src) {
                if (e) {
                    return github.get_github_source(env, env.base_user, env.base_repo_name, 'master', name, function (e, src) {
                        log(app, `Got source from base for: ${ name }`)
                        package_result(e, src)
                    })
                }
                log(app, `Got source from project for: ${ name } from branch: ${ branch }`)
                package_result(e, src)
            })
        } else if (env.local) {
            fs.readFile(path.join(env.project_dir || '', name), function(e,src) {
                if (!src) {
                    log(app, path.join(env.base_dir, name))
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