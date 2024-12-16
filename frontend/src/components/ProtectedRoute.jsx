import { useEffect } from "react";
import {  useNavigate } from "react-router-dom";

const ProtectedRoute = ({ email, children }) => {
    console.log(email);
    const navigate = useNavigate();
    useEffect(() => {
        if (!email) {
            navigate('/');
        }
    }, [email])

    return <>{children}</>;
};

export default ProtectedRoute;