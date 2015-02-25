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
        return console.error(err.msg);
      };

      console.log(res);

      r.db('findme').tableCreate('markers').run(conn, function (err, res) {
        if (err) {
          return console.error(err.msg);
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

// create
router.post('/marker', function(req, res, next) {
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;

  if (!latitude || !longitude) {
    res.status(400).end();
  };

  r.db('findme').table('markers').insert({
    time: r.now(),
    position: r.point(longitude, latitude).default(null)
  }).run(conn, function (err, result) {
    if (err) {
      console.error(err);
      return res.status(500).end();
    };

    res.send(result);
  });
});

// update
router.put('/marker/:id', function(req, res, next) {
  var id = req.params.id;
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;

  if (!id || !latitude || !longitude) {
    res.status(400).end();
  };

  r.db('findme').table('markers').get(id).update({
    time: r.now(),
    position: r.point(longitude, latitude).default(null)
  }).run(conn, function (err, result) {
    if (err) {
      console.error(err);
      return res.status(500).end();
    };

    res.send(result);
  });
});

module.exports = router;
