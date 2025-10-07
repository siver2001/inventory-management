// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntdApp } from 'antd'; 
import App from './App.jsx'; // Import App mới
import './index.css'; 

// Thiết lập theme Ant Design
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
        {/* Render App Component */}
        <App />
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>,
);