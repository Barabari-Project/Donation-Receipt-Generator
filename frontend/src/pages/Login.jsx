import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false); // State for loading

    // Handle Google login redirect
    const handleLogin = () => {
        setLoading(true); // Set loading state
        window.location.href = `${import.meta.env.VITE_BACKEND_BASE_URL}/auth/google`;
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
            {/* Futuristic Animated Background */}
            <div className="absolute inset-0 z-0">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-yellow-500 opacity-90 animate-background" />
                
                {/* Angular Polygon Pattern */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 320">
                    <polygon fill="rgba(255, 255, 255, 0.05)" points="0,320 1440,320 1440,0 0,0" />
                    <polygon fill="rgba(255, 255, 255, 0.1)" points="200,320 1240,160 1440,0 0,160" />
                </svg>
                
                {/* Animated Waves */}
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-blue-600 to-transparent opacity-70 animate-wave" />
            </div>

            {/* Login Form */}
            <div className="relative z-10 p-10 bg-gray-800 rounded-3xl shadow-2xl border border-blue-500 backdrop-blur-md max-w-md w-full">
                <h1 className="text-4xl font-bold text-white mb-4 text-center">Receipts Fast, Impact Faster!</h1>
                <p className="text-gray-300 mb-6 text-center">Log in to explore endless possibilities.</p>
                <button
                    onClick={handleLogin}
                    disabled={loading} // Disable button when loading
                    className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Loading...' : 'Login with Google'}
                </button>
            </div>
        </div>
    );
};

export default Login;
