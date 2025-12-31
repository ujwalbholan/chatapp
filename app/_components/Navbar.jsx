import "../_style/navbar.css";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">ChatOooo</div>
      <Link href="/chat">
        <button className="navbar-btn">Chat Now</button>
      </Link>
    </nav>
  );
};

export default Navbar;
