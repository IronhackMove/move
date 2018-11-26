mapboxgl.accessToken =
  "pk.eyJ1IjoiYXNvbGVycCIsImEiOiJjam92ejA2ZGYxbWJrM3dwaDA4YmY1eDA2In0.dhk_MNpNlTqubZiObpTOtg";

var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/asolerp/cjow223sd3g1j2smcqo2im6as",
  center: [-3.7187152, 40.4291977],
  zoom: 5
});

const charactersAPI = new APIHandler("http://localhost:3000");

map.on("load", function() {
  charactersAPI.getFullList().then(geopoints => {
    var data = {
      type: "FeatureCollection",
      features: [...geopoints]
    };

    // Add geolocate control to the map.
    var geolocate = new mapboxgl.GeolocateControl();

    var directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: 'metric',
      profile: 'mapbox/driving'
    });
    // add to your mapboxgl map
    map.addControl(directions);

    // add to your mapboxgl map
    map.addControl(geolocate);


    geolocate.on("geolocate", function(e) {

      var lon = e.coords.longitude;
      var lat = e.coords.latitude;
      var position = [lon, lat];

      
      var targetPoint = turf.point(position);

      var points = turf.featureCollection([
        turf.point([28.973865, 41.011122]),
        turf.point([28.948459, 41.024204]),
        turf.point([28.938674, 41.013324])
    ]);

      var nearestHospital = turf.nearest(targetPoint, points);
      console.log(nearestHospital);

      // directions.setDestination(position)
    });

    var url = "/api/epoints2.geojson";
    // Add a new source from our GeoJSON data and set the
    // 'cluster' option to true. GL-JS will add the point_count property to your source data.
    map.addSource("epoints", {
      type: "geojson",
      // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
      // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
      data: data,
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
    });

    console.log(map);

    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "epoints",
      filter: ["has", "point_count"],
      paint: {
        // Use step expressions (https://www.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
        // with three steps to implement three types of circles:
        //   * Blue, 20px circles when point count is less than 100
        //   * Yellow, 30px circles when point count is between 100 and 750
        //   * Pink, 40px circles when point count is greater than or equal to 750
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#2fefef",
          20,
          "#2fefef",
          40,
          "#2fefef"
        ],
        "circle-radius": ["step", ["get", "point_count"], 15, 20, 15, 40, 15]
      }
    });

    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "epoints",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12
      }
    });

    map.loadImage("/images/map/epint.png", (error, image) => {
      if (error) throw error;
      map.addImage("epoint", image);
      map.addLayer({
        id: "epoint",
        type: "symbol",
        source: "epoints",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": "epoint",
          "icon-size": 0.2,
          "text-field": "{stationName}",
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-offset": [0, 3.2],
          "text-size": 10,
          "text-anchor": "top"
        }
      });
    });

    // inspect a cluster on click
    map.on("click", "clusters", function(e) {
      var features = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"]
      });
      var clusterId = features[0].properties.cluster_id;
      map
        .getSource("epoints")
        .getClusterExpansionZoom(clusterId, function(err, zoom) {
          if (err) return;

          map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        });
    });

    map.on("click", "epoint", function(e) {
      var coordinates = e.features[0].geometry.coordinates.slice();
      var description = e.features[0].properties.totalDocks;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`Number of docks in the station: ${description}`)
        .addTo(map);
    });

    map.on("mouseenter", "clusters", function() {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "clusters", function() {
      map.getCanvas().style.cursor = "";
    });
  });
});
