/**
 * Minimum Curvature Method (MCM) Calculations for Directional Surveying
 */

// Helper to convert degrees to radians
export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

// Helper to convert radians to degrees
export function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}

/**
 * Calculates a single station change relative to the previous station
 * using the Minimum Curvature Method.
 * 
 * @param {Object} p1 Previous station { md, inc (deg), az (deg), tvd, north, east }
 * @param {Object} p2 Current station inputs { md, inc (deg), az (deg) }
 * @param {number} vsDirection Vertical Section Direction (azimuth in degrees)
 * @param {string} dlsUnit 'metric' (deg/30m) or 'imperial' (deg/100ft)
 * @returns {Object} Fully calculated current station
 */
export function calculateMCMStation(p1, p2, vsDirection = 0, dlsUnit = 'metric') {
  const dMD = p2.md - p1.md;
  if (dMD <= 0) {
    // Zero or negative interval: keep previous coordinates or copy inputs
    return {
      md: p2.md,
      inc: p2.inc,
      az: p2.az,
      tvd: p1.tvd,
      north: p1.north,
      east: p1.east,
      dls: 0,
      vs: p1.vs || 0,
      closureDist: Math.sqrt(p1.east * p1.east + p1.north * p1.north),
      closureAz: radToDeg(Math.atan2(p1.east, p1.north))
    };
  }

  const I1 = degToRad(p1.inc);
  const I2 = degToRad(p2.inc);
  const A1 = degToRad(p1.az);
  const A2 = degToRad(p2.az);

  // Calculate Dogleg angle beta
  let cosBeta = Math.cos(I2 - I1) - Math.sin(I1) * Math.sin(I2) * (1 - Math.cos(A2 - A1));
  // Ensure float accuracy boundaries
  cosBeta = Math.max(-1, Math.min(1, cosBeta));
  const beta = Math.acos(cosBeta); // in radians

  // Calculate Ratio Factor F
  let F = 1.0;
  if (beta > 1e-6) {
    F = (2 / beta) * Math.tan(beta / 2);
  }

  // Calculate coordinate increments
  const dTVD = (dMD / 2) * (Math.cos(I1) + Math.cos(I2)) * F;
  const dNorth = (dMD / 2) * (Math.sin(I1) * Math.cos(A1) + Math.sin(I2) * Math.cos(A2)) * F;
  const dEast = (dMD / 2) * (Math.sin(I1) * Math.sin(A1) + Math.sin(I2) * Math.sin(A2)) * F;

  const tvd = p1.tvd + dTVD;
  const north = p1.north + dNorth;
  const east = p1.east + dEast;

  // Dogleg Severity (DLS)
  // beta is in radians. Let's convert to degrees.
  const betaDeg = radToDeg(beta);
  let dls = 0;
  if (dlsUnit === 'imperial') {
    dls = betaDeg * (100 / dMD);
  } else {
    dls = betaDeg * (30 / dMD);
  }

  // Vertical Section (VS) projection relative to a direction
  const vsDirRad = degToRad(vsDirection);
  const vs = east * Math.sin(vsDirRad) + north * Math.cos(vsDirRad);

  // Closure Distance and Azimuth
  const closureDist = Math.sqrt(east * east + north * north);
  let closureAz = radToDeg(Math.atan2(east, north));
  if (closureAz < 0) {
    closureAz += 360;
  }

  return {
    md: p2.md,
    inc: p2.inc,
    az: p2.az,
    tvd: parseFloat(tvd.toFixed(4)),
    north: parseFloat(north.toFixed(4)),
    east: parseFloat(east.toFixed(4)),
    dls: parseFloat(dls.toFixed(4)),
    vs: parseFloat(vs.toFixed(4)),
    closureDist: parseFloat(closureDist.toFixed(4)),
    closureAz: parseFloat(closureAz.toFixed(4))
  };
}

/**
 * Calculates a series of survey stations using Minimum Curvature Method.
 * 
 * @param {Array<Object>} stations Array of station inputs { md, inc, az }
 * @param {Object} tieIn Tie-in station { md, inc, az, tvd, north, east }
 * @param {number} vsDirection Vertical Section Direction (azimuth in degrees)
 * @param {string} dlsUnit 'metric' or 'imperial'
 * @returns {Array<Object>} Calculated survey stations
 */
export function calculateSurvey(stations, tieIn = null, vsDirection = 0, dlsUnit = 'metric') {
  if (!stations || stations.length === 0) return [];

  // Sort stations by MD
  const sorted = [...stations].sort((a, b) => a.md - b.md);

  // Define default tie-in if not provided
  const start = tieIn || {
    md: 0,
    inc: 0,
    az: 0,
    tvd: 0,
    north: 0,
    east: 0,
    vs: 0,
    dls: 0,
    closureDist: 0,
    closureAz: 0
  };

  const results = [];
  let prev = start;

  // If the first station's MD is > start.md, we insert the start station at the top
  // so calculations are relative to it.
  if (sorted[0].md > start.md) {
    // If the user wants the first station to be the tie-in, we just use the tie-in.
    // Usually, COMPASS starts with MD=0 tie-in. Let's push the tie-in as the first point.
    results.push({
      ...start,
      vs: parseFloat((start.east * Math.sin(degToRad(vsDirection)) + start.north * Math.cos(degToRad(vsDirection))).toFixed(4)),
      closureDist: parseFloat(Math.sqrt(start.east * start.east + start.north * start.north).toFixed(4)),
      closureAz: parseFloat(((radToDeg(Math.atan2(start.east, start.north)) + 360) % 360).toFixed(4))
    });
    prev = results[0];
  } else if (sorted[0].md === start.md) {
    // If first station matches the tie-in MD, we use it directly as the tie-in point.
    results.push({
      ...sorted[0],
      tvd: start.tvd,
      north: start.north,
      east: start.east,
      dls: 0,
      vs: parseFloat((start.east * Math.sin(degToRad(vsDirection)) + start.north * Math.cos(degToRad(vsDirection))).toFixed(4)),
      closureDist: parseFloat(Math.sqrt(start.east * start.east + start.north * start.north).toFixed(4)),
      closureAz: parseFloat(((radToDeg(Math.atan2(start.east, start.north)) + 360) % 360).toFixed(4))
    });
    prev = results[0];
  } else {
    // First station MD is smaller than tie-in (unlikely, but let's handle)
    results.push({
      ...sorted[0],
      tvd: sorted[0].md, // fallback
      north: 0,
      east: 0,
      dls: 0,
      vs: 0,
      closureDist: 0,
      closureAz: 0
    });
    prev = results[0];
  }

  // Iterate and calculate subsequent stations
  const startIndex = (sorted[0].md === start.md) ? 1 : 0;
  for (let i = startIndex; i < sorted.length; i++) {
    const current = sorted[i];
    const calc = calculateMCMStation(prev, current, vsDirection, dlsUnit);
    results.push(calc);
    prev = calc;
  }

  return results;
}
