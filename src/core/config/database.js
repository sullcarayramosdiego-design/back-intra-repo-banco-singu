const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración del pool de conexiones
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'bd_financiera_confianza',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

console.log(`[Database] Inicializando pool para mysql://${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

const pool = mysql.createPool(dbConfig);

// Función helper para ejecutar consultas y simplificar el manejo de conexiones
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('[Database Error] Error al ejecutar consulta:', error.message);
    throw error;
  }
}

module.exports = { pool, query };
