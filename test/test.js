var assert = require('chai').assert;
var request = require('supertest');

var motly = require('../server');
var app = motly.app;

describe('GET /city', function() {
  it('respond with text', function(done) {
    request(app)
      .get('/city')
      .set('Accept', 'application/json')
      .expect(function(res) {
        if (!res.text.indexOf('Haag') || !res.text.indexOf('Oruro')) {
            throw new Error("Expected to find Haag and Oruro in cities")
        }
      })
      .expect(200, done);
  });
});
