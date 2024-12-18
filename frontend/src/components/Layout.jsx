import { Outlet } from "react-router-dom";
import Hero from "../pages/Hero";
import Footer from "../pages/Footer";

const Layout = ({ email, setEmail }) => (
    <>
        <Hero email={email} setEmail={setEmail} />
        <main>
            <Outlet /> {/* Outlet will render the appropriate route content */}
        </main>
        <Footer />
    </>
);

export default Layout;