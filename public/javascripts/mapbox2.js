$("#inputs").hide();


// document.getElementById("route").onclick = function() {
//   $("#inputs").slideToggle("slow");
// };

var info = document.getElementById("infoEpoint");

console.log(token);
L.mapbox.accessToken = token;

var map = L.mapbox
  .map("map")
  .setView([40.42081487986973, -3.6898612976074223], 14);

var nearest;
var bufferLayer;

var marker = L.marker(new L.LatLng(40.42081487986973, -3.6898612976074223), {
  icon: L.mapbox.marker.icon({
    "marker-color": "#00704A",
    title: "You need coffee",
    "marker-symbol": "car",
    "marker-size": "large"
  }),
  draggable: true,
  zIndexOffset: 999
});

map.attributionControl.setPosition("bottomleft");

L.mapbox
  .styleLayer("mapbox://styles/asolerp/cjow223sd3g1j2smcqo2im6as")
  .addTo(map);

var currentPosition;
var currentRadius = 50;

//Geocoder lookup
var geocoder = L.mapbox.geocoder("mapbox.places-v1");

//geolocation
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  }
}

// findme
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

axios.get(`http://mov-e.herokuapp.com/move/getPointsOfCharge`).then(points => {

  var markers = new L.MarkerClusterGroup();
  var clusterGroup = new L.MarkerClusterGroup();

  map.removeLayer(markers);
  map.removeLayer(clusterGroup);

  markers.clearLayers();

  var data = {
    type: "FeatureCollection",
    features: [...points.data]
  };

  $(".blocker").remove();
  $("#topbar").show();

  //find me functionality
  $("#findme").on("click", function() {
    clearAllData();
    marker.setLatLng(currentPosition);
    map.setView(currentPosition, 14);
    addAllData();
    updateVenues();
  });

  $(document).on("input", "#slider", function(e) {
    currentRadius = e.target.value;
    $(".autonomy").html(e.target.value + "km");
    updateVenues();
    console.log(e.target.value);
  });

  function showCluster(resultFilter, nearestPoint) {
    for (var i = 0; i < resultFilter.features.length; i++) {
      var a = resultFilter.features[i];

      if (
        a.geometry.coordinates[1] === nearestPoint.geometry.coordinates[1] &&
        a.geometry.coordinates[0] === nearestPoint.geometry.coordinates[0]
      ) {
        var title = a.properties.stationName;
        var marker2 = L.marker(
          new L.LatLng(a.geometry.coordinates[1], a.geometry.coordinates[0]),
          {
            icon: L.mapbox.marker.icon({
              "marker-symbol": "car",
              "marker-color": "#00704A",
              "marker-size": "medium"
            }),
            title: title
          }
        );
        marker2.bindPopup(title);
        markers.addLayer(marker2);
      } else {
        var title = a.properties.stationName;
        var marker2 = L.marker(
          new L.LatLng(a.geometry.coordinates[1], a.geometry.coordinates[0]),
          {
            icon: L.mapbox.marker.icon({
              "marker-symbol": "car",
              "marker-color": "#6E6E6E"
            }),
            title: title
          }
        );
        marker2.bindPopup(`<div class='popup-point'>
        <h1>${title}</h1>
        <button class="trigger btn btn-primary btn-block" value=${[a.geometry.coordinates[0], a.geometry.coordinates[1]]}>Get me there!</button>
        </div>`)
        markers.addLayer(marker2);
      }
      map.addLayer(markers);
    }
  }

  function getPosition() {
    return marker.getLatLng();
  }

  function addDirection(start, end) {
    clearAllData();

    Promise.all([
      axios.get(
        `https://api.tiles.mapbox.com/geocoding/v5/mapbox.places/${start}` +
          ".json?access_token=" +
          L.mapbox.accessToken
      ),
      axios.get(
        `https://api.tiles.mapbox.com/geocoding/v5/mapbox.places/${end}` +
          ".json?access_token=" +
          L.mapbox.accessToken
      )
    ]).then(([start, end]) => {
      console.log(start.data);
      console.log(end.data);
      positionFromTo(
        start.data.features[0].center,
        end.data.features[0].center
      );
    });
  }

  function positionFromTo(from, to) {
    // assemble directions URL based on position of user and selected cafe
    var startEnd = from[0] + "," + from[1] + ";" + to[0] + "," + to[1];
    console.log(startEnd);
    var directionsAPI =
      "https://api.tiles.mapbox.com/v4/directions/mapbox.driving/" +
      startEnd +
      ".json?access_token=" +
      L.mapbox.accessToken;

    // query for directions and draw the path
    $.get(directionsAPI, function(dataInfo) {
      var coords = dataInfo.routes[0].geometry.coordinates;
      coords.unshift([from[0], from[1]]);
      coords.push([to[0], to[1]]);
      var path = turf.linestring(coords, {
        stroke: "#007bff",
        "stroke-width": 4,
        opacity: 1
      });

      var radius = 5;
      for (var i = 0; i < path.geometry.coordinates.length; i += 50) {
        console.log(path.geometry.coordinates[i][1]);

        var point = turf.point(
          path.geometry.coordinates[i][0],
          path.geometry.coordinates[i][1]
        );

        var within = turf.featurecollection(
          data.features.filter(function(epoint) {
            if (turf.distance(epoint, point, "kilometers") <= radius)
              return true;
          })
        );


        within.features.forEach(function(feature) {
          var distance = parseFloat(
            turf.distance(point, feature, "kilometers")
          );
          feature.properties["marker-color"] = "#6E6E6E";
          feature.properties["title"] = feature.properties["stationName"];
          feature.properties["marker-size"] = "small";
          feature.properties["marker-symbol"] = "car";
        });

        nearest = turf.nearest(point, data);
        var nearestdist = parseFloat(
          turf.distance(point, nearest, "kilometeres")
        );

        nearest.properties["marker-color"] = "#00704A";
        nearest.properties["title"] =
          +nearestdist + "" + nearest.properties["stationName"];
        nearest.properties["marker-size"] = "medium";
        nearest.properties["marker-symbol"] = "car";

        showCluster(within, nearest);
      }

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
  }

  // get position, get radius, draw buffer, find within, calculate distances, find nearest, add to map
  function updateVenues() {
    map.removeLayer(markers);
    markers.clearLayers();

    map.removeLayer(clusterGroup);
    clusterGroup.clearLayers();

    $("path").remove();
    $(".leaflet-marker-pane *")
      .not(":first")
      .remove();
    var position = marker.getLatLng();
    var point = turf.point(position.lng, position.lat);

    //draw buffer
    bufferLayer = L.mapbox.featureLayer().addTo(map);
    var buffer = pointBuffer(point, currentRadius, "kilometers", 120);
    buffer.properties = {
      fill: "#007bff",
      "fill-opacity": 0.05,
      stroke: "#007bff",
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

    within.features.forEach(function(feature) {
      var distance = parseFloat(turf.distance(point, feature, "kilometers"));
      feature.properties["marker-color"] = "#6E6E6E";
      feature.properties["title"] = feature.properties["stationName"];
      feature.properties["marker-size"] = "small";
      feature.properties["marker-symbol"] = "car";
    });

    nearest = turf.nearest(point, data);
    var nearestdist = parseFloat(turf.distance(point, nearest, "kilometeres"));

    nearest.properties["marker-color"] = "#00704A";
    nearest.properties["title"] =
      +nearestdist + "" + nearest.properties["stationName"];
    nearest.properties["marker-size"] = "medium";
    nearest.properties["marker-symbol"] = "car";

    showCluster(within, nearest);
  }

  function clearAllData() {
    map.removeLayer(bufferLayer);
    map.removeLayer(markers);
    markers.clearLayers();
    map.removeLayer(clusterGroup);
    clusterGroup.clearLayers();

    $("path").remove();
    $(".leaflet-marker-pane *")
      .not(":first")
      .remove();
  }

  function addAllData() {
    map.addLayer(bufferLayer);
    map.addLayer(markers);
    map.addLayer(marker);
  }

  // hover tooltips and click to zoom/route functionality
  markers
    .on("click", function(e) {
 
      // e.layer.closePopup();

      // var feature = e.layer.feature;
      // var content =
      //   "<div><strong>" +
      //   feature.properties.stationName +
      //   "</strong>" +
      //   "<p>" +
      //   feature.properties.description +
      //   "</p></div>";

      // info.innerHTML = content;

      // var position = getPosition();
      // // assemble directions URL based on position of user and selected cafe
      // var startEnd =
      //   position.lng +
      //   "," +
      //   position.lat +
      //   ";" +
      //   e.latlng.lng +
      //   "," +
      //   e.latlng.lat;
      // console.log(startEnd);
      // var directionsAPI =
      //   "https://api.tiles.mapbox.com/v4/directions/mapbox.driving/" +
      //   startEnd +
      //   ".json?access_token=" +
      //   L.mapbox.accessToken;

      // // query for directions and draw the path
      // $.get(directionsAPI, function(data) {
      //   var coords = data.routes[0].geometry.coordinates;
      //   coords.unshift([position.lng, position.lat]);
      //   coords.push([e.latlng.lng, e.latlng.lat]);
      //   var path = turf.linestring(coords, {
      //     stroke: "#00704A",
      //     "stroke-width": 4,
      //     opacity: 1
      //   });

      //   console.log(path);

      //   $(".distance-icon").remove();
      //   map.fitBounds(map.featureLayer.setGeoJSON(path).getBounds());
      //   window.setTimeout(function() {
      //     $("path").css("stroke-dashoffset", 0);
      //   }, 400);
      //   var duration = parseInt(data.routes[0].duration / 60);
      //   if (duration < 100) {
      //     L.marker(
      //       [
      //         coords[parseInt(coords.length * 0.5)][1],
      //         coords[parseInt(coords.length * 0.5)][0]
      //       ],
      //       {
      //         icon: L.divIcon({
      //           className: "distance-icon",
      //           html:
      //             '<strong style="color:#00704A">' +
      //             duration +
      //             '</strong> <span class="micro">min</span>',
      //           iconSize: [45, 23]
      //         })
      //       }
      //     ).addTo(map);
      //   }
      // });
    });

  marker.on("drag", function() {
    updateVenues();
  });
  updateVenues();

  document.querySelector("#getme").onclick = function() {
    var position = getPosition();
    // assemble directions URL based on position of user and selected cafe
    var startEnd =
      position.lng +
      "," +
      position.lat +
      ";" +
      nearest.geometry.coordinates[0] +
      "," +
      nearest.geometry.coordinates[1];
    console.log(startEnd);
    var directionsAPI =
      "https://api.tiles.mapbox.com/v4/directions/mapbox.driving/" +
      startEnd +
      ".json?access_token=" +
      L.mapbox.accessToken;

    // query for directions and draw the path
    $.get(directionsAPI, function(data) {
      var coords = data.routes[0].geometry.coordinates;
      coords.unshift([position.lng, position.lat]);
      coords.push([
        nearest.geometry.coordinates[0],
        nearest.geometry.coordinates[1]
      ]);
      var path = turf.linestring(coords, {
        stroke: "#007bff",
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
  };

  document.querySelector("#allData").onclick = function() {
    // map.clearLayers();

    L.mapbox
      .featureLayer("http://localhost:3000/epoint/getPointsOfCharge")
      .on("ready", function(e) {
        // The clusterGroup gets each marker in the group added to it
        // once loaded, and then is added to the map

        e.target.eachLayer(function(layer) {
          var title = layer.feature.properties.stationName;
          var marker2 = L.marker(
            new L.LatLng(
              layer.feature.geometry.coordinates[1],
              layer.feature.geometry.coordinates[0]
            ),
            {
              icon: L.mapbox.marker.icon({
                "marker-symbol": "car",
                "marker-color": "#6E6E6E"
              }),
              title: title
            }
          );
          marker2.bindPopup(`<div class='popup-point'>
          <h1>${title}</h1>
          <button class="trigger">Say hi</button>
          </div>`)
          clusterGroup.addLayer(marker2);
        });
      });

    map.removeLayer(marker);
    map.removeLayer(bufferLayer);
    map.addLayer(clusterGroup);
  };

  // document.querySelector("#routePlan").onclick = function() {
  //   clearAllData();
  // };

  // document.querySelector("#addData").onclick = function() {
  //   addAllData();
  // };

  // document.querySelector("#createRoute").onclick = function(e) {
  //   console.log(
  //     document.getElementById("mapbox-directions-origin-input").value
  //   );
  //   // clearAllData();

  //   addDirection(
  //     document.getElementById("mapbox-directions-origin-input").value,
  //     document.getElementById("mapbox-directions-destination-input").value
  //   );
  // };

  function getMeThere() {
    alert('hola');
  }

  $("#map").on("click", ".trigger", function(e) {
     var markPosition = e.target.value
     console.log(markPosition.split(','));
     console.log(markPosition.split(',')[0])
     console.log(markPosition.split(',')[1])
     
     var position = getPosition();
      // assemble directions URL based on position of user and selected cafe
      var startEnd =
        position.lng +
        "," +
        position.lat +
        ";" +
        markPosition.split(',')[0] +
        "," +
       markPosition.split(',')[1];
      var directionsAPI =
        "https://api.tiles.mapbox.com/v4/directions/mapbox.driving/" +
        startEnd +
        ".json?access_token=" +
        L.mapbox.accessToken;

      // query for directions and draw the path
      $.get(directionsAPI, function(data) {
        var coords = data.routes[0].geometry.coordinates;
        coords.unshift([position.lng, position.lat]);
        coords.push([markPosition.split(',')[0],markPosition.split(',')[1]]);
        var path = turf.linestring(coords, {
          stroke: "#007bff",
          "stroke-width": 4,
          opacity: 1
        });

        console.log(path);

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

  // $(document).on("input", "#slider", function(e) {
  //   console.log(e);
  //   // document.getElementById('autonomy').innerHTML = 'hola';
  // });

  // });
});

getLocation();
marker.addTo(map);
