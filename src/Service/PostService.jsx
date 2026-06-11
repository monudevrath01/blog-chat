import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4300/api/posts",
});

export const createPost = (data) => API.post("/", data);

export const getPosts = () => API.get("/");

export const deletePost = (id) => API.delete(`/${id}`);

export const likePost = (id, userId) =>
  API.post(`/like/${id}`, { userId });

export const savePost = (id, userId) =>
  API.post(`/save/${id}`, { userId });


export const addComment = (id, text) =>
  API.post(`/comment/${id}`, { text });