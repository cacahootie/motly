var assert = require('chai').assert,
    request = require('supertest'),
    replay = require('replay')

var app = require('../app_factory').get_instance('../motly-test')

app.env.NOCACHE = false

function hasCities(res) {
    assert(res.text.includes('Aachen'), 'Context data not included')
}

describe('GET /cities', function() {
  it('loads a simple template with context', function(done) {
    request(app)
      .get('/cities')
      .expect(hasCities)
      .expect(200, done)
  })
})

describe('oembed', function() {
  it('puts the oembed in the json', function(done) {
    request(app)
      .get('/oembed/api?url=localhost:8000/cities')
      .expect(hasCities)
      .expect(200, done)
  })
})
