var _ = require('underscore');
var client = require('../db/client')();

var connections = {};
var cursors = {};

function socketHandler (socket) {

  socket.emit('log', "Welcome, socket " + socket.id);
  socket.on('log', function (data) { console.log(data); });

  socket.on('position', function (circle) {

    console.log('Client ', socket.id, ' is at position: ', circle);

    var oldCircle = connections[socket.id];
    connections[socket.id] = circle;

    if (oldCircle) {
      if (!_.isEqual(oldCircle, circle)) {
        
        // remove old db changefeed
        var cursor = cursors[socket.id];

        if (cursor) {
          // close and remove reference
          cursor.close();
          delete cursors[socket.id];
        }
      };      
    };

    client.nearbyMarkers(circle, function (err, markers) {
      if (err) {
        return console.error(err);
      };

      socket.emit('markers', markers);
    });

    client.nearbyMarkerChanges(circle, function (err, marker, cursor) {
      if (err) {
        return console.error(err);
      };

      // store reference to this cursor to invalidate this change feed later
      cursors[socket.id] = cursor;

      socket.emit('update', marker);
    });
  });
} 

module.exports = socketHandler;