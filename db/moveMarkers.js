var _ = require('underscore');
var r = require('rethinkdb');

function moveMarkers() {
  var conn = null;
  r.connect({
    host: 'localhost',
    port: 28015
  }, function(err, connection) {
    if (err) throw err;
    conn = connection;

    r.db('findme').table('markers').run(conn, function (err, cursor) {
      if (err) {
        throw err;
      };

      cursor.toArray(function (err, results) {
        if (err) {
          return console.error(err);
        };

        var modifiedResults = _.each(results, function (result) {
            result.position.coordinates[0] += (Math.random() - 0.5) / 100;
            result.position.coordinates[1] += (Math.random() - 0.5) / 100;
            
            return result;
        });

        r.db('findme').table('markers').insert(modifiedResults, {conflict: 'replace'}).run(conn, function (err, res) {
          if (err) {
            return console.error(err);
          };

          console.log("Moved " + res.replaced + " markers.");
        });
      });
    });
  });
}

setInterval(moveMarkers, 1000);
