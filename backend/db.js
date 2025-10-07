// backend/db.js (Sử dụng ES Module)
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

// Cấu hình Pool
export const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

/**
 * Kiểm tra kết nối và đảm bảo bảng 'parts' tồn tại.
 */
export async function initializeDatabase() {
    let client;
    try {
        client = await pool.connect();
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
        await client.query(createTableQuery);
        console.log('Parts table ensured.');
    } catch (err) {
        console.error('--- LỖI KẾT NỐI DB CHI TIẾT ---');
        console.error('Lỗi message:', err.message); 
        console.error('Lỗi code (nếu có):', err.code); 
        console.error('Lỗi stack:', err.stack);
        throw err;
    } finally {
        if (client) {
            client.release();
        }
    }
}