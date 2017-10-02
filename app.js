/*===== POSTCODE LOOKUP =====*/
var returnedBorough = "Unknown";

//Send http request to council info site
const proxyurl = "https://cors-anywhere.herokuapp.com/";
function getPostcode(code){
    var url ='http://servicesenligne.ville.montreal.qc.ca/sel/LesArrondissements/get?lang=en&codePostal=' + code;
    fetch(proxyurl + url) // https://cors-anywhere.herokuapp.com/https://example.com
    .then(response => response.text())
    .then(contents => parseJQ(contents))
    .catch(console.log("Can’t access " + url + " response. Blocked by browser?"));
}

//Parse the html response with jQuery to extract borough
function parseJQ(html){
  var borough = $(html).find('.bteintc a').text();
      if (borough != ""){ // if response isn't empty send to Vue object
        boroughInfo._data.message = borough;
        findDistrict._data.message = "Here's what I found.";
      } else {
        boroughInfo._data.message = "Unknown";
        findDistrict._data.message = "Sorry, I couldn't find that postcode.";
      }
}

/*===== POSTCODE FORM LOGIC =====*/
var findDistrict = new Vue({
  el: '#findme',
  data: {
    postcode: "",
    message: "Waiting...",
  },
  methods: {
      findme: function findme(){
        var userPostcode = this.postcode;
        //validate entry
        if (userPostcode.length > 7){
          this.message = "That's too many characters!";
        } else if (userPostcode.length < 6) {
          this.message = "That's not enough characters!";
        } else {
          this.message = "OK! Searching...";
          if (userPostcode.indexOf(' ') == -1) { //if no space, good to go.
            getPostcode(userPostcode);
          } else {
            getPostcode(userPostcode.replace(/ /g,'')); //if includes space, remove space
          }
        }
      }
  }
});

/*===== RETURNED BOROUGH INFO FILL =====*/
var boroughInfo = new Vue({
  el: '#borough-info',
  data: {
    message: ""
  }
});

/*===== LEAFLET MAP =====*/
//Load base map
var mymap = L.map('map').setView([45.5548, -73.6846], 10);

L.tileLayer('http://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap);

//Load arrondissements json with jQuery
$.getJSON("districtelect.json", function(json) {
    console.log(json);
    addMapFeatures(json);
});

//Add features to map as new layer
function addMapFeatures(geojson){
  L.geoJSON(geojson, {
    style: function(feature){
      return defaultStyle;
    },
    onEachFeature: addHighlight
  }).addTo(mymap);
}

function addHighlight(feature, layer) {
    layer.on('mouseover', function() {
        // Change to highlighted style
         layer.setStyle(highlightStyle);
         // Then create info popup
         var popup = $("<div></div>", {
           id: "popup-feature",
           css: {
               position: "absolute",
               bottom: "25px",
               left: "50px",
               zIndex: 1002,
               backgroundColor: "white",
               padding: "8px",
               border: "1px solid #ccc"
           }
       });
       // Insert a headline into that popup
       var hed = $("<div></div>", {
           text: "District: " + feature.properties.NOM_DISTRICT +
            " | Borough: " + feature.properties.ARRONDISSEMENT,
           css: {fontSize: "12px", marginBottom: "3px"}
       }).appendTo(popup);
    //    Add the popup to the map
       popup.appendTo("#map");
     });
    layer.on('mouseout', function(){
        //first reset style
        layer.setStyle(defaultStyle);
        //then remove popup
        $("#popup-feature").remove();
    });
}

var highlightStyle = {
    color: '#1EAEDB',
    weight: 2,
    opacity: 0.6,
    fillOpacity: 0.7,
    fillColor: '#1EAEDB'
};

var defaultStyle = {
  weight: 1,
  opacity: 1,
  color: 'white',
  dashArray: '3',
  fillOpacity: 0.5,
  fillColor: '#1EAEDB'
};
