import { useEffect, useState } from 'react';
import './App.css'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from './pages/Home';

import axios from 'axios';
import Hero from './pages/Hero';
import Footer from './pages/Footer';
import Login from './pages/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [email, setEmail] = useState(null);
  useEffect(() => {
    const awakeServer = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/health`);
      } catch (error) {
      }
    };
    awakeServer();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout email={email} setEmail={setEmail} />}>
          <Route path="/" element={
            <ProtectedRoute email={!email} redirect='/home'>
              <Login email={email} setEmail={setEmail} />
            </ProtectedRoute>}
          />
          <Route path="/home" element={
            <ProtectedRoute email={email} redirect='/'>
              <Home email={email} setEmail={setEmail} />
            </ProtectedRoute>}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
