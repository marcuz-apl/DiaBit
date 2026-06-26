import db from '@/lib/database';

export async function GET(request) {
  try {
    const models = db.prepare("SELECT * FROM field_models ORDER BY year DESC, name ASC").all();
    
    const gravity = models.filter(m => m.model_type === 'gravity');
    const magnetic = models.filter(m => m.model_type === 'magnetic');
    
    return new Response(JSON.stringify({ gravity, magnetic }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
