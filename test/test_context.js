'use strict'

const assert = require('chai').assert,
      replay = require('replay')

const contextLib = require('../lib/context'),
      cache = require('../lib/cache').cache

const rawgit = 'http://rawgit.com/cacahootie/motly-demo/master/static/'


describe('Context Loader', function() {
    let app = { env: null }

    it('loads data from a single URL', function(done) {
        let robj = {
            "url": rawgit + 'test.json'
        }
        contextLib.getContext(app, robj, function (e, result) {
            assert.equal(result.bob, "dole")
            done()
        })
    })

    it('does not load nonsense', function(done) {
        let robj = {
            "url": "http://ScroopyNoopers"
        }
        let app = {
            "env": null,
            "locals": {}
        }
        cache(app)
        contextLib.getContext(app, robj, function (e, result) {
            assert(result === null)
            done()
        })
    })

    it('loads data from cache in fallback', function(done) {
        let robj = {
            "url": "http://MrMeeseeks"
        }
        let app = {
            "env": null,
            "locals": {}
        }
        cache(app)
        app.locals.cache.put('http://MrMeeseeks', 'Look at me')
        contextLib.getContext(app, robj, function (e, result) {
            assert.equal(result, "Look at me")
            done()
        })
    })

    it('loads data from multiple non-nested URLs', function(done) {
        let robj = {
            "first":{
                "url": rawgit + 'test.json'    
            },
            "second":{
                "url": rawgit + 'test.json'    
            }
        }
        contextLib.getContext(app, robj, function (e, result) {
            assert.equal(result.first.bob, "dole")
            assert.equal(result.second.bob, "dole")
            done()
        })
    })

    it('loads array data into a results object', function(done) {
        let robj = {
            "url": rawgit + 'test_array.json'
        }
        contextLib.getContext(app, robj, function (e, d) {
            assert.equal(d.results[0], "first")
            assert.equal(d.results[1], "second")
            done()
        })
    })

    it('loads data from multiple nested URLs', function(done) {
        let robj = {
            "first":{
                "inner": {
                    "url": rawgit + 'test.json'    
                }
            },
            "second":{
                "inner": {
                    "url": rawgit + 'test.json'    
                }
            },
        }
        contextLib.getContext(app, robj, function (e, result) {
            assert.equal(result.first.inner.bob, "dole")
            assert.equal(result.second.inner.bob, "dole")
            done()
        })
    })
})
