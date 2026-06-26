import db, { transaction } from '@/lib/database';
import { calculateSurvey } from '@/lib/mcm';

// Helper to climb the tree and get the well node and slot node
function getWellSettings(nodeId) {
  try {
    const trajectoryNode = db.prepare("SELECT * FROM nodes WHERE id = ?").get(nodeId);
    if (!trajectoryNode) return null;

    const slotNode = db.prepare("SELECT * FROM nodes WHERE id = ?").get(trajectoryNode.parent_id);
    if (!slotNode) return null;

    const wellNode = db.prepare("SELECT * FROM nodes WHERE id = ?").get(slotNode.parent_id);
    if (!wellNode) return null;

    const wellMetadata = wellNode.metadata ? JSON.parse(wellNode.metadata) : {};
    const trajMetadata = trajectoryNode.metadata ? JSON.parse(trajectoryNode.metadata) : {};

    return {
      units: wellMetadata.units || 'metric',
      vs_direction: wellMetadata.vs_direction || 0,
      latitude: wellMetadata.latitude || 0,
      longitude: wellMetadata.longitude || 0,
      easting: wellMetadata.easting || 0,
      northing: wellMetadata.northing || 0,
      elevation: wellMetadata.elevation || 0,
      tie_in: trajMetadata.tie_in || { md: 0, inc: 0, az: 0, tvd: 0, north: 0, east: 0 }
    };
  } catch (e) {
    console.error("Error fetching well settings", e);
    return null;
  }
}

export async function GET(request, { params }) {
  try {
    const { nodeId } = await params;
    if (!nodeId) {
      return new Response(JSON.stringify({ error: "Missing node ID" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const points = db.prepare(`
      SELECT * FROM survey_points
      WHERE node_id = ?
      ORDER BY sequence_no ASC
    `).all(nodeId);

    return new Response(JSON.stringify(points), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request, { params }) {
  try {
    const { nodeId } = await params;
    if (!nodeId) {
      return new Response(JSON.stringify({ error: "Missing node ID" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const rawPoints = await request.json(); // Array of { md, inclination, azimuth }
    if (!Array.isArray(rawPoints)) {
      return new Response(JSON.stringify({ error: "Data must be an array of points" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Climb the tree to find Well-level and Trajectory-level calculation settings
    const settings = getWellSettings(nodeId) || {
      units: 'metric',
      vs_direction: 0,
      tie_in: { md: 0, inc: 0, az: 0, tvd: 0, north: 0, east: 0 }
    };

    // Calculate full trajectories using Minimum Curvature Method
    const calculatedPoints = calculateSurvey(
      rawPoints.map(p => ({
        md: parseFloat(p.md),
        inc: parseFloat(p.inclination || p.inc || 0),
        az: parseFloat(p.azimuth || p.az || 0)
      })),
      settings.tie_in,
      settings.vs_direction,
      settings.units === 'imperial' ? 'imperial' : 'metric'
    );

    // Save points to database inside a transaction
    transaction(() => {
      // Clear existing points for this node
      db.prepare("DELETE FROM survey_points WHERE node_id = ?").run(nodeId);

      // Insert new calculated points
      const insertStmt = db.prepare(`
        INSERT INTO survey_points (node_id, sequence_no, md, inclination, azimuth, tvd, north, east, dls, vs)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      calculatedPoints.forEach((pt, idx) => {
        insertStmt.run(
          nodeId,
          idx,
          pt.md,
          pt.inc,
          pt.az,
          pt.tvd,
          pt.north,
          pt.east,
          pt.dls,
          pt.vs
        );
      });
    })();

    // Read saved points back to return the primary-key-associated rows
    const savedPoints = db.prepare(`
      SELECT * FROM survey_points
      WHERE node_id = ?
      ORDER BY sequence_no ASC
    `).all(nodeId);

    return new Response(JSON.stringify(savedPoints), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
