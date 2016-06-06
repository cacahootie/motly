
exports.get_env = function (project_dir) {
    var cfg = {
        'project_dir': process.env.PROJECT_DIR || project_dir,
        'base_user': process.env.GH_USER_BASE || 'cacahootie',
        'base_repo_name': process.env.GH_REPO_BASE || 'motly-base',
        'NOCACHE': process.env.NOCACHE
    }
    if (process.env.GH_REPO) {
        cfg.github = true
    } else {
        cfg.local =  true
    }
    return cfg
}