
exports.get_env = function () {
    if (process.env.GH_REPO) {
        return {'github':true}
    }
    return {'local': true}
}