import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ email, redirect = '/', children }) => {
    const navigate = useNavigate();
    useEffect(() => {
        if (!email) {
            navigate(redirect);
        }
    }, [email]);
    return (
        <>{children}</>
    )
}

export default ProtectedRoute