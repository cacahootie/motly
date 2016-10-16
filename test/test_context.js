
var assert = require('chai').assert,
    contextLib = require('../lib/context'),
    replay = require('replay')

var rawgit = 'http://rawgit.com/cacahootie/motly-demo/master/static/'

describe('Context Loader', function() {
    it('loads data from a single URL', function(done) {
        var robj = {
            "url": rawgit + 'test.json'
        }
        contextLib.getContext(null, robj, function (e, result) {
            assert.equal(result.bob, "dole")
            done()
        })
    })

    it('loads data from multiple non-nested URLs', function(done) {
        var robj = {
            "first":{
                "url": rawgit + 'test.json'    
            },
            "second":{
                "url": rawgit + 'test.json'    
            }
        }
        contextLib.getContext(null, robj, function (e, result) {
            assert.equal(result.first.bob, "dole")
            assert.equal(result.second.bob, "dole")
            done()
        })
    })

    it('loads data from multiple nested URLs', function(done) {
        var robj = {
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
        contextLib.getContext(null, robj, function (e, result) {
            console.log(result)
            assert.equal(result.first.inner.bob, "dole")
            assert.equal(result.second.inner.bob, "dole")
            done()
        })
    })
})
