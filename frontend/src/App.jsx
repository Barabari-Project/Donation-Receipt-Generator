import { useEffect } from 'react';
import './App.css'
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import Home from './pages/Home';

import axios from 'axios';
import Hero from './pages/Hero';
import Footer from './pages/Footer';
import Login from './pages/Login';
import Cookies from 'js-cookie';

function App() {
  console.log(Cookies.get('connect.sid'))
  const str = `connect.sid=${Cookies.get('connect.sid')}`
  useEffect(() => {
    const awakeServer = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/health`, {
          withCredentials: true,
          headers: {
            Cookie: str,
          },
        });
      } catch (error) {
      }
    };
    awakeServer();
  }, []);

  const Layout = () => (
    <>
      <Hero />
      <main>
        <Outlet /> {/* Outlet will render the appropriate route content */}
      </main>
      <Footer />
    </>
  );
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
