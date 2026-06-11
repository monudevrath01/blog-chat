import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";
import { FiTrash2, FiImage, FiPlus, FiClock, FiChevronRight } from "react-icons/fi";

import {
  createPost,
  getPosts,
  deletePost,
} from "../Service/PostService";

const BlogPage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [posts, setPosts] = useState([]);

  const { quill, quillRef } = useQuill();

  /* ================= QUILL SYNC ================= */
  useEffect(() => {
    if (!quill) return;

    const handler = () => {
      setContent(quill.root.innerHTML);
    };

    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [quill]);

  /* ================= FETCH POSTS ================= */
  const fetchPosts = useCallback(async () => {
    try {
      const res = await getPosts();
      setPosts(res.data || []);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  /* ================= CREATE POST ================= */
  const handleSubmit = async () => {
    try {
      if (!title.trim()) return alert("Title required");

      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (image) formData.append("image", image);

      const res = await createPost(formData);

      setPosts((prev) => [res.data, ...prev]);

      // reset form
      setTitle("");
      setContent("");
      setImage(null);

      if (quill) quill.root.innerHTML = "";
    } catch (error) {
      console.log(error);
    }
  };

  /* ================= DELETE POST ================= */
  const handleDelete = async (id) => {
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", paddingBottom: "40px" }} className="animate-fade-in">
      {/* Header */}
      <div style={headerSectionStyle}>
        <div>
          <h1 style={titleStyle}>Community Feed</h1>
          <p style={subtitleStyle}>Share your thoughts, articles, and connect with other developers.</p>
        </div>
      </div>

      <div style={contentGridStyle}>
        {/* CREATE POST COLUMN */}
        <div style={editorColumnStyle}>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Create New Post</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Post Title</label>
                <input
                  placeholder="Give your article a catchy title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="premium-input"
                />
              </div>

              <div>
                <label style={labelStyle}>Article Body</label>
                <div style={{ marginBottom: 10 }}>
                  <div ref={quillRef} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Cover Image</label>
                <div style={uploadContainerStyle}>
                  <label style={uploadLabelStyle}>
                    <FiImage size={20} style={{ color: "var(--primary)" }} />
                    <span>{image ? image.name : "Choose an image file..."}</span>
                    <input
                      type="file"
                      onChange={(e) => setImage(e.target.files[0])}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>

              <button onClick={handleSubmit} className="premium-btn" style={{ marginTop: "10px" }}>
                <FiPlus size={20} />
                <span>Publish Post</span>
              </button>
            </div>
          </div>
        </div>

        {/* FEED COLUMN */}
        <div style={feedColumnStyle}>
          <h2 style={cardTitleStyle}>Recent Publications</h2>

          {posts.length === 0 ? (
            <div style={emptyStateStyle}>
              <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>No posts published yet. Be the first!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {posts.map((post) => (
                <div key={post._id} style={postCardStyle}>
                  {post.image && (
                    <div style={postImageWrapperStyle}>
                      <img
                        src={`${post.image}`}
                        alt="post"
                        style={postImageStyle}
                      />
                    </div>
                  )}

                  <div style={postContentWrapperStyle}>
                    <div style={postMetaStyle}>
                      <div style={postAvatarStyle}>
                        {post.author ? post.author.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <span style={postAuthorNameStyle}>{post.author || "User"}</span>
                        <div style={postTimeStyle}>
                          <FiClock size={12} />
                          <span>5 min read</span>
                        </div>
                      </div>
                    </div>

                    <Link to={`/post/${post._id}`} style={postTitleLinkStyle}>
                      <h3>{post.title}</h3>
                    </Link>

                    <div 
                      style={postSnippetStyle} 
                      dangerouslySetInnerHTML={{ __html: post.content }} 
                    />

                    <div style={postFooterStyle}>
                      <Link to={`/post/${post._id}`} style={readMoreButtonStyle}>
                        <span>Read More</span>
                        <FiChevronRight size={16} />
                      </Link>

                      <button onClick={() => handleDelete(post._id)} style={deleteButtonStyle}>
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================= STYLES ================= */
const headerSectionStyle = {
  borderBottom: "1px solid var(--border)",
  paddingBottom: "24px",
};

const titleStyle = {
  fontSize: "32px",
  fontWeight: "800",
  letterSpacing: "-0.5px",
  color: "var(--text-main)",
  marginBottom: "8px",
};

const subtitleStyle = {
  color: "var(--text-muted)",
  fontSize: "16px",
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "32px",
  alignItems: "start",
};

const editorColumnStyle = {
  position: "sticky",
  top: "40px",
};

const feedColumnStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const cardStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "28px",
  boxShadow: "var(--shadow-lg)",
};

const cardTitleStyle = {
  fontSize: "20px",
  fontWeight: "700",
  color: "var(--text-main)",
  marginBottom: "24px",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "var(--text-muted)",
  marginBottom: "8px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const uploadContainerStyle = {
  border: "2px dashed var(--border)",
  borderRadius: "12px",
  padding: "16px",
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const uploadLabelStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  cursor: "pointer",
  color: "var(--text-muted)",
  fontSize: "14px",
  width: "100%",
};

const emptyStateStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px dashed var(--border)",
  borderRadius: "16px",
  padding: "48px",
  textAlign: "center",
};

const postCardStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  boxShadow: "var(--shadow-md)",
  transition: "all 0.3s ease",
};

const postImageWrapperStyle = {
  width: "100%",
  height: "200px",
  overflow: "hidden",
  borderBottom: "1px solid var(--border)",
};

const postImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const postContentWrapperStyle = {
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const postMetaStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const postAvatarStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, var(--primary) 0%, #34d399 100%)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "600",
  fontSize: "14px",
};

const postAuthorNameStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "var(--text-main)",
};

const postTimeStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  color: "var(--text-muted)",
  fontSize: "11px",
  marginTop: "2px",
};

const postTitleLinkStyle = {
  textDecoration: "none",
  color: "var(--text-main)",
  fontSize: "18px",
  fontWeight: "700",
  lineHeight: "1.4",
  transition: "color 0.2s ease",
};

const postSnippetStyle = {
  color: "var(--text-muted)",
  fontSize: "14px",
  lineHeight: "1.6",
  maxHeight: "80px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
};

const postFooterStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderTop: "1px solid var(--border)",
  paddingTop: "16px",
  marginTop: "8px",
};

const readMoreButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  color: "var(--primary)",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  transition: "color 0.2s ease",
};

const deleteButtonStyle = {
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  padding: "8px",
  borderRadius: "8px",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default BlogPage;