import db from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const epsg = searchParams.get('epsg');

    if (!epsg) {
      // Return all shifts for admin panel
      const allShifts = db.prepare('SELECT * FROM datum_shifts ORDER BY id ASC').all();
      return new Response(JSON.stringify(allShifts), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const shift = db.prepare('SELECT dx, dy, dz, region_name FROM datum_shifts WHERE epsg_code = ?').get(parseInt(epsg, 10));

    if (!shift) {
      return new Response(JSON.stringify({ found: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ found: true, ...shift }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error("Datum shifts GET error:", err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { epsg_code, region_name, dx, dy, dz } = data;

    if (!epsg_code || !region_name || dx === undefined || dy === undefined || dz === undefined) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO datum_shifts (epsg_code, region_name, dx, dy, dz)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(parseInt(epsg_code, 10), region_name, parseFloat(dx), parseFloat(dy), parseFloat(dz));

    return new Response(JSON.stringify({ id: info.lastInsertRowid, epsg_code, region_name, dx, dy, dz }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error("Datum shifts POST error:", err);
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return new Response(JSON.stringify({ error: 'A shift for this EPSG code already exists' }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'id is required' }), { status: 400 });
    }

    db.prepare('DELETE FROM datum_shifts WHERE id = ?').run(parseInt(id, 10));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error("Datum shifts DELETE error:", err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
