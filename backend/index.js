// backend/index.js (Sử dụng ES Module)

// Để đọc .env files trong môi trường ESM, sử dụng 'dotenv/config' (cần cài đặt dotenv)
import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import partRoutes from './routes/partRoutes.js'; 
import { initializeDatabase } from './db.js'; 

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ===================================
// API ROUTES
// ===================================

// Sử dụng Part Routes cho endpoint /api/parts
app.use('/api/parts', partRoutes);

// Khởi động DB và server
initializeDatabase().then(() => {
    console.log('Database initialized successfully. App is ready.');

    // Khởi động server cho môi trường local (Không cần cho Vercel/Serverless)
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV) {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
}).catch(err => {
    console.error('Failed to start server due to database error.');
    // Ứng dụng serverless thường tự xử lý lỗi này, nhưng local nên báo lỗi.
});

// Export default app cho Serverless Functions (Vercel)
export default app;