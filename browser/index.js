var _ = require('underscore');
var React = require('react/addons');

var ReactGoogleMaps = require('react-googlemaps');
var GoogleMapsAPI = window.google.maps;
var Map = ReactGoogleMaps.Map;
var Marker = ReactGoogleMaps.Marker;
var LatLng = GoogleMapsAPI.LatLng;
var OverlayView = ReactGoogleMaps.OverlayView;

var geolocation = require('geolocation');
var io = require('socket.io-client');

var GoogleMapMarkers = React.createClass({
  getInitialState: function() {
    return {
      center: new LatLng(12.94, 77.54),
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      zoom: 10,
      markers: [],
      nearestMarker: {}
    };
  },

  componentDidMount: function () {
    var self = this;
    window.addEventListener('resize', this.handleResize);

    geolocation.getCurrentPosition(function (err, position) {
      if (err) {
        return console.error(err);
      }

      self.setState({
        center: new LatLng(position.coords.latitude, position.coords.longitude),
        zoom: 15
      });      

      self.emitPosition();
    });

    this.configureSockets();
  },

  componentWillUnmount: function () {
    window.removeEventListener('resize', this.handleResize);
    this.socket.close();
  },

  handleResize: function(e) {
    this.setState({
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth
    });
  },

  handleMarkerDrag: function (i, id, mapEvent) {
    console.log(i, id, mapEvent.latLng);

    var markers = React.addons
      .update(this.state.markers, {$splice: [[i, 1, {
        id: id,
        position: mapEvent.latLng
      }]]});

    this.setState({
      markers: markers
    });

    // superagent.put('/api/marker/' + id)
    //   .send({ latitude: mapEvent.latLng.lat() })
    //   .send({ longitude: mapEvent.latLng.lng() })
    //   .end(function (err, res) {
    //   if (err) {
    //     return console.error(err);
    //   };
    // });
  },

  render: function() {
    var nearestCabMessage = (this.state.nearestMarker && this.state.nearestMarker.distance)
      ? 'The nearest cab is just '+parseInt(this.state.nearestMarker.distance, 10)+'m away.'
      : '';

    return (
      <div>
        <Map
          zoom={this.state.zoom}
          onZoomChange={this.handleZoomChange}

          center={this.state.center}
          onCenterChange={this.handleCenterChange}

          width={this.state.windowWidth}
          height={this.state.windowHeight}
          onClick={this.handleMapClick}>
          {this.state.markers.map(this.renderMarkers)}
          {this.renderPositionMarker()}
        </Map>
        <div className='overlay-nearest'>
          <h3>Well, hello there. {nearestCabMessage}</h3>
          <p>
            Try dragging the map around, to find nearby cabs.
            The cabs update positions in realtime.
            Geo-spatial queries and changefeeds made possible with RethinkDB.
            There is no polling anywhere in the entire flow.
          </p>
          <p>
            Code on <a href='http://github.com/paramaggarwal/nearby-cabs'>Github</a>,
            by <a href='http://paramaggarwal.com'>Param Aggarwal</a>.
          </p>
        </div>
      </div>
      );
  },

  renderPositionMarker: function () {
    return (
      <Marker icon='http://i.stack.imgur.com/orZ4x.png' position={this.state.center} />
    );
  },

  renderMarkers: function(state, i) {

    if (this.state.nearestMarker && (this.state.nearestMarker.id === state.id)) {
      return (
        <Marker animation={2} icon='http://macaulay.cuny.edu/eportfolios/borders/files/leaflet-maps-marker-icons/sportutilityvehicle.png' position={state.position} key={state.id} draggable onDrag={this.handleMarkerDrag.bind(null, i, state.id)} />
      );
    } else {
      return (
        <Marker animation={2} icon='http://google-maps-icons.googlecode.com/files/car.png' position={state.position} key={state.id} draggable onDrag={this.handleMarkerDrag.bind(null, i, state.id)} />
      );
    }
  },

  handleMapClick: function(mapEvent) {
    var self = this;

    // superagent.post('/api/marker')
    //   .send({ latitude: mapEvent.latLng.lat() })
    //   .send({ longitude: mapEvent.latLng.lng() })
    //   .end(function (err, res) {
    //   if (err) {
    //     return console.error(err);
    //   };

    //   var marker = {
    //     id: res.body.generated_keys[0],
    //     position: mapEvent.latLng
    //   };
    //   var markers = React.addons.update(self.state.markers, {$push: [marker]});

    //   self.setState({
    //     markers: markers
    //   });

    // });
  },

  handleZoomChange: function(map) {
    this.setState({
      zoom: map.getZoom()
    });
  },

  handleCenterChange: function(map) {
    this.setState({
      center: map.getCenter()
    });

    this.emitPosition();
  },

  emitPosition: _.debounce(function () {
    // emit current position to server
    this.socket.emit('position', {
      latitude: this.state.center.lat(),
      longitude: this.state.center.lng(),
      distance: 2000
    });

    console.log('Current location: ', this.state.center.lat(), this.state.center.lng());
  }, 500),

  configureSockets: function () {
    var self = this;

    this.socket = io();
    this.socket.on('connect', function () {
      console.log('client connected to server');
    });

    this.socket.on('disconnect', function () {
      console.log('client disconnected from server');
    });

    this.socket.on('log', function (data) {
      console.log(data);
      self.socket.emit('log', "Hello from client " + self.socket.id);
    });

    this.socket.on('markers', function (markers) {
      var markers = _.map(markers, function(result) {
        var marker = result.doc;

        return {
          id: marker.id,
          position: new LatLng(marker.position.coordinates[1], marker.position.coordinates[0]),
          created: new Date(marker.time),
          distance: result.dist
        };
      });

      console.log('Markers: ', markers);

      self.updateMarkers(markers);
    });

    this.socket.on('update', function (marker) {
      var updatedMarker = marker.new_val;
      var markers = _.map(self.state.markers, function(marker) {

        if (updatedMarker.id === marker.id) {
          console.log('Updated marker: ', updatedMarker);

          return {
            id: updatedMarker.id,
            position: new LatLng(updatedMarker.position.coordinates[1], updatedMarker.position.coordinates[0]),
            created: new Date(updatedMarker.time),
            distance: updatedMarker.distance
          }
        } else {
          return marker;
        }
      });

      self.updateMarkers(markers);
    });
  },

  updateMarkers: function (markers) {
    var nearest;
    _.each(markers, function (marker) {
      if (!nearest) {
        nearest = marker;
      };

      if (nearest.distance > marker.distance) {
        nearest = marker;
      };
    });

    console.log(nearest);
    if (nearest) {
      this.setState({
        nearestMarker: nearest
      });      
    };

    this.setState({
      markers: markers
    });
  }

});

React.render(<GoogleMapMarkers />, document.getElementById('root'));
