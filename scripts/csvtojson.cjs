const fs = require('fs');
const path = require('path');

// credit to http://techslides.com/convert-csv-to-json-in-javascript
function csvJSON(csv) {
  var lines = csv.split("\n");
  var result = [];
  var headers = lines[0].split(",");

  for (var i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // skip empty lines
    var obj = {};
    var currentline = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/); // handles commas inside quotes
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j].trim()] = (currentline[j] || "").trim();
    }
    result.push(obj);
  }
  return JSON.stringify(result, null, 2); // pretty print
}

// Read CSV, convert, and write JSON
const inputPath = path.join(__dirname, '..', 'data', 'sorteddata.csv');
const outputPath = path.join(__dirname, '..', 'data', 'data.json');

const csv = fs.readFileSync(inputPath, 'utf8');
const json = csvJSON(csv);
fs.writeFileSync(outputPath, json, 'utf8');

console.log('Converted sorteddata.csv to sorteddata.json');