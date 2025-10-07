// backend/utils.js (Sử dụng ES Module)

/**
 * Helper function để chuyển từ snake_case (DB) sang camelCase (JS/FE)
 * @param {object} row - Row object từ kết quả truy vấn PostgreSQL
 * @returns {object} Object với key là camelCase
 */
export const mapToCamelCase = (row) => {
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