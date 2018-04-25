var test = require('tape')
var hyperquest = require('hyperquest')
var createServer = require('./server')
var concat = require('concat-stream')

test('observations: create', function (t) {
  createServer(function (server, base) {
    var href = base + '/observations'

    var hq = hyperquest.post(href, {
      headers: { 'content-type': 'application/json' }
    })

    // http response
    hq.once('response', function (res) {
      t.equal(res.statusCode, 200, 'create 200 ok')
      t.equal(res.headers['content-type'], 'application/json', 'type correct')
    })

    // response content
    hq.pipe(concat({ encoding: 'string' }, function (body) {
      try {
        var obj = JSON.parse(body)
        t.ok(obj.id, 'id field set')
        t.ok(obj.version, 'version field set')
      } catch (e) {
        t.error(e, 'json parsing exception!')
      }
      server.close()
      t.end()
    }))

    hq.end(JSON.stringify({lat: 5, lon: -0.123, type: 'observation'}))
  })
})

test('observations: create invalid', function (t) {
  createServer(function (server, base) {
    var href = base + '/observations'

    var hq = hyperquest.post(href, {
      headers: { 'content-type': 'application/json' }
    })

    // http response
    hq.once('response', function (res) {
      t.equal(res.statusCode, 400, 'create 400 bad')
      server.close()
      t.end()
    })

    hq.end(JSON.stringify({dog: 5, lon: -0.123}))
  })
})

test('observations: create + get', function (t) {
  createServer(function (server, base, osm, media) {
    osm.create({lat:1,lon:2,type:'observation'}, function (err, id, node) {
      t.error(err)

      var expected = {
        lat: 1,
        lon: 2,
        id: id,
        type: 'observation',
        version: node.key
      }

      var href = base + '/observations/' + id

      var hq = hyperquest.get(href, {
        headers: { 'content-type': 'application/json' }
      })

      // http response
      hq.once('response', function (res) {
        t.equal(res.statusCode, 200, 'create 200 ok')
        t.equal(res.headers['content-type'], 'application/json', 'type correct')
      })

      // response content
      hq.pipe(concat({ encoding: 'string' }, function (body) {
        try {
          var objs = JSON.parse(body)
          t.equals(objs.length, 1)
          t.deepEquals(objs[0], expected, 'observation from server matches expected')
        } catch (e) {
          t.error(e, 'json parsing exception!')
        }
        server.close()
        t.end()
      }))
    })
  })
})