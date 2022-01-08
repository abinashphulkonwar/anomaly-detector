if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const fs = require("fs");
const { parse } = require("csv-parse/sync");
const { AnomalyDetectorClient } = require("@azure/ai-anomaly-detector");
const { AzureKeyCredential } = require("@azure/core-auth");

// Authentication variables
let key = process.env.ANOMALY_DETECTOR_KEY;
let endpoint = process.env.ANOMALY_DETECTOR_ENDPOINT;

// Points array for the request body
let points = [];

let anomalyDetectorClient = new AnomalyDetectorClient(
  endpoint,
  new AzureKeyCredential(key)
);

function readFile() {
  let input = fs.readFileSync("request-data.csv").toString();
  let parsed = parse(input, { skip_empty_lines: true });
  parsed.forEach(function (e) {
    points.push({ timestamp: new Date(e[0]), value: parseFloat(e[1]) });
  });
}
readFile();

async function batchCall() {
  // Create request body for API call
  let body = { series: points, granularity: "daily" };
  // Make the call to detect anomalies in whole series of points
  await anomalyDetectorClient
    .detectEntireSeries(body)
    .then((response) => {
      console.log("Batch (entire) anomaly detection):");
      for (let item = 0; item < response.isAnomaly.length; item++) {
        if (response.isAnomaly[item]) {
          console.log(
            "An anomaly was detected from the series, at row " + item
          );
        } else {
          console.log("hiiiiii " + item);
        }
      }
    })
    .catch((error) => {
      console.log(error);
    });
}
batchCall();

async function lastDetection() {
  let body = { series: points, granularity: "daily" };
  // Make the call to detect anomalies in the latest point of a series
  await anomalyDetectorClient
    .detectLastPoint(body)
    .then((response) => {
      console.log("Latest point anomaly detection:");
      if (response.isAnomaly) {
        console.log(
          "The latest point, in row " +
            points.length +
            ", is detected as an anomaly."
        );
      } else {
        console.log(
          "The latest point, in row " +
            points.length +
            ", is not detected as an anomaly."
        );
      }
    })
    .catch((error) => {
      console.log(error);
    });
}
lastDetection();

async function changePointDetection() {
  let body = { series: points, granularity: "daily" };
  // get change point detect results
  await anomalyDetectorClient
    .detectChangePoint(body)
    .then((response) => {
      if (
        response.isChangePoint.some(function (changePoint) {
          return changePoint === true;
        })
      ) {
        console.log("Change points were detected from the series at index:");
        response.isChangePoint.forEach(function (changePoint, index) {
          if (changePoint === true) {
            console.log(index);
          }
        });
      } else {
        console.log("There is no change point detected from the series.");
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

changePointDetection();
