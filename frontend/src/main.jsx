import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntdApp } from 'antd'; 
import InventoryPage from './pages/InventoryPage.jsx';
import './index.css'; 

const customTheme = {
  token: {
    colorPrimary: '#0052D9', 
    borderRadius: 6,
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider theme={customTheme}>
      <AntdApp> 
        {/* Chỉ load trang quản lý kho */}
        <InventoryPage />
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>,
);