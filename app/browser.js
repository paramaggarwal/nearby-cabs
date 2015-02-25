var _ = require('underscore');
var React = require('react/addons');

var ReactGoogleMaps = require('react-googlemaps');
var GoogleMapsAPI = window.google.maps;
var Map = ReactGoogleMaps.Map;
var Marker = ReactGoogleMaps.Marker;
var LatLng = GoogleMapsAPI.LatLng;

var geolocation = require('geolocation');
var superagent = require('superagent');

var GoogleMapMarkers = React.createClass({
  getInitialState: function() {
    return {
      center: new LatLng(-34.397, 150.644),
      zoom: 16,
      markers: []
    };
  },

  componentDidMount: function () {
    var self = this;

    superagent.get('/api/markers', function (err, res) {
      if (err) {
        return console.error(err);
      };

      var markers = _.map(res.body, function(marker) {
        return {
          id: marker.id,
          position: new LatLng(marker.position.coordinates[1], marker.position.coordinates[0]),
          created: new Date(marker.time)
        };
      });

      // console.log(markers);

      self.setState({
        markers: markers
      });
    });

    geolocation.getCurrentPosition(function (err, position) {
      if (err) {
        console.error(err);
      }

      // console.log(position);
      var currentLocation = new LatLng(position.coords.latitude, position.coords.longitude);

      // var markers = React.addons.update(self.state.markers, {$push: [{
      //   position: currentLocation
      // }]});

      self.setState({
        // markers: markers,
        center: currentLocation
      });
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

    superagent.put('/api/marker/' + id)
      .send({ latitude: mapEvent.latLng.lat() })
      .send({ longitude: mapEvent.latLng.lng() })
      .end(function (err, res) {
      if (err) {
        return console.error(err);
      };
    });
  },

  render: function() {
    return (
      <Map
        initialZoom={this.state.zoom}
        center={this.state.center}
        onCenterChange={this.handleCenterChange}
        width={600}
        height={480}
        onClick={this.handleMapClick}>
        {this.state.markers.map(this.renderMarkers)}
      </Map>
      );
  },

  renderMarkers: function(state, i) {
    return (
      <Marker position={state.position} key={state.id} draggable onDrag={this.handleMarkerDrag.bind(null, i, state.id)} />
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

  handleCenterChange: function(map) {
    this.setState({
      center: map.getCenter()
    });
  }
});

React.render(<GoogleMapMarkers />, document.getElementById('root'));

// React.render(<div>Hello</div>, document.getElementById('root'));