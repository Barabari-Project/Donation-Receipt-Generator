import { useEffect, useState } from 'react';
import './App.css';
import ProtectedRoute from './components/ProtectedRoute';
import { createBrowserRouter, Outlet, RouterProvider, useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import Home from './pages/Home';

import axios from 'axios';
import PublicRoute from './components/PublicRoute';
import Hero from './pages/Hero';
import Footer from './pages/Footer';
import Login from './pages/Login';

function App() {
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);  // Set loading initially to true
  const navigate = useNavigate();  // React Router's useNavigate hook for navigation

  const Layout = () => (
    <>
      <Hero setEmail={setEmail} email={email} />
      <main>
        <Outlet /> {/* Outlet will render the appropriate route content */}
      </main>
      <Footer />
    </>
  );

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />, // Layout for the main structure
      children: [
        {
          path: "/",
          element: (
            <PublicRoute email={email}>
              <Login />
            </PublicRoute>
          ),
        },
        {
          path: "/home",
          element: (
            <ProtectedRoute email={email}>
              <Home email={email} setEmail={setEmail} />
            </ProtectedRoute>
          ),
        },
        // Add other routes if needed
      ],
    },
  ]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/user`, {
          withCredentials: true,  // Include credentials in the request
        });

        if (response.data.error) {
          // Redirect to login if authentication failed
          navigate('/login');
        } else {
          // If authenticated, set email to the verified email
          setEmail(response.data.emails[0].verified ? response.data.emails[0].value : null);
          navigate('/home'); // Redirect to home page if authenticated
        }
      } catch (error) {
        setEmail(null);
        navigate('/login'); // Redirect to login on error
      } finally {
        setLoading(false); // Stop loading once the request is complete
      }
    };

    fetchUser(); // Call the function when the component mounts
  }, [navigate]);  // Include navigate in the dependency array

  if (loading) {
    return <div>Loading...</div>; // Optionally display a loading message while checking auth
  }

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
