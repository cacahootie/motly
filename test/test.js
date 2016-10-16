'use strict'

const assert = require('chai').assert,
      request = require('supertest'),
      replay = require('replay')

const app = require('../app_factory').get_instance('../motly-test')

app.env.NOCACHE = false

function hasCities(res) {
    if (res.body.html) {
        assert(res.body.html.includes('Aachen'), 'Context data not included')
    } else {
        assert(res.text.includes('Aachen'), 'Context data not included')
    }
}

function hasOembedProps(res) {
    assert(res.body.width, "Oembed doesn't have width property")
    assert(res.body.html, "Oembed doesn't have html property")
}


describe('local mode', function(){
    it('registers as local mode', function() {
        assert(app.env.local === true)
    })
    it('loads a simple template with context', function(done) {
        request(app)
            .get('/cities')
            .expect('Content-Type', /html/)
            .expect(hasCities)
            .expect(200, done)
    })
    it("doesn't load a github mode URL", function(done) {
        request(app)
            .get('/cacahootie/motly-demo/master/cities')
            .expect(404, done)
    })
})


describe('oembed', function() {
    it('puts the oembed in the json', function(done) {
        request(app)
            .get('/oembed/api?url=localhost:8000/cities')
            .expect('Content-Type', /json/)
            .expect(hasCities)
            .expect(hasOembedProps)
            .expect(200, done)
    })
})
