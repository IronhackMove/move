L.mapbox.accessToken =
  "pk.eyJ1IjoiYXNvbGVycCIsImEiOiJjam92ejA2ZGYxbWJrM3dwaDA4YmY1eDA2In0.dhk_MNpNlTqubZiObpTOtg";

var map = L.mapbox
  .map("map")
  .setView([40.42081487986973, -3.6898612976074223], 14);

new L.Control.Zoom({ position: "bottomleft" }).addTo(map);

var marker = L.marker(new L.LatLng(40.42081487986973, -3.6898612976074223), {
  icon: L.mapbox.marker.icon({
    "marker-color": "#00704A",
    title: "You need coffee",
    "marker-symbol": "pitch",
    "marker-size": "large"
  }),
  draggable: true,
  zIndexOffset: 999
});

L.mapbox
  .styleLayer("mapbox://styles/asolerp/cjow223sd3g1j2smcqo2im6as")
  .addTo(map);

var currentPosition;
var currentRadius = 1;

//Geocoder lookup
var geocoder = L.mapbox.geocoder("mapbox.places-v1");

//geolocation
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  }
}

function showPosition(position) {
  $("#findme").show();
  currentPosition = [position.coords.latitude, position.coords.longitude];
  console.log(currentPosition);
}

function pointBuffer(pt, radius, units, resolution) {
  var ring = [];
  var resMultiple = 360 / resolution;
  for (var i = 0; i < resolution; i++) {
    var spoke = turf.destination(pt, radius, i * resMultiple, units);
    ring.push(spoke.geometry.coordinates);
  }
  if (
    ring[0][0] !== ring[ring.length - 1][0] &&
    ring[0][1] != ring[ring.length - 1][1]
  ) {
    ring.push([ring[0][0], ring[0][1]]);
  }
  return turf.polygon([ring]);
}

axios.get(`http://localhost:3000/epoint/getPointsOfCharge`).then(points => {
  var data = {
    type: "FeatureCollection",
    features: [...points.data]
  };

  $(".blocker").remove();
  $("#topbar").show();

  // var fc = (data);
  // var fc = JSON.parse(data);

  //find me functionality
  $("#findme").on("click", function() {
    marker.setLatLng(currentPosition);
    map.setView(currentPosition, 14);
    updateVenues();
  });

  //click-move functionality
  map.on("click", function(e) {
    marker.setLatLng([e.latlng.lat, e.latlng.lng]);
    map.setView([e.latlng.lat, e.latlng.lng], 14);
    updateVenues();
  });

  function showMap(err, data) {
    map.setView([data.latlng[0], data.latlng[1]], 13);
    marker.setLatLng([data.latlng[0], data.latlng[1]]);
    updateVenues();
  }

  //mousewheel functionality (adjust radius)

  $(".leaflet-marker-draggable").on("mousewheel", function(event) {
    var wheelDelta = event.originalEvent.wheelDeltaY;
    if (
      currentRadius - wheelDelta * 0.001 >= 0.5 &&
      currentRadius - wheelDelta * 0.001 <= 2
    ) {
      currentRadius = currentRadius - wheelDelta * 0.001;
      updateVenues();
      var distancePhrase;
      switch (parseFloat(currentRadius.toFixed(2))) {
        case 0.5:
          distancePhrase = "a half mile";
          break;
        case 1.0:
          distancePhrase = "a mile";
          break;
        case 2.0:
          distancePhrase = "two miles";
          break;
        default:
          distancePhrase = currentRadius.toFixed(2) + " miles";
          break;
      }
      $("#distance").html(distancePhrase);
    }

    event.stopPropagation();
    return false;
  });

  // get position, get radius, draw buffer, find within, calculate distances, find nearest, add to map
  function updateVenues() {
    $("path").remove();
    $(".leaflet-marker-pane *")
      .not(":first")
      .remove();
    var position = marker.getLatLng();
    var point = turf.point(position.lng, position.lat);

    //draw buffer
    var bufferLayer = L.mapbox.featureLayer().addTo(map);
    var buffer = pointBuffer(point, currentRadius, "miles", 120);
    buffer.properties = {
      fill: "#00704A",
      "fill-opacity": 0.05,
      stroke: "#00704A",
      "stroke-width": 2,
      "stroke-opacity": 0.5
    };

    bufferLayer.setGeoJSON(buffer);

    var within = turf.featurecollection(
      data.features.filter(function(epoint) {
        if (turf.distance(epoint, point, "kilometers") <= currentRadius)
          return true;
      })
    );

    $("#milecount").html(within.features.length);

    function mileConvert(miles) {
      if (miles <= 0.25) {
        return (miles * 5280).toFixed(0) + " ft";
      } else {
        return miles.toFixed(2) + " mi";
      }
    }

    function checkPhone(phone) {
      if (phone !== null && phone !== "null") {
        return "<br>☎ " + phone;
      } else {
        return "";
      }
    }

    console.log(within);

    within.features.forEach(function(feature) {
      var distance = parseFloat(turf.distance(point, feature, "kilometers"));
      feature.properties["marker-color"] = "#6E6E6E";
      feature.properties["title"] = feature.properties["stationName"];
      feature.properties["marker-size"] = "small";
      feature.properties["marker-symbol"] = "car";
    });

    console.log(data);

    var nearest = turf.nearest(point, data);
    var nearestdist = parseFloat(turf.distance(point, nearest, "miles"));

    nearest.properties["marker-color"] = "#00704A";
    nearest.properties["title"] = nearest.properties["stationName"];
    nearest.properties["marker-size"] = "medium";
    nearest.properties["marker-symbol"] = "car";

    var nearest_fc = L.mapbox
      .featureLayer()
      .setGeoJSON(turf.featurecollection([within, nearest]))
      .addTo(map);

    // hover tooltips and click to zoom/route functionality
    nearest_fc
      .on("mouseover", function(e) {
        e.layer.openPopup();
      })
      .on("mouseout", function(e) {
        e.layer.closePopup();
      })
      .on("click", function(e) {
        // assemble directions URL based on position of user and selected cafe
        var startEnd =
          position.lng +
          "," +
          position.lat +
          ";" +
          e.latlng.lng +
          "," +
          e.latlng.lat;
        var directionsAPI =
          "https://api.tiles.mapbox.com/v4/directions/mapbox.walking/" +
          startEnd +
          ".json?access_token=" +
          L.mapbox.accessToken;

        // query for directions and draw the path
        $.get(directionsAPI, function(data) {
          var coords = data.routes[0].geometry.coordinates;
          coords.unshift([position.lng, position.lat]);
          coords.push([e.latlng.lng, e.latlng.lat]);
          var path = turf.linestring(coords, {
            stroke: "#00704A",
            "stroke-width": 4,
            opacity: 1
          });

          $(".distance-icon").remove();
          map.fitBounds(map.featureLayer.setGeoJSON(path).getBounds());
          window.setTimeout(function() {
            $("path").css("stroke-dashoffset", 0);
          }, 400);
          var duration = parseInt(data.routes[0].duration / 60);
          if (duration < 100) {
            L.marker(
              [
                coords[parseInt(coords.length * 0.5)][1],
                coords[parseInt(coords.length * 0.5)][0]
              ],
              {
                icon: L.divIcon({
                  className: "distance-icon",
                  html:
                    '<strong style="color:#00704A">' +
                    duration +
                    '</strong> <span class="micro">min</span>',
                  iconSize: [45, 23]
                })
              }
            ).addTo(map);
          }
        });
      });
  }
  marker.on("drag", function() {
    updateVenues();
  });
  updateVenues();
  // });
});

getLocation();
marker.addTo(map);
