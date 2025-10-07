// frontend/src/App.jsx
import React from 'react';
import InventoryPage from './pages/InventoryPage.jsx';
import { AuthProvider } from './context/AuthContext.jsx'; // Import AuthProvider

// App Component sẽ đảm nhận việc cung cấp Auth Context
const App = () => {
    return (
        <AuthProvider>
            {/* Trang chính của ứng dụng quản lý kho */}
            <InventoryPage />
        </AuthProvider>
    );
};

export default App;