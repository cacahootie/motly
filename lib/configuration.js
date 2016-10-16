'use strict'

const _ = require('lodash')

exports.get_env = function (project_dir) {
    const cfg = {
        'NOCACHE': process.env.NOCACHE,
        'static_base': process.env.STATIC_BASE || 'https://rawgit.com',
        'public_static_base': process.env.PUBLIC_STATIC_BASE || process.env.STATIC_BASE || 'https://rawgit.com',
        'version': require("../package.json").version,
        'PORT': process.env.PORT || 8000
    }
    if (process.env.GH_REPO) {
        _.extend(cfg, {
            github: true  
        })
    } else {
        _.extend(cfg, {
            local: true,
            NOCACHE: true,
            project_dir: process.env.PROJECT_DIR || project_dir || './',
            base_user: process.env.GH_USER_BASE || 'cacahootie',
            base_repo_name: process.env.GH_REPO_BASE || 'motly-base',
            base_dir: process.env.BASE_DIR || '../motly-base',
            whitelist_gh_user: process.env.GH_USER || 'cacahootie',
            whitelist_gh_repo: process.env.GH_REPO || 'motly-test',
        })
    }
    return cfg
}
