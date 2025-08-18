// src/App.js
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import RouterSetup from './routes/Routes';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';

function App() {
    return (
        <Router>
            <AuthProvider>
                    <RouterSetup />
                    <ToastContainer position="top-center" autoClose={3000} />
            </AuthProvider>
        </Router>
    );
}

export default App;
