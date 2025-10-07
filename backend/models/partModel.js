// backend/models/partModel.js (Sử dụng ES Module)
import { pool } from '../db.js';
import { mapToCamelCase } from '../utils.js';
import { nanoid } from 'nanoid';

/**
 * Lấy tất cả vật tư từ DB.
 */
export async function getAllParts() {
    const query = 'SELECT * FROM parts ORDER BY name ASC';
    const result = await pool.query(query);
    return result.rows.map(mapToCamelCase);
}

/**
 * Thêm vật tư mới.
 * @param {object} newPart - Dữ liệu vật tư mới.
 */
export async function createPart(newPart) {
    const newId = newPart.id || `SP-${nanoid(6)}`; 
    
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
    return mapToCamelCase(result.rows[0]);
}

/**
 * Cập nhật vật tư theo ID.
 * @param {string} id - Mã vật tư.
 * @param {object} updates - Các trường cần cập nhật.
 */
export async function updatePart(id, updates) {
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
        throw new Error('No fields to update');
    }

    const query = `
        UPDATE parts SET ${setClauses.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *;
    `;
    values.push(id);
    
    const result = await pool.query(query, values);
    
    if (result.rowCount === 0) return null;
    return mapToCamelCase(result.rows[0]);
}

/**
 * Xóa vật tư theo ID.
 * @param {string} id - Mã vật tư.
 */
export async function deletePart(id) {
    const result = await pool.query('DELETE FROM parts WHERE id = $1', [id]);
    return result.rowCount > 0;
}

/**
 * Ghi nhận Nhập/Xuất kho.
 * @param {string} partId - Mã vật tư.
 * @param {number} quantity - Số lượng.
 * @param {('IN'|'OUT')} type - Loại giao dịch.
 * @returns {object} Thông tin vật tư đã cập nhật.
 */
export async function recordMovement(partId, quantity, type) {
    const qty = Number(quantity);

    if (type === 'OUT') {
         const checkResult = await pool.query('SELECT stock FROM parts WHERE id = $1', [partId]);
         const currentStock = checkResult.rows[0]?.stock || 0;
         if (currentStock < qty) {
             throw new Error(`Insufficient stock. Current: ${currentStock}`);
         }
    }
    
    const simpleQuery = `
        UPDATE parts 
        SET stock = stock ${type === 'IN' ? '+' : '-'} $2 ${type === 'IN' ? ', last_in = NOW()' : ''}
        WHERE id = $1
        RETURNING *;
    `;

    const result = await pool.query(simpleQuery, [partId, qty]);

    if (result.rowCount === 0) return null;
    return mapToCamelCase(result.rows[0]);
}