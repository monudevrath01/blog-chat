import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4300/api/auth",
});

// Signup
export const signupUser = async (userData) => {
  return await API.post("/signup", userData);
};

// Login
export const loginUser = async (userData) => {
  return await API.post("/login", userData);
};

// Get All Users
export const getAllUsers = async () => {
  return await API.get("/users");
};