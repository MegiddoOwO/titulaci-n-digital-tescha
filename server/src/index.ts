import app from "./app";
import { env } from "./config/env";
import { getPool } from "./config/database";

async function main() {
  // Verificar conexión a la BD
  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    console.log(`✓ Conectado a MariaDB: ${env.DB_NAME} en ${env.DB_HOST}:${env.DB_PORT}`);
    connection.release();
  } catch (err) {
    console.error("✗ Error al conectar a la base de datos:", err);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`✓ Servidor corriendo en http://localhost:${env.PORT}`);
    console.log(`  Entorno: ${env.NODE_ENV}`);
    console.log(`  CORS origin: ${env.CORS_ORIGIN}`);
  });
}

main();
