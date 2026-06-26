import db from '@/lib/database';
import crypto from 'crypto';

// Hash function helper
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, email, password, role } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing user ID" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    if (!existing) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updatedUsername = username !== undefined ? username : existing.username;
    const updatedEmail = email !== undefined ? email : existing.email;
    const updatedRole = role !== undefined ? role : existing.role;

    let updatedHash = existing.password_hash;
    if (password) {
      updatedHash = hashPassword(password);
    }

    db.prepare(`
      UPDATE users
      SET username = ?, email = ?, password_hash = ?, role = ?
      WHERE id = ?
    `).run(updatedUsername, updatedEmail, updatedHash, updatedRole, id);

    return new Response(JSON.stringify({
      id: parseInt(id),
      username: updatedUsername,
      email: updatedEmail,
      role: updatedRole
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
      return new Response(JSON.stringify({ error: "Missing user ID" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Do not delete the last admin!
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (user.role === 'admin') {
      const adminCount = db.prepare("SELECT count(*) as count FROM users WHERE role = 'admin'").get().count;
      if (adminCount <= 1) {
        return new Response(JSON.stringify({ error: "Cannot delete the last admin account." }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    db.prepare("DELETE FROM users WHERE id = ?").run(id);

    return new Response(JSON.stringify({ success: true, message: "User deleted successfully" }), {
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
