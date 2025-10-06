// frontend/src/services/apiService.js
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiFetch = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    try {
        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            let errorData = { message: response.statusText };
            try { errorData = await response.json(); } catch (e) {}
            throw new Error(errorData.message || `API Error: Status ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }
        return {};

    } catch (error) {
        console.error('Fetch Error:', error);
        throw error; 
    }
};

export default apiFetch;