var Router = require('express').Router;
var router = new Router();

var client = require('../db/client')();

router.get('/markers', function(req, res, next) {

  client.getAllMarkers(function (err, data) {
    if (err) {
      return res.status(500).end();
    };

    res.send(data);
  });
});

// nearby
router.get('/nearby', function(req, res, next) {
  var latitude = parseFloat(req.query.latitude);
  var longitude = parseFloat(req.query.longitude);
  var distance = parseFloat(req.query.distance) || 1000;

  if (!latitude || !longitude) {
    return res.status(400).end();
  };

  client.nearbyMarkers({
    latitude: latitude,
    longitude: longitude,
    distance: distance
  }, function (err, results) {
    if (err) {
      return res.status(500).end();
    };

    res.send(results);
  });
});

// create
router.post('/marker', function(req, res, next) {
  var latitude = parseFloat(req.query.latitude);
  var longitude = parseFloat(req.query.longitude);

  if (!latitude || !longitude) {
    return res.status(400).end();
  };

  client.createMarker({
    latitude: latitude,
    longitude: longitude
  }, function (err, data) {
    if (err) {
      return res.status(500).end();
    };

    res.send(data);
  });
});

// update
router.put('/marker/:id', function(req, res, next) {
  var id = req.params.id;
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;

  if (!id || !latitude || !longitude) {
    return res.status(400).end();
  };

  client.updateMarker(id, {
    latitude: latitude,
    longitude: longitude
  }, function (err, data) {
    if (err) {
      return res.status(500).end();
    };

    res.send(data);
  });
});

module.exports = router;
