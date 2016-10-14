var assert = require('chai').assert,
    request = require('supertest'),
    replay = require('replay')

var app = require('../app_factory').get_instance('../motly-test')

app.env.NOCACHE = false

function hasCities(res) {
    assert(res.text.includes('Aachen'), 'Context data not included')
}

describe('GET /cities', function() {
  it('respond with text', function(done) {
    request(app)
      .get('/cities')
      .expect(hasCities)
      .expect(200, done);
  });
});
