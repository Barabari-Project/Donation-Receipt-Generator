import { useEffect, useState } from 'react';
import './App.css'
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import Home from './pages/Home';

import axios from 'axios';
import Hero from './pages/Hero';
import Footer from './pages/Footer';
import Login from './pages/Login';

function App() {
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(false);

  const Layout = () => (
    <>
      <Hero />
      <main>
        <Outlet /> {/* Outlet will render the appropriate route content */}
      </main>
      <Footer />
    </>
  );

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/user`, {
          withCredentials: true,
        });
        setEmail(response.data.emails[0].verified ? response.data.emails[0].value : null);
      } catch (error) {
        setEmail(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
