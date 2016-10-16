'use strict'

const assert = require('chai').assert,
      request = require('supertest'),
      replay = require('replay')

const helpers = require('./helpers')

const app_factory = require('../app_factory')


describe('local mode', function(){
    let app

    beforeEach(function() {
        app = app_factory.get_instance('../motly-test')
        app.env.NOCACHE = false
    })

    it('registers as local mode', function() {
        assert(app.env.local === true)
    })
    it('loads a simple template with context', function(done) {
        request(app)
            .get('/cities')
            .expect('Content-Type', /html/)
            .expect(helpers.hasCities)
            .expect(200, done)
    })
    it("doesn't load a github mode URL", function(done) {
        request(app)
            .get('/cacahootie/motly-demo/master/cities')
            .expect(404, done)
    })
})


describe('oembed', function() {
    let app

    beforeEach(function() {
        app = app_factory.get_instance('../motly-test')
        app.env.NOCACHE = false
    })

    it('puts the oembed in the json', function(done) {
        request(app)
            .get('/oembed/api?url=localhost:8000/cities')
            .expect('Content-Type', /json/)
            .expect(helpers.hasCities)
            .expect(helpers.hasOembedProps)
            .expect(200, done)
    })
})
