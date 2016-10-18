'use strict'

const assert = require('chai').assert,
      request = require('supertest'),
      replay = require('replay'),
      sleep = require('sleep').sleep

const helpers = require('./helpers')

const app_factory = require('../app_factory')


describe('github mode', function(){
    let app

    beforeEach(function(done) {
        app = app_factory.get_instance('github', 'testing')
        app.env.NOCACHE = false // so replay can match URLs
        setTimeout(done, 100) // temporary hack to allow for async routes to load
    })

    it('does not register as local mode', function() {
        assert(app.env.local === false)
    })

    it('loads a simple template with context', function(done) {
        request(app)
            .get('/cacahootie/motly-demo/master/cities')
            .expect('Content-Type', /html/)
            .expect(helpers.hasCities)
            .expect(200, done)
    })

    it('loads a context json', function(done) {
        request(app)
            .get('/cacahootie/motly-demo/master/cities?context=true')
            .expect('Content-Type', /json/)
            .expect(helpers.hasCities)
            .expect(200, done)
    })

    it('loads a template from a non-master branch', function(done) {
        request(app)
            .get('/cacahootie/motly-demo/demobranch/countries')
            .expect('Content-Type', /html/)
            .expect(helpers.notMaster)
            .expect(200, done)
    })

    it("doesn't load a local mode URL", function(done) {
        request(app)
            .get('/cities')
            .expect(404, done)
    })
})
