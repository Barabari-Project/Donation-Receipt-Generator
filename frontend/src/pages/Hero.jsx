import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import logo from '../assets/barabari_logo.png'
import Cookies from 'js-cookie';
import { useRef } from 'react';


const Hero = ({ email, setEmail }) => {
  const [loading, setLoading] = useState(false);
  const [logoName, setLogoName] = useState("Barabari Collective");
  const navigate = useNavigate();
  const handleLogout = () => {
    setLoading(true);
    try {
      Cookies.remove('token');
      setEmail(null);
      navigate('/');
      closeMenu();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLoading(false);
    }
  }
  const menuToggleRef = useRef(null);
  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get('token');
      setLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const userEmail = response.data.email;
        setEmail(userEmail);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (email === import.meta.env.VITE_SOS_MAIL) {
      setLogoName("Sos x Barabari Donation Receipt Generator");
    } else if (email === import.meta.env.VITE_RAKSHA_MAIL) {
      setLogoName("Raksha x Barabari Donation Receipt Generator");
    } else {
      setLogoName("Barabari Collective");
    }
  }, [email]);

  const closeMenu = () => {
    if (menuToggleRef.current) {
      menuToggleRef.current.checked = false;
    }
  };


  return (
    <header className="z-50 fixed top-0 w-full bg-white">
      <div className="h-[70px]  flex items-center px-2 md:px-3 lg:px-32 xl:px-48 justify-between">
        <div className="flex gap-2 items-center">
          <a href="#">
            <img
              src={logo}
              className="drop-shadow-lg w-[40px] h-[40px] cursor-pointer"
              alt="Barabari Logo"
            />
          </a>
          <span className="font-bold hidden sm:block text-2xl drop-shadow-lg tracking-wider text-black">
            {logoName}
          </span>
        </div>
        <div className="hidden md:flex gap-2">
          <a href="https://forms.gle/WcF55jH3LvK93GTs9" target="_blank">
            <button className="bg-[#324498] hover:bg-[#ffcc33] text-[#ffcc33] hover:text-[#324498] px-3 py-1 font-semibold focus:outline-none  transition-colors duration-300">
              Donate
            </button>
          </a>
          <a href="https://www.barabaricollective.org/services.html" target="_blank">
            <button className="bg-[#324498] hover:bg-[#ffcc33] text-[#ffcc33] hover:text-[#324498] px-3 py-1 w-[120px] font-semibold focus:outline-none  transition-colors duration-300">
              Hire From Us
            </button>
          </a>
          {email && (
            <a href={import.meta.env.VITE_BACKEND_BASE_URL + '/logout'}>
              <button className="bg-[#324498] hover:bg-[#ffcc33] text-[#ffcc33] hover:text-[#324498] px-3 py-1 font-semibold focus:outline-none  transition-colors duration-300">
                Logout
              </button>
            </a>
          )}
        </div>
        <div id="hamburger" className="block md:hidden animate__zoomInDown">
          <input id="menu-toggle" className="hidden peer" type="checkbox"  ref={menuToggleRef} />
          <label htmlFor="menu-toggle">
            <div className="w-12 h-12 cursor-pointer flex flex-col items-center justify-center">
              <div className="w-[50%] h-[3px] bg-black rounded-sm transition-all duration-300 origin-left translate-y-[0.6rem] peer-checked:rotate-[-45deg]"></div>
              <div className="w-[50%] h-[3px] bg-black rounded-md transition-all duration-300 origin-center peer-checked:hidden"></div>
              <div className="w-[50%] h-[3px] bg-black rounded-md transition-all duration-300 origin-left -translate-y-[0.6rem] peer-checked:rotate-[45deg]"></div>
            </div>
          </label>

          <div className="fixed top-[70px] right-0 w-64 h-auto bg-white shadow-lg transform translate-x-full peer-checked:translate-x-[-10px] peer-checked:top-[80px] peer-checked:right-[0px] transition-transform duration-400 ease-in-out rounded-lg z-50">
            <div className="flex flex-col items-center justify-around h-full py-6 space-y-6">
              <a
                href="https://forms.gle/WcF55jH3LvK93GTs9"
                target="_blank"
                className="flex items-center justify-center bg-[#324498] hover:bg-[#324498] text-white font-semibold py-1 px-4 rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105"
                rel="noopener noreferrer"
                onClick={closeMenu} 
              >
                <span className="material-icons mr-2">volunteer_activism</span>
                Donate
              </a>
              <a
                href="services.html"
                target="_blank"
                className="flex items-center justify-center bg-[#f39c12] hover:bg-[#e67e22] text-white font-semibold py-1 px-4 rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105"
                rel="noopener noreferrer"
                onClick={closeMenu} 
              >
                <span className="material-icons mr-2">work</span>
                Hire From Us
              </a>
              {email && (
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center bg-[#e74c3c] hover:bg-[#c0392b] text-white font-semibold py-1 px-4 rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105"
                >
                  <span className="material-icons mr-2">logout</span>
                  Logout
                </button>
              )}
            </div>
          </div>



        </div>

      </div>
    </header>
  )
}

export default Hero