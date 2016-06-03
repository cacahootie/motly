var assert = require('chai').assert;
var request = require('supertest');

var app = require('../app').get_instance('../motly-test')

describe('GET /cities', function() {
  it('respond with text', function(done) {
    request(app)
      .get('/cities')
      .set('Accept', 'application/json')
      .expect(200, done);
  });
});
