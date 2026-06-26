import db from '@/lib/database';
import crypto from 'crypto';

// Hash verification helper
function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === checkHash;
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Missing username or password" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = db.prepare("SELECT * FROM users WHERE username = ? OR email = ?").get(username, username);
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid username or password" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid username or password" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return user details (without password hash)
    return new Response(JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
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
