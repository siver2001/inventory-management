// backend/index.js (PostgreSQL Serverless Version)

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');           
const cors = require('cors');
const { nanoid } = require('nanoid');     

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ===================================
// KẾT NỐI VÀ KHỞI TẠO POSTGRES
// ===================================
const DATABASE_URL = process.env.DATABASE_URL;

// Cấu hình Pool (ssl: { rejectUnauthorized: false } là cần thiết cho Render/Supabase)
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test kết nối và đảm bảo bảng tồn tại
pool.connect()
    .then(client => {
        console.log('PostgreSQL connected');
        // SQL để tạo bảng parts nếu chưa tồn tại
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS parts (
                id VARCHAR(255) PRIMARY KEY,
                qr_code_id VARCHAR(255) UNIQUE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                unit VARCHAR(50) DEFAULT 'Cái',
                stock INTEGER DEFAULT 0,
                critical_threshold INTEGER DEFAULT 3,
                low_stock_threshold INTEGER DEFAULT 8,
                location VARCHAR(255),
                image TEXT,
                vendor VARCHAR(255),
                last_in TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                category VARCHAR(255) DEFAULT 'General',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        client.query(createTableQuery)
            .then(() => console.log('Parts table ensured.'))
            .catch(err => console.error('Error ensuring parts table:', err.message))
            .finally(() => client.release());
    })
    .catch(err => console.error('PostgreSQL connection error:', err.message));


// Helper function để chuyển từ snake_case (DB) sang camelCase (JS/FE)
const mapToCamelCase = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        qrCodeId: row.qr_code_id,
        name: row.name,
        description: row.description,
        unit: row.unit,
        stock: row.stock,
        criticalThreshold: row.critical_threshold,
        lowStockThreshold: row.low_stock_threshold,
        location: row.location,
        image: row.image,
        vendor: row.vendor,
        lastIn: row.last_in,
        category: row.category,
        createdAt: row.created_at,
    };
};

// ===================================
// API ROUTES
// ===================================

// GET ALL: Lấy tất cả vật tư
app.get('/api/parts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM parts ORDER BY name ASC');
        const parts = result.rows.map(mapToCamelCase);
        res.json(parts);
    } catch (err) {
        console.error('Error fetching parts:', err.message);
        res.status(500).json({ message: 'Error fetching parts', error: err.message });
    }
});

// CREATE: Thêm vật tư mới
app.post('/api/parts', async (req, res) => {
    try {
        const newPart = req.body;
        const newId = newPart.id || nanoid(); 
        
        const query = `
            INSERT INTO parts (
                id, name, description, unit, stock, critical_threshold, low_stock_threshold, location, image, vendor, category
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *;
        `;
        const values = [
            newId, 
            newPart.name, 
            newPart.description || null, 
            newPart.unit, 
            newPart.stock, 
            newPart.criticalThreshold, 
            newPart.lowStockThreshold, 
            newPart.location, 
            newPart.image, 
            newPart.vendor, 
            newPart.category
        ];
        
        const result = await pool.query(query, values);
        res.status(201).json(mapToCamelCase(result.rows[0]));
    } catch (err) {
        console.error('Error creating part:', err.message);
        res.status(400).json({ message: 'Error creating part', error: err.message });
    }
});

// UPDATE: Cập nhật vật tư theo id (Bao gồm cả cập nhật qrCodeId)
app.put('/api/parts/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updates = req.body;
        
        const setClauses = [];
        const values = [];
        let paramCount = 1;

        const updateKeys = {
            name: updates.name,
            description: updates.description,
            unit: updates.unit,
            stock: updates.stock,
            critical_threshold: updates.criticalThreshold,
            low_stock_threshold: updates.lowStockThreshold,
            location: updates.location,
            image: updates.image,
            vendor: updates.vendor,
            category: updates.category,
            qr_code_id: updates.qrCodeId, 
        };

        for (const key in updateKeys) {
            if (updateKeys[key] !== undefined) {
                setClauses.push(`${key} = $${paramCount++}`);
                values.push(updateKeys[key]);
            }
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        const query = `
            UPDATE parts SET ${setClauses.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *;
        `;
        values.push(id);
        
        const result = await pool.query(query, values);
        
        if (result.rowCount === 0) return res.status(404).json({ message: 'Part not found' });
        res.json(mapToCamelCase(result.rows[0]));
        
    } catch (err) {
        console.error('Error updating part:', err.message);
        res.status(400).json({ message: 'Error updating part', error: err.message });
    }
});

// DELETE: Xóa vật tư theo id
app.delete('/api/parts/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM parts WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Part not found' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Error deleting part', error: err.message });
    }
});

// STOCK MOVEMENT: Nhập/Xuất kho 
app.post('/api/parts/move', async (req, res) => {
    const { partId, quantity, type } = req.body;
    const qty = Number(quantity);

    if (isNaN(qty) || qty <= 0) return res.status(400).json({ message: 'Invalid quantity' });

    try {
        if (type === 'OUT') {
             const checkResult = await pool.query('SELECT stock FROM parts WHERE id = $1', [partId]);
             const currentStock = checkResult.rows[0]?.stock || 0;
             if (currentStock < qty) {
                 return res.status(400).json({ message: `Insufficient stock. Current: ${currentStock}` });
             }
        }
        
        // Cập nhật stock bằng toán tử SQL
        const simpleQuery = `
            UPDATE parts 
            SET stock = stock ${type === 'IN' ? '+' : '-'} $2 ${type === 'IN' ? ', last_in = NOW()' : ''}
            WHERE id = $1
            RETURNING *;
        `;

        const result = await pool.query(simpleQuery, [partId, qty]);

        if (result.rowCount === 0) return res.status(404).json({ message: 'Part not found' });
        res.json(mapToCamelCase(result.rows[0]));
        
    } catch (err) {
        console.error('Error recording movement:', err.message);
        res.status(500).json({ message: 'Error recording movement', error: err.message });
    }
});


// Export Express App cho Serverless Functions (QUAN TRỌNG VERCEL)
module.exports = app;