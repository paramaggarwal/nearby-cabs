var Router = require('express').Router;
var router = new Router();
var r = require('rethinkdb');

var conn = null;
r.connect({
  host: 'localhost',
  port: 28015
}, function(err, connection) {
    if (err) throw err;
    conn = connection;

    r.dbCreate('findme').run(conn, function (err, res) {
      if (err) {
        return console.error(err);
      };

      console.log(res);

      r.db('findme').tableCreate('markers').run(conn, function (err, res) {
        if (err) {
          return console.error(err);
        };

        console.log(res);
      });
    });
})

router.get('/markers', function(req, res, next) {

  r.db('findme').table('markers').run(conn, function (err, cursor) {
    if (err) {
      return res.send(500, err);
    };

    cursor.toArray(function (err, results) {
      if (err) {
        return res.send(500, err);
      };

      res.send(results);
    });
  });
});

router.post('/marker', function(req, res, next) {
  var latitude = req.params.latitude;
  var longitude = req.params.longitude;

  r.db('findme').table('markers').insert({
    time: r.now(),
    place: r.point(longitude, latitude).default(null)
  }).run(conn, function (err, res) {
    if (err) {
      return res.send(500, err);
    };

    res.send(res);
  });
});

module.exports = router;
