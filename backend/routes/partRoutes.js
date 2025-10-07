// backend/routes/partRoutes.js (Sử dụng ES Module)
import express from 'express';
// Import tất cả các hàm từ model
import * as partModel from '../models/partModel.js'; 

const router = express.Router();

// GET /api/parts : Lấy tất cả vật tư
router.get('/', async (req, res) => {
    try {
        const parts = await partModel.getAllParts();
        res.json(parts);
    } catch (err) {
        console.error('Error fetching parts:', err.message);
        res.status(500).json({ message: 'Error fetching parts', error: err.message });
    }
});

// POST /api/parts : Thêm vật tư mới
router.post('/', async (req, res) => {
    try {
        const newPart = await partModel.createPart(req.body);
        res.status(201).json(newPart);
    } catch (err) {
        if (err.code === '23505') { 
            return res.status(409).json({ message: 'Part ID already exists', error: err.message });
        }
        console.error('Error creating part:', err.message);
        res.status(400).json({ message: 'Error creating part', error: err.message });
    }
});

// PUT /api/parts/:id : Cập nhật vật tư theo id
router.put('/:id', async (req, res) => {
    try {
        const updatedPart = await partModel.updatePart(req.params.id, req.body);
        
        if (!updatedPart) return res.status(404).json({ message: 'Part not found' });
        
        res.json(updatedPart);
        
    } catch (err) {
        console.error('Error updating part:', err.message);
        res.status(400).json({ message: 'Error updating part', error: err.message });
    }
});

// DELETE /api/parts/:id : Xóa vật tư theo id
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await partModel.deletePart(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Part not found' });
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting part:', err.message);
        res.status(500).json({ message: 'Error deleting part', error: err.message });
    }
});

// POST /api/parts/move : Nhập/Xuất kho 
router.post('/move', async (req, res) => {
    const { partId, quantity, type } = req.body;
    const qty = Number(quantity);

    if (isNaN(qty) || qty <= 0) return res.status(400).json({ message: 'Invalid quantity' });
    if (type !== 'IN' && type !== 'OUT') return res.status(400).json({ message: 'Invalid movement type' });

    try {
        const updatedPart = await partModel.recordMovement(partId, qty, type);
        
        if (!updatedPart) return res.status(404).json({ message: 'Part not found' });
        res.json(updatedPart);
        
    } catch (err) {
        if (err.message.includes('Insufficient stock')) {
             return res.status(400).json({ message: err.message });
        }
        console.error('Error recording movement:', err.message);
        res.status(500).json({ message: 'Error recording movement', error: err.message });
    }
});

export default router;