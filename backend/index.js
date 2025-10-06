// backend/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Part = require('./models/Part');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// ===================================
// API ROUTES
// ===================================

// GET ALL: Lấy tất cả vật tư
app.get('/api/parts', async (req, res) => {
    try {
        const parts = await Part.find({}).sort({ name: 1 });
        res.json(parts);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching parts', error: err.message });
    }
});

// CREATE: Thêm vật tư mới
app.post('/api/parts', async (req, res) => {
    try {
        const newPart = new Part(req.body);
        await newPart.save();
        res.status(201).json(newPart);
    } catch (err) {
        // Lỗi trùng lặp ID hoặc validation
        res.status(400).json({ message: 'Error creating part', error: err.message });
    }
});

// UPDATE: Cập nhật vật tư theo id
app.put('/api/parts/:id', async (req, res) => {
    try {
        // Sử dụng findOneAndUpdate để tìm theo id và cập nhật
        const updatedPart = await Part.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        if (!updatedPart) return res.status(404).json({ message: 'Part not found' });
        res.json(updatedPart);
    } catch (err) {
        res.status(400).json({ message: 'Error updating part', error: err.message });
    }
});

// DELETE: Xóa vật tư theo id
app.delete('/api/parts/:id', async (req, res) => {
    try {
        const result = await Part.deleteOne({ id: req.params.id });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Part not found' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Error deleting part', error: err.message });
    }
});

// STOCK MOVEMENT: Nhập/Xuất kho (POST /api/parts/move)
app.post('/api/parts/move', async (req, res) => {
    const { partId, quantity, type } = req.body;
    const qty = Number(quantity);

    if (isNaN(qty) || qty <= 0) return res.status(400).json({ message: 'Invalid quantity' });

    try {
        let part = await Part.findOne({ id: partId });
        if (!part) return res.status(404).json({ message: 'Part not found' });

        let newStock = part.stock;
        if (type === 'IN') {
            newStock += qty;
            part.lastIn = new Date();
        } else if (type === 'OUT') {
            if (part.stock < qty) return res.status(400).json({ message: `Insufficient stock. Current: ${part.stock}` });
            newStock -= qty;
        } else {
            return res.status(400).json({ message: 'Invalid movement type' });
        }

        part.stock = newStock;
        await part.save();
        res.json(part);
    } catch (err) {
        res.status(500).json({ message: 'Error recording movement', error: err.message });
    }
});


// Export Express App cho Serverless Functions (QUAN TRỌNG VERCEL)
module.exports = app;