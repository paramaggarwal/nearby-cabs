var r = require('rethinkdbdash')();

r.dbCreate('findme').run(function (err, res) {
  if (err) {
    console.error(err.message);
  };

  if (res) console.log(res);
  r.db('findme').tableCreate('markers').run(function (err, res) {
    if (err) {
      console.error(err.message);
    };

    if (res) console.log(res);
    r.db('findme').table('markers').indexCreate('position', {geo: true}).run(function (err, res) {
      if (err) {
        console.error(err.message);
      };

      if (res) console.log(res);
    });
  });
});

function getAllMarkers (cb) {
  if (!cb) {
    throw new Error('callback method not passed');
  };

  r.db('findme').table('markers').run(function (err, results) {
    if (err) {
      return cb(err);
    };

    cb(null, results);
  });
};

function nearbyMarkers (circle, cb) {
  if (!cb) {
    throw new Error('callback method not passed');
  };

  if (!circle.longitude || !circle.latitude || !circle.distance) {
    throw new Error('required longitude/latitude/distance for creating circle not passed');
  };

  r.db('findme').table('markers').getNearest(
    r.point(circle.longitude, circle.latitude), {
      index: 'position',
      maxDist: circle.distance
    }
  ).run(function (err, results) {
    if (err) {
      return cb(err);
    };

    cb(null, results);
  });
};

function createMarker (marker, cb) {
  if (!cb) {
    throw new Error('callback method not passed');
  };

  if (!marker.longitude || !marker.latitude) {
    throw new Error('required longitude/latitude for creating marker not passed');
  };

  r.db('findme').table('markers').insert({
    time: r.now(),
    position: r.point(marker.longitude, marker.latitude).default(null)
  }).run(function (err, result) {
    if (err) {
      return cb(err);
    };

    cb(null, result);
  });
};

function updateMarker (id, marker, cb) {
  if (!cb) {
    throw new Error('callback method not passed');
  };

  if (!id) {
    throw new Error('id of marker to be updated not passed');
  };

  if (!marker.longitude || !marker.latitude) {
    throw new Error('required longitude/latitude for creating marker not passed');
  };

  r.db('findme').table('markers').get(id).update({
    time: r.now(),
    position: r.point(marker.longitude, marker.latitude).default(null)
  }).run(function (err, result) {
    if (err) {
      return cb(err);
    };

    cb(null, result);
  });
};

function nearbyMarkerChanges (circle, cb) {
  if (!cb) {
    throw new Error('callback method not passed');
  };

  if (!circle.longitude || !circle.latitude || !circle.distance) {
    throw new Error('required longitude/latitude/distance for creating circle not passed');
  };

  r.db('findme').table('markers').changes()
    .filter(
      r.circle(r.point(circle.longitude, circle.latitude), circle.distance)
      .includes(r.row('new_val')('position'))
    ).run(function (err, cursor) {
      if (err) {
        return cb(err);
      };

      cursor.each(function (err, result) {
        if (err) {
          return cb(err);
        };

        cb(null, result);
      });
    }
  );
};

module.exports = function () {
  return {
    getAllMarkers: getAllMarkers,
    nearbyMarkers: nearbyMarkers,
    createMarker: createMarker,
    updateMarker: updateMarker,
    nearbyMarkerChanges: nearbyMarkerChanges
  };
};
