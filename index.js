/// <reference path="typings/node/node.d.ts"/>
var fs = require("fs");
var csv = require("fast-csv");
var builder = require("xmlbuilder");

var input = fs.createReadStream("test/raw_input.csv");

var timeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
var numRegex = /^\d+(\.\d+)?$/

var parserOptions = {
    delimiter: ";",
    headers: ["time", "height", "latitude", "longitude"]
}

var meassurements = []

csv
    .fromStream(input, parserOptions)
    .validate(function (data) {
        return timeRegex.test(data.time) &&
            numRegex.test(data.height) &&
            numRegex.test(data.latitude) &&
            numRegex.test(data.longitude)
    })
    .on("data-invalid", function (data) {
        console.warn("Invalid data %s", JSON.stringify(data));
    })
    .on("data", function (data) {
        meassurements.push(data);
    })
    .on("end", function () {
        var xml = builder.create("kml")
            .att("xmlns", "http://www.opengis.net/kml/2.2")
            .att("xmlns:gx", "http://www.google.com/kml/ext/2.2")
            .att("xmlns:kml", "http://www.w3.org/2005/Atom")
            .ele("Document")
                .ele("name", "nombre").up()
                .ele("Style", {"id": "estilo"})
                    .ele("IconStyle")
                        .ele("scale", "1.2").up()
                        .ele("Icon")
                            .ele("href", "http://maps.google.com/mapfiles/kml/shapes/airports.png").up()
                            .up()
                        .ele("hotSpot", {x:"0.5", y:"0", xunits:"fraction", yunits:"fraction"}).up()
                        .up()
                    .ele("LineStyle")
                        .ele("color", "ff07fdff").up()
                        .ele("width", "3.9").up()
                    .up()
                .up()
                .ele("Placemark")
                    .ele("styleUrl", "#estilo")
                    .up()
                .ele("gx:Track")
                    .ele("gx:altitudeMode", "absolute")
                    .up();
                   
         for (var j = 0; j < meassurements.length; j++) {
             xml.ele("when", meassurements[j].time).up();
         }
         
         for (var k = 0; k < meassurements.length; k++) {
             xml.ele("gx:coord", "" + 
                 meassurements[k].longitude + " " +
                 meassurements[k].latitude + " " +
                 meassurements[k].height).up()
         }

        var output = fs.createWriteStream("salida.kml");
        output.write(xml.end({pretty: true}))
        output.close();
    });
