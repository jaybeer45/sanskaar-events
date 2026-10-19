// src/services/socket.js
import { io } from 'socket.io-client';

let socket = null;

// Ek hi socket connection poore app mein reuse hota hai — baar-baar naya
// connection banana galat hai (memory leak + duplicate events milenge)
export const getSocket = () => {
    if (!socket) {
        const token = localStorage.getItem('sanskaar_token');
        socket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000', {
            auth: { token },
            autoConnect: false, // hum khud connect() call karenge jab live page khulega
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};