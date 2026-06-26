import db, { transaction } from '@/lib/database';
import { calculateSurvey } from '@/lib/mcm';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, metadata } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing node ID" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Retrieve the existing node
    const existing = db.prepare("SELECT * FROM nodes WHERE id = ?").get(id);
    if (!existing) {
      return new Response(JSON.stringify({ error: "Node not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updatedName = name !== undefined ? name : existing.name;
    
    // Merge metadata
    const currentMetadata = existing.metadata ? JSON.parse(existing.metadata) : {};
    const updatedMetadata = metadata !== undefined ? { ...currentMetadata, ...metadata } : currentMetadata;

    db.prepare(`
      UPDATE nodes
      SET name = ?, metadata = ?
      WHERE id = ?
    `).run(updatedName, JSON.stringify(updatedMetadata), id);

    // If well settings were updated (e.g. units, VS direction, or declination/convergence), and this is a well,
    // we should trigger recalculation for all trajectories and surveys under this well!
    if (existing.type === 'well') {
      const slots = db.prepare("SELECT * FROM nodes WHERE parent_id = ? AND type = 'slot'").all(id);
      for (const slot of slots) {
        const childNodes = db.prepare("SELECT * FROM nodes WHERE parent_id = ? AND (type = 'trajectory' OR type = 'survey')").all(slot.id);
        for (const child of childNodes) {
          const points = db.prepare("SELECT * FROM survey_points WHERE node_id = ? ORDER BY sequence_no ASC").all(child.id);
          if (points.length > 0) {
            const childMetadata = child.metadata ? JSON.parse(child.metadata) : {};
            const tieIn = childMetadata.tie_in || { md: 0, inc: 0, az: 0, tvd: 0, north: 0, east: 0 };
            
            let tc = 0;
            if (child.type === 'survey') {
              const d = parseFloat(updatedMetadata.declination) || 0;
              const gc = parseFloat(updatedMetadata.grid_convergence) || 0;
              const nr = updatedMetadata.north_reference || 'grid';
              const gcu = updatedMetadata.grid_convergence_used === true || updatedMetadata.grid_convergence_used === 'true' || updatedMetadata.grid_convergence_used === 'yes';
              tc = nr === 'grid' && gcu ? d - gc : d;
            }
            
            const calculated = calculateSurvey(
              points.map(p => {
                let rawAz = parseFloat(p.azimuth || 0);
                let corrAz = rawAz;
                if (child.type === 'survey') {
                  corrAz = (rawAz + tc) % 360;
                  if (corrAz < 0) corrAz += 360;
                }
                return {
                  md: parseFloat(p.md),
                  inc: parseFloat(p.inclination || 0),
                  az: corrAz
                };
              }),
              tieIn,
              parseFloat(updatedMetadata.vs_direction) || 0,
              updatedMetadata.units === 'imperial' ? 'imperial' : 'metric'
            );
            
            transaction(() => {
              db.prepare("DELETE FROM survey_points WHERE node_id = ?").run(child.id);
              const insertStmt = db.prepare(`
                INSERT INTO survey_points (node_id, sequence_no, md, inclination, azimuth, tvd, north, east, dls, vs)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);
              
              calculated.forEach((pt, idx) => {
                const rawPt = points[idx] || {};
                const rawAz = parseFloat(rawPt.azimuth || 0);
                insertStmt.run(
                  child.id,
                  idx,
                  pt.md,
                  pt.inc,
                  rawAz,
                  pt.tvd,
                  pt.north,
                  pt.east,
                  pt.dls,
                  pt.vs
                );
              });
            })();
          }
        }
      }
    }
    return new Response(JSON.stringify({
      id: parseInt(id),
      parent_id: existing.parent_id,
      name: updatedName,
      type: existing.type,
      metadata: updatedMetadata
    }), {
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

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing node ID" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const existing = db.prepare("SELECT * FROM nodes WHERE id = ?").get(id);
    if (!existing) {
      return new Response(JSON.stringify({ error: "Node not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Cascade delete is handled by database foreign key constraint ON DELETE CASCADE!
    db.prepare("DELETE FROM nodes WHERE id = ?").run(id);

    return new Response(JSON.stringify({ success: true, message: `Node ${id} deleted successfully` }), {
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
