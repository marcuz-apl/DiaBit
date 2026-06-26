import db from '@/lib/database';
import { initDb } from '@/lib/db-init';

// Self-initialize database on first API call
let dbInitialized = false;
function checkInit() {
  if (!dbInitialized) {
    try {
      initDb();
      dbInitialized = true;
    } catch (e) {
      console.error("DB checkInit failed", e);
    }
  }
}

export async function GET(request) {
  checkInit();
  try {
    const nodes = db.prepare("SELECT * FROM nodes ORDER BY name ASC").all();
    // Parse metadata JSON strings
    const parsedNodes = nodes.map(node => ({
      ...node,
      metadata: node.metadata ? JSON.parse(node.metadata) : {}
    }));
    return new Response(JSON.stringify(parsedNodes), {
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

export async function POST(request) {
  checkInit();
  try {
    const body = await request.json();
    const { parent_id, name, type, metadata } = body;

    if (!name || !type) {
      return new Response(JSON.stringify({ error: "Missing name or type" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const info = db.prepare(`
      INSERT INTO nodes (parent_id, name, type, metadata)
      VALUES (?, ?, ?, ?)
    `).run(
      parent_id || null,
      name,
      type,
      metadata ? JSON.stringify(metadata) : '{}'
    );

    const newNode = {
      id: info.lastInsertRowid,
      parent_id: parent_id || null,
      name,
      type,
      metadata: metadata || {}
    };

    return new Response(JSON.stringify(newNode), {
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
