const { openDb } = require('./src/db');
const db = openDb();

try {
  db.exec('ALTER TABLE usuario ADD COLUMN preferencias_notificaciones TEXT DEFAULT \'{"push":true,"correo":false,"recordatorio_24h":true,"recordatorio_1h":true}\'');
  console.log('Added preferencias_notificaciones column');
} catch (e) {
  console.log('preferencias_notificaciones column may already exist:', e.message);
}

try {
  db.exec('ALTER TABLE usuario ADD COLUMN avatar_url TEXT');
  console.log('Added avatar_url column');
} catch (e) {
  console.log('avatar_url column may already exist:', e.message);
}

try {
  db.exec('ALTER TABLE usuario ADD COLUMN created_at TEXT DEFAULT \'2024-01-01 00:00:00\'');
  console.log('Added created_at column');
} catch (e) {
  console.log('created_at column may already exist:', e.message);
}

console.log('Migration completed');