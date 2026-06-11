import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiBookOpen, FiMessageSquare, FiLogOut, FiMenu, FiX, FiUser } from "react-icons/fi";
import { toast } from "react-toastify";

const NavbarLayout = ({ children }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch current user from local storage
  const currentUser = JSON.parse(localStorage.getItem("user")) || { name: "Guest User" };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.info("Logged out successfully");
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-main)", display: "flex", flexDirection: "column" }}>
      {/* Top Navbar */}
      <header style={navbarHeaderStyle}>
        <div style={navbarContainerStyle}>
          {/* Brand Logo */}
          <div style={brandContainerStyle} onClick={() => navigate("/blogs")}>
            <div style={brandLogoIconStyle}>G</div>
            <span style={brandNameStyle}>Glass Hub</span>
          </div>

          {/* Desktop Nav Links */}
          <nav style={desktopNavStyle} className="nav-desktop">
            <NavLink
              to="/blogs"
              style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}
            >
              <FiBookOpen size={16} />
              <span>Blogs </span>
            </NavLink>

            <NavLink
              to="/chat"
              style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}
            >
              <FiMessageSquare size={16} />
              <span> Chat</span>
            </NavLink>
          </nav>

          {/* Desktop User Footer & Logout */}
          <div style={desktopUserAreaStyle} className="user-desktop">
            <div style={userCardStyle}>
              <div style={avatarStyle}>
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <FiUser />}
              </div>
              <span style={userNameStyle}>{currentUser.name}</span>
            </div>
            <button onClick={handleLogout} style={logoutButtonStyle}>
              <FiLogOut size={16} />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button onClick={toggleMobileMenu} style={hamburgerButtonStyle} className="nav-hamburger">
            {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div style={mobileMenuDropdownStyle} className="animate-fade-in">
            <NavLink
              to="/blogs"
              onClick={() => setIsMobileMenuOpen(false)}
              style={({ isActive }) => (isActive ? activeMobileLinkStyle : mobileLinkStyle)}
            >
              <FiBookOpen size={18} />
              <span>Blogs Feed</span>
            </NavLink>

            <NavLink
              to="/chat"
              onClick={() => setIsMobileMenuOpen(false)}
              style={({ isActive }) => (isActive ? activeMobileLinkStyle : mobileLinkStyle)}
            >
              <FiMessageSquare size={18} />
              <span>Chat</span>
            </NavLink>

            <div style={mobileUserDividerStyle} />

            <div style={mobileUserCardStyle}>
              <div style={avatarStyle}>
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <FiUser />}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ ...userNameStyle, fontSize: "14px" }}>{currentUser.name}</span>
                <span style={{ fontSize: "11px", color: "var(--success)" }}>Online</span>
              </div>
            </div>

            <button onClick={handleLogout} style={{ ...logoutButtonStyle, width: "100%", marginTop: "8px" }}>
              <FiLogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main style={mainContentStyle}>
        <div style={contentInnerContainerStyle}>
          {children}
        </div>
      </main>
    </div>
  );
};

/* ================= STYLES ================= */
const navbarHeaderStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: "72px",
  backgroundColor: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderBottom: "1px solid var(--border)",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const navbarContainerStyle = {
  maxWidth: "1280px",
  width: "100%",
  margin: "0 auto",
  padding: "0 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const brandContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  cursor: "pointer",
};

const brandLogoIconStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  background: "linear-gradient(135deg, var(--primary) 0%, #34d399 100%)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  fontSize: "18px",
  boxShadow: "0 4px 10px rgba(99, 102, 241, 0.2)",
};

const brandNameStyle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "var(--text-main)",
  letterSpacing: "-0.5px",
};

const desktopNavStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const linkStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 16px",
  borderRadius: "10px",
  color: "var(--text-muted)",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.2s ease",
};

const activeLinkStyle = {
  ...linkStyle,
  color: "var(--primary)",
  backgroundColor: "var(--primary-light)",
};

const desktopUserAreaStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
};

const userCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const avatarStyle = {
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, var(--primary) 0%, #818cf8 100%)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "700",
  fontSize: "14px",
  boxShadow: "0 2px 6px rgba(99, 102, 241, 0.15)",
};

const userNameStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "var(--text-main)",
};

const logoutButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "8px 14px",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-muted)",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600",
  transition: "all 0.2s ease",
  fontFamily: "inherit",
};

const hamburgerButtonStyle = {
  display: "none", // Managed by responsive CSS queries
  background: "none",
  border: "none",
  color: "var(--text-main)",
  cursor: "pointer",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px",
  borderRadius: "8px",
  backgroundColor: "rgba(0, 0, 0, 0.04)",
};

const mobileMenuDropdownStyle = {
  position: "absolute",
  top: "72px",
  left: 0,
  right: 0,
  backgroundColor: "#ffffff",
  borderBottom: "1px solid var(--border)",
  padding: "16px 24px 24px 24px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
  zIndex: 999,
};

const mobileLinkStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 16px",
  borderRadius: "10px",
  color: "var(--text-muted)",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: "600",
  transition: "all 0.2s ease",
};

const activeMobileLinkStyle = {
  ...mobileLinkStyle,
  color: "var(--primary)",
  backgroundColor: "var(--primary-light)",
};

const mobileUserDividerStyle = {
  height: "1px",
  backgroundColor: "var(--border)",
  margin: "8px 0",
};

const mobileUserCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "6px 8px",
};

const mainContentStyle = {
  flex: 1,
  padding: "104px 24px 40px 24px", // 72px navbar height + 32px padding
  minHeight: "100vh",
  overflowY: "auto",
};

const contentInnerContainerStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  width: "100%",
};

export default NavbarLayout;
