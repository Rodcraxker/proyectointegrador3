import express from 'express';
import pg from 'pg'; // Importamos el paquete pg completo
import mongoose from 'mongoose';
import cors from 'cors';

// Extraemos Pool de la librería pg
const { Pool } = pg;

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. CONFIGURACIÓN POSTGRESQL (Transaccional) ---
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ecotrace_db', 
    password: '21062006', // OJO: Idealmente usa variables de entorno (.env) para esto
    port: 5432,
});

// --- 2. CONFIGURACIÓN MONGODB (Auditoría - Criterio 1.3) ---
// Nota: A veces localhost da problemas en Node modernos, si falla usa 127.0.0.1
try {
    await mongoose.connect('mongodb://127.0.0.1:27017/ecotrace_logs');
    console.log('Mongo Connected');
} catch (err) {
    console.error('Mongo Error:', err);
}

// Esquema flexible para Logs (NoSQL)
const LogSchema = new mongoose.Schema({
    evento: String,
    fecha: { type: Date, default: Date.now },
    usuario_id: Number,
    ip: String,
    detalles: Object 
});
const Log = mongoose.model('Log', LogSchema);

// --- RUTAS API ---

// A. LOGIN SIMPLIFICADO
app.post('/api/login', async (req, res) => {
    const { email } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// B. OBTENER MATERIALES
app.get('/api/materiales', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM materiales');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// C. OBTENER DATOS USUARIO
app.get('/api/usuario/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// D. REGISTRAR RECICLAJE
app.post('/api/reciclar', async (req, res) => {
    const { id_usuario, id_material, peso } = req.body;
    const ip = req.ip;

    try {
        // 1. Postgres (Transacción)
        await pool.query('CALL sp_registrar_reciclaje($1, $2, $3)', 
            [id_usuario, id_material, peso]);

        // 2. MongoDB (Auditoría)
        await Log.create({
            evento: 'DEPOSITO_EXITOSO',
            usuario_id: id_usuario,
            ip: ip,
            detalles: { material: id_material, peso_registrado: peso }
        });

        res.json({ message: 'Procesado correctamente' });

    } catch (error) {
        // Log de Error en Mongo
        try {
            await Log.create({
                evento: 'ERROR_TRANSACCION',
                usuario_id: id_usuario,
                detalles: { error: error.message }
            });
        } catch (mongoErr) {
            console.error("Error guardando log de fallo:", mongoErr);
        }
        res.status(500).json({ error: error.message });
    }
});

// E. REPORTE PARA EL ADMIN
app.get('/api/reporte', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vw_impacto_ambiental');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));