var client = require('../db/client')();

function socketHandler (socket) {
  socket.emit('news', {
    hello: 'world'
  });

  socket.on('my other event', function (data) {
    console.log(data);
  });

  socket.on('nearby', function (circle) {

    function sendResults (err, results) {
      if (err) {
        return console.error(err);
      };

      socket.emit('nearby:'+circle.latitude+':'+circle.longitude+':'+circle.distance, results);
    };

    client.nearbyMarkers(circle, sendResults);
    client.nearbyMarkerChanges(circle, sendResults);
  });
} 

module.exports = socketHandler;