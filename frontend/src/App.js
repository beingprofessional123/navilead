// src/App.js
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import RouterSetup from './routes/Routes';
import { ToastContainer } from 'react-toastify';
import { LimitProvider } from "./context/LimitContext";
import { AuthProvider } from './context/AuthContext';
import FloatingLanguageToggle from './components/common/FloatingLanguageToggle';


function App() {
    return (
        <Router>
            <AuthProvider>
                <LimitProvider>
                    <RouterSetup />
                    <FloatingLanguageToggle />
                    <ToastContainer position="top-center" autoClose={3000} />
                </LimitProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
