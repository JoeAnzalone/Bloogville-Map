var map;
var dragstart;
var drawnFeatures;
var jsonBox = document.querySelector('#json');
var drawnFeatures = new L.FeatureGroup();

function save() {
    var flat = drawnFeatures.toGeoJSON();

    flat.features.forEach(function(thing, index){
        layer = drawnFeatures.getLayers()[index];

        if (layer.feature) {
            thing.properties = layer.feature.properties;
        } else {
            thing.properties = layer.properties;
        }

    });

    var string = JSON.stringify(flat);
    jsonBox.value = string;
}

window.onload = function(){
    var mapMinZoom = 3;
    var mapMaxZoom = 6;
        map = L.map('map', {
        maxZoom: mapMaxZoom,
        minZoom: mapMinZoom,
        crs: L.CRS.Simple
    }).setView([-132.5625, 3.15625], mapMaxZoom);

    var mapBounds = new L.LatLngBounds(
            map.unproject([0, 8960], mapMaxZoom),
            map.unproject([10240, 0], mapMaxZoom));

    map.setMaxBounds(mapBounds);
    L.tileLayer('tiles/{z}/{x}/{y}.png', {
        minZoom: mapMinZoom,
        maxZoom: mapMaxZoom,
        bounds: mapBounds,
        noWrap: true,
        continuousWorld: true
    }).addTo(map);

        map.addLayer(drawnFeatures);
        var shapeColor = '#ffffff';
        var drawControl = new L.Control.Draw({
            position: 'topleft',
            draw: {
                polygon: {
                    shapeOptions: {
                        name: 'The Name of the polygon',
                        title: 'Draw a sexy polygon!',
                        color: shapeColor,
                        allowIntersection: false,
                        drawError: {
                            color: '#b00b00',
                            timeout: 1000
                        },
                        showArea: true
                    }
                },
                rectangle: {
                    shapeOptions: {
                        name: 'The Name of the rectangle',
                        color: shapeColor,
                        clickabe: true
                    }
                },
                polyline: false,
                circle: false,
                marker: false
            },
            edit: {
                featureGroup: drawnFeatures
            }
        });
        map.addControl(drawControl);

        map.on('draw:editstart', function (e) {
            L.Control.Draw.editMode = true;
            save();
        });

        map.on('draw:editstop', function (e) {
            L.Control.Draw.editMode = false;
            save();
        });

        map.on('draw:edited', function (e) {
            save();
        });

        map.on('draw:created', function (e) {
            var type = e.layerType,
                layer = e.layer;

            var place = {properties: {}};
            layer.properties = {};
            layer.properties.name = prompt('Name this shape');
            layer.properties.popupContent = layer.properties.name;

            layer.bindPopup(layer.properties.name);
            drawnFeatures.addLayer(layer);
            save();
        });

}

var xhr = new XMLHttpRequest();
xhr.onload = function(e){
    var things = JSON.parse(this.responseText);
    save();

    things = things.features;

    things.forEach(function(thing, index){
        element = document.createElement('li');
        element.innerHTML = thing.properties.name;

        var geoJson = L.geoJson(thing);

        geoJson.setStyle({
            color: 'red',
            opacity: 0,
            fillOpacity: 0
        });

        geoJson.eachLayer(
            function(l){
                l.bindPopup(l.feature.properties.name);
                drawnFeatures.addLayer(l);
        });
        save();

        element.onclick = function(){
            map.fitBounds(geoJson.getBounds());

            drawnFeatures.setStyle({opacity: 0, fillOpacity: 0});

            geoJson.setStyle({
                color: 'red',
                opacity: 0.5,
                fillOpacity: 0.2
            });
        };
        document.querySelector('.things').appendChild(element);
    });
};
xhr.open('get', document.getElementById('map').dataset.points, true);
xhr.send();

jsonBox.onclick = function() {
    this.select();
}
