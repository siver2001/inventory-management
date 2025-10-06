// backend/models/Part.js
const mongoose = require('mongoose');

const PartSchema = new mongoose.Schema({
    // Sử dụng ID độc nhất để đơn giản hóa logic CRUD
    id: { type: String, required: true, unique: true }, 
    
    qrCodeId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    description: { type: String },
    unit: { type: String, default: 'Cái' },
    
    stock: { type: Number, default: 0 },
    criticalThreshold: { type: Number, default: 3 },
    lowStockThreshold: { type: Number, default: 8 },
    
    location: { type: String },
    image: { type: String },
    vendor: { type: String },
    lastIn: { type: Date, default: Date.now },
    category: { type: String, default: 'General' },
}, { 
    timestamps: true, // Thêm createdAt và updatedAt
    // Đảm bảo toJSON và toObject xử lý virtual fields nếu cần
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Thêm Virtual field (Tương tự logic getPartStatus ở FE)
// Mặc dù FE có thể tính, BE nên trả về đủ dữ liệu gốc.

module.exports = mongoose.model('Part', PartSchema);