// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext } from 'react';
import { App } from 'antd'; 

// Tạo Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Provider Component chỉ cung cấp quyền Admin (Level 0)
export const AuthProvider = ({ children }) => {
    const { message } = App.useApp();
    
    const value = {
        isAuthenticated: true,
        userRole: 'Admin',
        username: 'admin_inventory',
        roleLevel: 0, // Cấp độ 0: Cho phép mọi thao tác CRUD
        // Hàm mock
        login: () => { message.success('Đăng nhập thành công (Mock)!'); },
        logout: () => { message.info('Đăng xuất thành công (Mock)!'); },
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};