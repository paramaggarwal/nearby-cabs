var _ = require('underscore');
var React = require('react/addons');

var ReactGoogleMaps = require('react-googlemaps');
var GoogleMapsAPI = window.google.maps;
var Map = ReactGoogleMaps.Map;
var Marker = ReactGoogleMaps.Marker;
var LatLng = GoogleMapsAPI.LatLng;

var geolocation = require('geolocation');
var io = require('socket.io-client');

var GoogleMapMarkers = React.createClass({
  getInitialState: function() {
    return {
      center: new LatLng(12.94, 77.54),
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      zoom: 10,
      markers: []
    };
  },

  componentDidMount: function () {
    var self = this;
    window.addEventListener('resize', this.handleResize);

    this.socket = io();

    this.socket.on('connect', function () {
      console.log('client connected to server');
    });

    this.socket.on('news', function (data) {
      console.log(data);
      self.socket.emit('my other event', { my: 'data' });
    });

    this.socket.on('nearby:'+this.state.center.lat()+':'+this.state.center.lng()+':1000', function (data) {

      var markers = [];
      if (data.length > 0) {
        markers = _.map(data, function(result) {
          var marker = result.doc;

          return {
            id: marker.id,
            position: new LatLng(marker.position.coordinates[1], marker.position.coordinates[0]),
            created: new Date(marker.time),
            distance: result.distance
          };
        });
      } else {
        var updatedMarker = data.new_val;
        markers = _.map(this.state.markers, function(marker) {

          if (updatedMarker.id === marker.id) {
            return {
              id: updatedMarker.id,
              position: new LatLng(updatedMarker.position.coordinates[1], updatedMarker.position.coordinates[0]),
              created: new Date(updatedMarker.time)
            }
          } else {
            return marker;
          }
        });
      }

      console.log(markers);

      self.setState({
        markers: markers
      });
    });

    geolocation.getCurrentPosition(function (err, position) {
      if (err) {
        return console.error(err);
      }

      // ask for nearby markers and further changes
      self.socket.emit('nearby', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        distance: 1000
      });

      // console.log(position);
      self.setState({
        center: new LatLng(position.coords.latitude, position.coords.longitude),
        zoom: 15
      });      
    });
  },

  componentWillUnmount: function () {
    window.removeEventListener('resize', this.handleResize);
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
    window.state = this.state;
    return (
      <Map
        zoom={this.state.zoom}
        onZoomChange={this.handleZoomChange}
        center={this.state.center}
        onCenterChange={this.handleCenterChange}
        width={this.state.windowWidth}
        height={this.state.windowHeight}
        onClick={this.handleMapClick}>
        {this.state.markers.map(this.renderMarkers)}
      </Map>
      );
  },

  renderMarkers: function(state, i) {
    return (
      <Marker animation={2} icon='http://google-maps-icons.googlecode.com/files/car.png' position={state.position} key={state.id} draggable onDrag={this.handleMarkerDrag.bind(null, i, state.id)} />
      );
  },

  handleMapClick: function(mapEvent) {
    var self = this;

    superagent.post('/api/marker')
      .send({ latitude: mapEvent.latLng.lat() })
      .send({ longitude: mapEvent.latLng.lng() })
      .end(function (err, res) {
      if (err) {
        return console.error(err);
      };

      var marker = {
        id: res.body.generated_keys[0],
        position: mapEvent.latLng
      };
      var markers = React.addons.update(self.state.markers, {$push: [marker]});

      self.setState({
        markers: markers
      });

    });
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
  }
});

React.render(<GoogleMapMarkers />, document.getElementById('root'));

// React.render(<div>Hello</div>, document.getElementById('root'));