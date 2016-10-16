'use strict'

const assert = require('chai').assert

exports.hasCities = function hasCities(res) {
    if (res.body.html) {
        assert(res.body.html.includes('Aachen'), 'Context data not included')
    } else {
        assert(res.text.includes('Aachen'), 'Context data not included')
    }
}

exports.notMaster = function hasCities(res) {
    if (res.body.html) {
        assert(
            res.body.html.includes('but it is not on the master branch'),
            'Expected distinguishing text not present'
        )
    } else {
        assert(
            res.text.includes('but it is not on the master branch'),
            'Expected distinguishing text not present'
        )
    }
}

exports.hasOembedProps = function hasOembedProps (res) {
    assert(res.body.width, "Oembed doesn't have width property")
    assert(res.body.html, "Oembed doesn't have html property")
}
