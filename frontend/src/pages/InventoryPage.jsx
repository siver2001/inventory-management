// frontend/src/pages/InventoryPage.jsx

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
// Đã loại bỏ useNavigate, useLocation
import { 
    Typography, Space, Table, Button, Tag, Modal, Form, Input, InputNumber, 
    Divider, Statistic, Row, Col, Card, Popconfirm, Select, Avatar, App, Popover
} from 'antd';
import { 
    PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined, 
    DownloadOutlined, StockOutlined, ShopOutlined, AlertOutlined, QrcodeOutlined, PrinterOutlined, WarningOutlined, ThunderboltOutlined,
    LinkOutlined, SwapOutlined 
} from '@ant-design/icons';

// Dùng Hook đã được chỉnh sửa
import { useInventory } from '../hooks/useInventory'; 
import dayjs from 'dayjs';
import { QRCodeCanvas as QRCode } from 'qrcode.react'; 
// Dùng Auth Context Mock
import { useAuth } from '../context/AuthContext'; 

const { Title, Text } = Typography;
const { Option } = Select;

// Hàm mock export CSV (tái sử dụng từ file gốc)
const mockExportToCSV = (data, filename = 'spare_parts_inventory.csv') => {
    const exportColumns = [
        { dataIndex: 'id', title: 'Mã Vật tư' },
        { dataIndex: 'name', title: 'Tên Vật tư' },
        { dataIndex: 'stock', title: 'Số lượng Tồn' },
        { dataIndex: 'unit', title: 'Đơn vị' },
        { dataIndex: 'criticalThreshold', title: 'Ngưỡng Nguy hiểm' }, 
        { dataIndex: 'lowStockThreshold', title: 'Ngưỡng Cảnh báo' }, 
        { dataIndex: 'location', title: 'Vị trí Kho' },
        { dataIndex: 'vendor', title: 'Nhà cung cấp' },
        { dataIndex: 'status', title: 'Trạng thái Tồn kho' },
    ];
    
    const headers = exportColumns.map(col => col.title);
    let csv = headers.join(',') + '\n';

    data.forEach(row => {
        const rowData = exportColumns
            .map(col => {
                let value = row[col.dataIndex] || '';
                value = String(value).replace(/"/g, '""').replace(/\n/g, ' '); 
                return `"${value}"`;
            })
            .join(',');
        csv += rowData + '\n';
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' }); 
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Component QR Code In ấn Tùy chỉnh (tái sử dụng từ file gốc)
const PrintableQRCode = ({ part }) => {
    // URL MÃ HÓA: Dùng localhost và ID vật tư
    const qrData = `http://localhost:5173/inventory?scanId=${part.qrCodeId}`; 

    const printRef = useRef();

    const handlePrint = () => {
        const printContent = printRef.current;
        const printWindow = window.open('', '', 'height=600,width=800');
        
        const printStyles = `
            @media print { 
                body { margin: 0; } 
                .print-area { 
                    display: flex; flex-direction: column; align-items: center; justify-content: center; 
                    padding: 20px; border: 1px solid black; width: 300px; height: 350px; 
                    font-family: Arial, sans-serif; margin: 20px auto;
                }
                .header { font-size: 16px; font-weight: bold; margin-bottom: 10px; } 
                .info { font-size: 12px; margin-top: 5px; }
                .ant-btn { display: none; } 
                .ant-tag { display: inline; color: #333; font-weight: bold; } 
            }
        `;

        printWindow.document.write(`
            <html>
                <head>
                    <title>In Mã QR</title>
                    <style>${printStyles}</style>
                </head>
                <body>
                    <div id="print-area-content"></div>
                </body>
            </html>
        `);
        
        const clonedContent = printContent.cloneNode(true);
        printWindow.document.getElementById('print-area-content').appendChild(clonedContent);
        
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <Space direction="vertical" style={{ display: 'flex' }}>
            <div ref={printRef} className="print-area tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-5 tw-border tw-border-dashed tw-border-gray-400 tw-rounded">
                <div className="header tw-text-lg tw-font-bold tw-mb-2">{part.name}</div>
                {part.qrCodeId ? <QRCode value={qrData} size={150} level="H" /> : <Text type="danger">Mã QR chưa được tạo</Text>} 
                
                <div className="info tw-text-xs tw-mt-3">Mã ID: {part.id}</div>
                <div className="info tw-text-xs">Loại: {part.category}</div> 
                <div className="info tw-text-xs">Tồn kho: {part.stock} {part.unit}</div> 
                <div className="info tw-text-xs">Vị trí: {part.location}</div>
                <div className="info tw-text-xs">Trạng thái: <Tag color={part.color} style={{ margin: 0 }}>{part.status}</Tag></div>
                
                <div className="info tw-text-xs">QR ID: {part.qrCodeId ? part.qrCodeId.slice(0, 10) + '...' : 'N/A'}</div>
            </div>
            
            <Space className="tw-mt-2">
                {part.qrCodeId && (
                    <Button icon={<PrinterOutlined />} type="default" onClick={handlePrint}>
                        In Mã QR này
                    </Button>
                )}
                <Button 
                    icon={<LinkOutlined />} 
                    type="dashed" 
                    onClick={() => window.open(`/maintenance/inventory`, '_blank')}
                >
                    Xem Trang Quản lý Kho
                </Button>
            </Space>
        </Space>
    );
};

// Component Image Preview trên hover (tái sử dụng từ file gốc)
const ImageZoomPreview = ({ url, name }) => (
    <Popover
        content={<img src={url || 'https://via.placeholder.com/200?text=No+Image'} alt={name} style={{ width: 200, height: 'auto', borderRadius: 4 }} />}
        title={name}
        trigger="hover"
        placement="right"
    >
        <Avatar src={url} shape="square" size={40} icon={<ShopOutlined />} />
    </Popover>
);


const SparePartsInventoryPageContent = () => {
    // SỬ DỤNG HOOK MỚI
    const { parts, savePart, deletePart, summary, PART_CATEGORIES: categories, generateQrCode, recordStockMovement, isLoading } = useInventory(); 
    
    // Sử dụng Auth Mock
    const { roleLevel } = useAuth(); 
    const { message: messageApi } = App.useApp();
    
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isQRModalVisible, setIsQRModalVisible] = useState(false);
    const [isMovementModalVisible, setIsMovementModalVisible] = useState(false);
    const [currentPart, setCurrentPart] = useState(null);
    const [qrPart, setQrPart] = useState(null); 
    const [form] = Form.useForm();
    const [movementForm] = Form.useForm(); 
    const [filters, setFilters] = useState({ name: '', status: null, category: null }); 
    
    const canEdit = roleLevel <= 3; // Giả định cấp độ User (3) trở lên đều được quản lý kho
    const isReadOnly = !canEdit;

    // --- Logic Nhập/Xuất Kho Thủ công ---
    const handleOpenMovementModal = () => {
         if (isReadOnly) return messageApi.warning("Bạn không có quyền quản lý nhập/xuất kho.");
         movementForm.resetFields();
         movementForm.setFieldsValue({ type: 'OUT' });
         setIsMovementModalVisible(true);
    };
    
    const handleRecordMovement = async (values) => {
         // Kiểm tra tồn kho trước khi gửi lên API (chỉ cho OUT)
         if (values.type === 'OUT') {
             const selectedPart = parts.find(p => p.id === values.partId);
             if (selectedPart && selectedPart.stock < values.quantity) {
                 messageApi.error(`Không đủ tồn kho: Chỉ còn ${selectedPart.stock} ${selectedPart.unit}.`);
                 return;
             }
         }
         
         const success = await recordStockMovement(
            values.partId, 
            values.quantity, 
            values.type, 
            values.notes
         );
         if (success) {
            setIsMovementModalVisible(false);
            movementForm.resetFields();
         }
    };
    
    // --- Logic CRUD & Modal ---
    const handleAdd = () => {
        if (isReadOnly) return messageApi.warning("Bạn không có quyền thêm vật tư.");
        setCurrentPart(null);
        form.resetFields();
        form.setFieldsValue({ 
            id: `SP-${Date.now().toString().slice(-4)}`,
            category: categories[0] || 'Vòng bi/Bạc đạn',
            criticalThreshold: 2, 
            lowStockThreshold: 5,  
            stock: 0,
            unit: 'Cái'
        });
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        if (isReadOnly) return messageApi.warning("Bạn không có quyền chỉnh sửa vật tư.");
        setCurrentPart(record);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleSave = (values) => {
        // Xử lý Category từ Select mode="tags"
        const categoryValue = Array.isArray(values.category) ? values.category[0] : values.category;
        const finalCategory = categoryValue ? categoryValue.trim() : values.category;
        
        // Kiểm tra ngưỡng
        if (values.criticalThreshold >= values.lowStockThreshold) {
            messageApi.error('Ngưỡng Nguy hiểm phải nhỏ hơn Ngưỡng Cảnh báo.');
            return;
        }

        savePart({ 
            ...values, 
            category: finalCategory,
            image: currentPart?.image || values.image || 'https://via.placeholder.com/500?text=Spare+Part'
        }, !currentPart);
        setIsModalVisible(false);
        setCurrentPart(null);
    };
    
    // --- Logic Export ---
    const handleExport = () => {
        mockExportToCSV(parts, `kho_vat_tu_${dayjs().format('YYYYMMDD')}.csv`);
        messageApi.success('Đã xuất dữ liệu kho vật tư thành công!');
    };

    const handleShowQR = (record) => {
        setQrPart(record);
        setIsQRModalVisible(true);
    };
    
    const handleCreateQrCode = (record) => {
        generateQrCode(record.id, record.name);
    }


    // --- Logic Lọc ---
    const filteredParts = useMemo(() => {
        return parts.filter(p => {
            let match = true;
            if (filters.name && !p.name.toLowerCase().includes(filters.name.toLowerCase())) match = false;
            if (filters.status && filters.status !== 'All' && p.status !== filters.status) match = false;
            if (filters.category && filters.category !== 'All' && p.category !== filters.category) match = false; 
            return match;
        });
    }, [parts, filters]);


    // --- Cấu hình Bảng ---
    const columns = [
        { 
            title: 'Mã QR', 
            key: 'qrCode', 
            width: 150,
            fixed: 'left',
            render: (_, record) => (
                record.qrCodeId ? (
                    <Button 
                        icon={<QrcodeOutlined />} 
                        size="small" 
                        onClick={() => handleShowQR(record)}
                        type="default"
                        disabled={isReadOnly}
                    >
                        In QR ({record.id})
                    </Button>
                ) : (
                     <Popconfirm
                        title={`Bạn có chắc chắn muốn tạo Mã QR mới cho ${record.id}?`}
                        onConfirm={() => handleCreateQrCode(record)}
                        okText="Tạo QR"
                        cancelText="Hủy"
                        disabled={isReadOnly}
                    >
                         <Button 
                            icon={<ThunderboltOutlined />} 
                            size="small" 
                            type="dashed"
                            danger
                            disabled={isReadOnly}
                        >
                            Tạo QR
                        </Button>
                    </Popconfirm>
                )
            )
        },
        { 
            title: 'Hình ảnh', 
            dataIndex: 'image', 
            key: 'image', 
            width: 120,
            render: (url, record) => <ImageZoomPreview url={url} name={record.name} />
        },
        { title: 'Mã Vật tư', dataIndex: 'id', key: 'id', width: 120, sorter: (a, b) => a.id.localeCompare(b.id) },
        { 
            title: 'Tên Vật tư', 
            dataIndex: 'name', 
            key: 'name', 
            ellipsis: true,
            width: 250
        },
        { 
            title: 'Loại Vật tư', 
            dataIndex: 'category', 
            key: 'category', 
            width: 150, 
            render: (text) => <Tag color="blue">{text}</Tag> ,
            filters: categories.map(c => ({ text: c, value: c })),
            onFilter: (value, record) => record.category === value,
        },
        { 
            title: 'Tồn kho', 
            dataIndex: 'stock', 
            key: 'stock', 
            width: 100,
            render: (text) => <Text strong>{text}</Text>,
            sorter: (a, b) => a.stock - b.stock
        },
        { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 80 },
        { title: 'Vị trí', dataIndex: 'location', key: 'location', width: 120 },
        { 
            title: 'Trạng thái Tồn', 
            dataIndex: 'status', 
            key: 'status', 
            width: 180,
            render: (status, record) => (
                <Tag color={record.color} icon={<StockOutlined />}>
                    {status.toUpperCase()} (Ngưỡng Cảnh báo: {record.lowStockThreshold})
                </Tag>
            ),
            filters: [{ text: 'Critical Low', value: 'Critical Low' }, { text: 'Low Stock', value: 'Low Stock' }, { text: 'Normal', value: 'Normal' }],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 200,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} disabled={isReadOnly}>Sửa</Button>
                    <Popconfirm
                        title="Bạn chắc chắn muốn xóa vật tư này?"
                        onConfirm={() => deletePart(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        disabled={isReadOnly}
                    >
                        <Button icon={<DeleteOutlined />} size="small" danger disabled={isReadOnly}>Xóa</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Space direction="vertical" size={24} style={{ display: 'flex', padding: 24 }}>
            <Title level={3}><StockOutlined /> Quản lý Kho Vật tư Bảo trì</Title>

            <Divider orientation="left">Tổng quan Tồn kho</Divider>
            
            <Row gutter={24}>
                <Col span={8}>
                    <Card variant="borderless" className="tw-shadow-md" style={{ borderLeft: '4px solid #1677ff' }}>
                        <Statistic title="Tổng số Vật tư Khác nhau" value={parts.length} prefix={<ShopOutlined />} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card variant="borderless" className="tw-shadow-md" style={{ borderLeft: '4px solid #ff4d4f' }}>
                        <Statistic 
                            title="Nguy hiểm (Critical Low)" 
                            value={summary.criticalCount} 
                            prefix={<AlertOutlined />} 
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card variant="borderless" className="tw-shadow-md" style={{ borderLeft: '4px solid #faad14' }}>
                        <Statistic 
                            title="Cảnh báo (Low Stock)" 
                            value={summary.lowStockCount} 
                            prefix={<WarningOutlined />} 
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Divider orientation="left">Danh sách Vật tư & Thao tác</Divider>

            <Card className="tw-shadow-md">
                <Row gutter={[16, 16]} align="middle">
                    <Col span={6}>
                        <Input 
                            placeholder="Tìm kiếm theo Tên Vật tư" 
                            prefix={<SearchOutlined />}
                            onChange={(e) => setFilters(f => ({ ...f, name: e.target.value }))}
                            allowClear
                        />
                    </Col>
                    <Col span={4}>
                         <Select
                            placeholder="Lọc theo Loại Vật tư"
                            allowClear
                            onChange={(value) => setFilters(f => ({ ...f, category: value }))}
                            style={{ width: '100%' }}
                        >
                            <Option value="All">Tất cả Loại</Option>
                            {categories.map(c => <Option key={c} value={c}>{c}</Option>)}
                        </Select>
                    </Col>
                     <Col span={4}>
                        <Select
                            placeholder="Lọc Trạng thái"
                            allowClear
                            onChange={(value) => setFilters(f => ({ ...f, status: value }))}
                            style={{ width: '100%' }}
                        >
                            <Option value="Critical Low">Critical Low</Option>
                            <Option value="Low Stock">Low Stock</Option>
                            <Option value="Normal">Normal</Option>
                            <Option value="All">Tất cả</Option>
                        </Select>
                    </Col>
                    <Col span={10} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button 
                                icon={<SwapOutlined />} 
                                onClick={handleOpenMovementModal}
                                disabled={isReadOnly}
                            >
                                Nhập/Xuất Kho
                            </Button>
                            <Button 
                                icon={<DownloadOutlined />} 
                                onClick={handleExport}
                            >
                                Xuất Excel
                            </Button>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />} 
                                onClick={handleAdd}
                                disabled={isReadOnly}
                            >
                                Thêm Vật tư Mới
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>


            <Table
                columns={columns}
                dataSource={filteredParts}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1300 }}
                bordered
                className="tw-shadow-xl"
                loading={isLoading}
            />

            {/* Modal Thêm/Sửa Vật tư */}
            <Modal
                title={currentPart ? "Chỉnh sửa Vật tư" : "Thêm Vật tư Mới"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                okText={currentPart ? "Lưu Thay Đổi" : "Thêm Vật tư"}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item 
                        name="id" 
                        label="Mã Vật tư" 
                        rules={[{ required: true }]}
                    >
                         <Input disabled={!!currentPart} />
                    </Form.Item>
                    <Form.Item name="name" label="Tên Vật tư" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="category" label="Loại Vật tư" rules={[{ required: true }]}>
                         <Select 
                            placeholder="Chọn hoặc gõ để thêm Loại Vật tư mới"
                            showSearch
                            allowClear
                            mode="tags" 
                            tokenSeparators={[',', '|', ' ']}
                         >
                            {categories.map(c => <Option key={c} value={c}>{c}</Option>)}
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="stock" label="Số lượng Tồn" rules={[{ required: true, type: 'number', min: 0 }]}>
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="unit" label="Đơn vị" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Divider orientation="left" style={{ margin: '16px 0' }}>Thiết lập Ngưỡng Tồn kho</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item 
                                name="lowStockThreshold" 
                                label="Ngưỡng CẢNH BÁO (Low Stock)" 
                                rules={[{ required: true, type: 'number', min: 1 }]}
                            >
                                <InputNumber style={{ width: '100%' }} placeholder="Ví dụ: 5" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                name="criticalThreshold" 
                                label="Ngưỡng NGUY HIỂM (Critical Low)"
                                rules={[{ required: true, type: 'number', min: 0 }]}
                            >
                                <InputNumber style={{ width: '100%' }} placeholder="Ví dụ: 2" />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="location" label="Vị trí Kho">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="vendor" label="Nhà cung cấp">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="description" label="Mô tả Chi tiết">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                     <Form.Item name="image" label="Link Hình ảnh (Mock)">
                        <Input placeholder="URL hình ảnh (Ảnh mock sẽ được gán nếu trống)" />
                    </Form.Item>
                </Form>
            </Modal>
            
            {/* Modal In QR Code */}
            <Modal
                title={<Title level={4}><PrinterOutlined /> In Mã QR Vật tư: {qrPart?.id}</Title>}
                open={isQRModalVisible}
                onCancel={() => setIsQRModalVisible(false)}
                footer={null}
                width={400}
            >
                {qrPart && <PrintableQRCode part={qrPart} />}
            </Modal>
            
            {/* Modal Nhập/Xuất Kho */}
             <Modal
                title={<Title level={4}><SwapOutlined /> Ghi nhận Nhập/Xuất Kho</Title>}
                open={isMovementModalVisible}
                onCancel={() => setIsMovementModalVisible(false)}
                footer={null}
                width={500}
            >
                <Form form={movementForm} layout="vertical" onFinish={handleRecordMovement}>
                    <Form.Item 
                        name="type" 
                        label="Loại Giao dịch"
                        rules={[{ required: true, message: 'Vui lòng chọn loại giao dịch' }]}
                    >
                         <Select>
                            <Option value="IN">Nhập kho (IN)</Option>
                            <Option value="OUT">Xuất kho (OUT)</Option>
                         </Select>
                    </Form.Item>
                    
                    <Form.Item 
                        name="partId" 
                        label="Mã Vật tư"
                        rules={[{ required: true, message: 'Vui lòng chọn Vật tư' }]}
                    >
                         <Select 
                            placeholder="Chọn Vật tư"
                            showSearch
                            optionFilterProp="children"
                        >
                            {parts.map(p => <Option key={p.id} value={p.id}>{p.id} - {p.name} (Tồn: {p.stock} {p.unit})</Option>)}
                        </Select>
                    </Form.Item>
                    
                    <Form.Item 
                        name="quantity" 
                        label="Số lượng"
                        rules={[{ required: true, type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' }]}
                    >
                         <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item name="notes" label="Ghi chú">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    
                    <Form.Item className="tw-mt-4">
                        <Button type="primary" htmlType="submit" block>
                            Ghi nhận Giao dịch
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    );
};


export default SparePartsInventoryPageContent;