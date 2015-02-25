var React = require('react/addons');

var ReactGoogleMaps = require('react-googlemaps');
var GoogleMapsAPI = window.google.maps;
var Map = ReactGoogleMaps.Map;
var Marker = ReactGoogleMaps.Marker;
var LatLng = GoogleMapsAPI.LatLng;

var GoogleMapMarkers = React.createClass({
  getInitialState: function() {
    return {
      center: new LatLng(-34.397, 150.644),
      zoom: 16,
      markers: [
        {position: new LatLng(-34.397, 150.644)}
      ]
    };
  },

  handleMarkerDrag: function (i, e) {
    console.log(i, e.latLng);

    var markers = React.addons
      .update(this.state.markers, {$splice: [[i, 1, {
        position: e.latLng
      }]]});

    this.setState({
      markers: markers
    });

  },

  render: function() {
    return (
      <Map
        initialZoom={this.state.zoom}
        center={this.state.center}
        onCenterChange={this.handleCenterChange}
        width={700}
        height={700}
        onClick={this.handleMapClick}>
        {this.state.markers.map(this.renderMarkers)}
      </Map>
      );
  },

  renderMarkers: function(state, i) {
    return (
      <Marker position={state.position} key={i} draggable onDrag={this.handleMarkerDrag.bind(null, i)} />
      );
  },

  handleMapClick: function(mapEvent) {
    var marker = {
      position: mapEvent.latLng
    };

    var markers = React.addons
      .update(this.state.markers, {$push: [marker]});

    this.setState({
      markers: markers,
      // center: mapEvent.latLng
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