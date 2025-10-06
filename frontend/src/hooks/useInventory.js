// frontend/src/hooks/useInventory.js
import { useState, useMemo, useCallback, useEffect } from 'react';
import { App } from 'antd';
import apiFetch from '../services/apiService';
// Import faker chỉ để mock QR ID
import { faker } from '@faker-js/faker';

// Hàm helper (tương tự như trong file gốc)
const getPartStatus = (stock, critical, low) => {
    if (stock <= critical) return { status: 'Critical Low', color: 'red' };
    if (stock <= low) return { status: 'Low Stock', color: 'volcano' };
    return { status: 'Normal', color: 'green' };
};

export const useInventory = () => {
    const { message } = App.useApp();
    const [parts, setParts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchParts = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('/parts'); // GET /api/parts
            setParts(data);
        } catch (error) {
            message.error(`Không thể tải dữ liệu: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [message]);

    useEffect(() => {
        fetchParts();
    }, [fetchParts]);

    const partsWithStatus = useMemo(() => {
        return parts.map(p => {
            const { status, color } = getPartStatus(
                p.stock, 
                p.criticalThreshold || 3, 
                p.lowStockThreshold || 8
            );
            return { ...p, status, color };
        });
    }, [parts]);
    
    // CRUD: Thêm/Cập nhật
    const savePart = useCallback(async (partData, isNew) => {
        try {
            const endpoint = isNew ? '/parts' : `/parts/${partData.id}`;
            const method = isNew ? 'POST' : 'PUT';

            const response = await apiFetch(endpoint, {
                method,
                body: JSON.stringify(partData)
            });

            fetchParts();
            message.success(`Đã ${isNew ? 'thêm' : 'cập nhật'} vật tư: ${response.name}`);
            return true;
        } catch (error) {
            message.error(`Lỗi API: ${error.message}`);
            return false;
        }
    }, [message, fetchParts]);

    // CRUD: Xóa
    const deletePart = useCallback(async (id) => {
        try {
            await apiFetch(`/parts/${id}`, { method: 'DELETE' });
            fetchParts(); 
            message.warning(`Đã xóa vật tư ${id}.`);
        } catch (error) {
            message.error(`Lỗi xóa: ${error.message}`);
        }
    }, [message, fetchParts]);
    
    // Ghi nhận Nhập/Xuất kho
    const recordStockMovement = useCallback(async (partId, quantity, type, notes) => {
        try {
            const success = await apiFetch(`/parts/move`, {
                method: 'POST',
                body: JSON.stringify({ partId, quantity, type, notes })
            });

            fetchParts();
            return !!success; // Trả về true nếu thành công
        } catch (error) {
            message.error(`Lỗi giao dịch: ${error.message}`);
            return false;
        }
    }, [message, fetchParts]);
    
    // Mock: Tạo QR Code (Chỉ cần cập nhật trường qrCodeId qua API)
    const generateQrCode = useCallback(async (partId, partName) => {
        try {
            const newQrCodeId = faker.string.uuid();
            await savePart({ id: partId, qrCodeId: newQrCodeId }, false); // Cập nhật QR ID
            message.success(`Đã tạo QR Code thành công cho vật tư ${partName}.`);
            return newQrCodeId;
        } catch (error) {
             message.error(`Lỗi tạo QR: ${error.message}`);
        }
    }, [savePart, message]);
    
    const allPartCategories = useMemo(() => {
        const uniqueCategories = [...new Set(parts.map(p => p.category))];
        return uniqueCategories.filter(c => c).sort(); 
    }, [parts]); 

    return {
        parts: partsWithStatus,
        isLoading,
        savePart,
        deletePart,
        recordStockMovement,
        generateQrCode,
        PART_CATEGORIES: allPartCategories,
        summary: {
            totalItems: parts.length,
            criticalCount: partsWithStatus.filter(p => p.status === 'Critical Low').length,
            lowStockCount: partsWithStatus.filter(p => p.status === 'Low Stock').length,
        }
    };
};