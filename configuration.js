
exports.get_env = function (project_dir) {
    var cfg = {
        'project_dir': process.env.PROJECT_DIR || project_dir
    }
    if (process.env.GH_REPO) {
        cfg.github = true
    } else {
        cfg.local =  true
    }
    return cfg
}