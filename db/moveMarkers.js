var _ = require('underscore');
var r = require('rethinkdbdash')();

function moveMarkers() {
  r.db('findme').table('markers').run(function (err, results) {
    if (err) {
      return console.error(err);
    };

    var modifiedResults = _.each(results, function (result) {
      if (Math.random() < 0.3) {
        result.position.coordinates[0] += (Math.random() - 0.5) / 500;
        result.position.coordinates[1] += (Math.random() - 0.5) / 500;
      }

      return result;
    });

    r.db('findme').table('markers').insert(modifiedResults, {conflict: 'replace'}).run(function (err, res) {
      if (err) {
        return console.error(err);
      };

      console.log("Moved " + res.replaced + " markers.");
    });
  });
}

setInterval(moveMarkers, Math.random()*10000);
