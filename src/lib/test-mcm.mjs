import { calculateSurvey } from './mcm.js';

const surveyInputs = [
  { md: 0, inc: 0, az: 0 },
  { md: 100, inc: 10, az: 45 },
  { md: 200, inc: 20, az: 90 }
];

console.log("Starting MCM calculation test...");
const results = calculateSurvey(surveyInputs, {
  md: 0,
  inc: 0,
  az: 0,
  tvd: 0,
  north: 0,
  east: 0
}, 45, 'metric');

console.log("Calculated results:");
console.log(JSON.stringify(results, null, 2));

// Quick checks
if (results.length === 3) {
  console.log("TEST SUCCESSFUL: All 3 stations calculated.");
} else {
  console.log("TEST FAILED: Incorrect station count.");
}
