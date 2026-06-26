import db from '@/lib/database';

/**
 * GET /api/crs
 * Returns all active CRS entries, optionally filtered by ?q=search
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    let rows;
    if (q.trim()) {
      rows = db.prepare(`
        SELECT * FROM crs_registry
        WHERE active = 1
          AND (name LIKE ? OR CAST(epsg_code AS TEXT) LIKE ? OR projection LIKE ?)
        ORDER BY epsg_code ASC
        LIMIT 60
      `).all(`%${q}%`, `%${q}%`, `%${q}%`);
    } else {
      rows = db.prepare(`
        SELECT * FROM crs_registry WHERE active = 1 ORDER BY epsg_code ASC
      `).all();
    }

    return new Response(JSON.stringify(rows), {
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

/**
 * POST /api/crs
 * Admin: Add a custom CRS entry
 * Body: { epsg_code, name, projection, zone, hemisphere, datum, central_meridian, false_easting, false_northing, scale_factor }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      epsg_code, name, projection, zone, hemisphere,
      datum = 'WGS84', central_meridian, false_easting = 500000,
      false_northing = 0, scale_factor = 0.9996
    } = body;

    if (!name || !projection) {
      return new Response(JSON.stringify({ error: 'name and projection are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const stmt = db.prepare(`
      INSERT INTO crs_registry
        (epsg_code, name, projection, zone, hemisphere, datum, central_meridian, false_easting, false_northing, scale_factor, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      epsg_code || null, name, projection,
      zone || null, hemisphere || null, datum,
      central_meridian || null, false_easting, false_northing, scale_factor
    );

    const created = db.prepare('SELECT * FROM crs_registry WHERE id = ?').get(result.lastInsertRowid);
    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
