'use strict'

const _ = require('lodash')

exports.get_env = function (project_dir, NODE_ENV) {
    const cfg = {
        NOCACHE: process.env.NOCACHE || false,
        static_base: process.env.STATIC_BASE || 'http://rawgit.com',
        public_static_base: process.env.PUBLIC_STATIC_BASE || process.env.STATIC_BASE || 'http://rawgit.com',
        version: require("../package.json").version,
        PORT: process.env.PORT || 8000,
        NODE_ENV: process.env.NODE_ENV || NODE_ENV || 'development'
    }
    if (process.env.GH_REPO || process.env.MODE === 'github' || project_dir === 'github') {
        _.extend(cfg, {
            github: true,
            local: false,
            base_user: process.env.GH_USER_BASE || 'cacahootie',
            base_repo_name: process.env.GH_REPO_BASE || 'motly-base',
            whitelist_gh_user: process.env.GH_USER || 'cacahootie',
            whitelist_gh_repo: process.env.GH_REPO || 'motly-test'
        })
    } else {
        _.extend(cfg, {
            local: true,
            NOCACHE: true,
            project_dir: process.env.PROJECT_DIR || project_dir || './',
            base_dir: process.env.BASE_DIR || './test/test_data/motly-base'
        })
    }
    return cfg
}
