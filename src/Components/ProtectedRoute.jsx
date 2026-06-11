import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import NavbarLayout from "./NavbarLayout";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <NavbarLayout>
      <Outlet />
    </NavbarLayout>
  );
};

export default ProtectedRoute;
