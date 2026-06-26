import db from '@/lib/database';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing message ID" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const message = db.prepare("SELECT * FROM messages WHERE id = ?").get(id);
    if (!message) {
      return new Response(JSON.stringify({ error: "Message not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    db.prepare("DELETE FROM messages WHERE id = ?").run(id);

    return new Response(JSON.stringify({ success: true, message: "Message deleted successfully" }), {
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
