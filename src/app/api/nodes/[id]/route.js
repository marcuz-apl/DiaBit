import db from '@/lib/database';

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

    // If well settings were updated (e.g. units or VS direction), and this is a well,
    // we should trigger recalculation for all trajectories and surveys under this well!
    // But since the client will save/load coordinates on the fly, we can also recalculate on save.
    // Let's return the updated node object.
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
