import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { BsBookmarkFill, BsBookmark } from "react-icons/bs";
import { FiArrowLeft, FiClock, FiUser, FiMessageSquare } from "react-icons/fi";

import {
  likePost,
  savePost,
  addComment,
} from "../Service/PostService";

const PostDetail = () => {
  const { id } = useParams();

  const [post, setPost] = useState(null);
  const [comment, setComment] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const userId = currentUser._id || currentUser.id || "123";

  /* ================= FETCH ================= */
  const fetchPost = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:4300/api/posts");

      const found = res.data.find((p) => p._id === id);
      setPost(found || null);
    } catch (err) {
      console.log(err);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  /* ================= LIKE ================= */
  const handleLike = async () => {
    const res = await likePost(id, userId);
    setPost(res.data);
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    const res = await savePost(id, userId);
    setPost(res.data);
  };

  /* ================= COMMENT ================= */
  const handleComment = async () => {
    if (!comment.trim()) return;

    const res = await addComment(id, comment);
    setPost(res.data);
    setComment("");
  };

  if (!post) return <p>Loading...</p>;

  /* ================= STATES ================= */
  const isLiked = post?.likes?.includes(userId);
  const isSaved = post?.savedBy?.includes(userId);

  return (
    <div style={containerStyle} className="animate-fade-in">
      {/* Back Button */}
      <Link to="/blogs" style={backLinkStyle}>
        <FiArrowLeft size={16} />
        <span>Back to Feed</span>
      </Link>

      <article style={articleCardStyle}>
        {post.image && (
          <div style={postImageContainerStyle}>
            <img
              src={`${post.image}`}
              alt="post"
              style={postImageStyle}
            />
          </div>
        )}

        <div style={articleContentWrapperStyle}>
          <h1 style={articleTitleStyle}>{post.title}</h1>

          {/* Meta */}
          <div style={metaContainerStyle}>
            <div style={avatarStyle}>
              {post.author ? post.author.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div style={authorNameStyle}>{post.author || "User"}</div>
              <div style={readTimeStyle}>
                <FiClock size={12} />
                <span>5 min read • Published recently</span>
              </div>
            </div>
          </div>

          <div 
            style={articleBodyStyle}
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />

          <div style={actionRowStyle}>
            {/* ❤️ LIKE BUTTON */}
            <button
              onClick={handleLike}
              style={{
                ...actionButtonStyle,
                color: isLiked ? "var(--danger)" : "var(--text-muted)",
                backgroundColor: isLiked ? "rgba(239, 68, 68, 0.08)" : "transparent",
                borderColor: isLiked ? "rgba(239, 68, 68, 0.2)" : "var(--border)",
              }}
            >
              {isLiked ? (
                <AiFillHeart size={20} />
              ) : (
                <AiOutlineHeart size={20} />
              )}
              <span style={{ fontWeight: "600" }}>{post.likes?.length || 0} Likes</span>
            </button>

            {/* 🔖 SAVE BUTTON */}
            <button
              onClick={handleSave}
              style={{
                ...actionButtonStyle,
                color: isSaved ? "var(--success)" : "var(--text-muted)",
                backgroundColor: isSaved ? "rgba(16, 185, 129, 0.08)" : "transparent",
                borderColor: isSaved ? "rgba(16, 185, 129, 0.2)" : "var(--border)",
              }}
            >
              {isSaved ? (
                <BsBookmarkFill size={18} />
              ) : (
                <BsBookmark size={18} />
              )}
              <span style={{ fontWeight: "600" }}>{isSaved ? "Saved" : "Save Article"}</span>
            </button>
          </div>
        </div>
      </article>

      {/* COMMENTS SECTION */}
      <section style={commentsSectionStyle}>
        <h3 style={commentsTitleStyle}>
          <FiMessageSquare size={18} />
          <span>Comments ({post.comments?.length || 0})</span>
        </h3>

        <div style={commentInputContainerStyle}>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a thoughtful comment..."
            className="premium-input"
            style={{ flex: 1 }}
          />

          <button onClick={handleComment} className="premium-btn" style={{ width: "auto", padding: "0 24px", height: "48px" }}>
            Post Comment
          </button>
        </div>

        <div style={commentsListStyle}>
          {post.comments?.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px" }}>
              No comments yet. Start the conversation!
            </p>
          ) : (
            post.comments?.map((c, i) => (
              <div key={i} style={commentCardStyle}>
                <div style={commentAvatarStyle}>
                  {c.author ? c.author.charAt(0).toUpperCase() : <FiUser />}
                </div>
                <div style={commentContentStyle}>
                  <div style={commentHeaderStyle}>
                    <span style={commentAuthorNameStyle}>{c.author || "User"}</span>
                    <span style={commentTimeStyle}>Just now</span>
                  </div>
                  <p style={commentTextStyle}>{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

/* ================= STYLES ================= */
const containerStyle = {
  maxWidth: "800px",
  margin: "0 auto",
  paddingBottom: "60px",
};

const backLinkStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "var(--text-muted)",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "600",
  marginBottom: "24px",
  width: "fit-content",
  transition: "color 0.2s ease",
};

const articleCardStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "20px",
  overflow: "hidden",
  boxShadow: "var(--shadow-xl)",
  marginBottom: "32px",
};

const postImageContainerStyle = {
  width: "100%",
  maxHeight: "400px",
  overflow: "hidden",
  borderBottom: "1px solid var(--border)",
};

const postImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const articleContentWrapperStyle = {
  padding: "40px",
};

const articleTitleStyle = {
  fontSize: "36px",
  fontWeight: "800",
  color: "var(--text-main)",
  lineHeight: "1.3",
  marginBottom: "24px",
  letterSpacing: "-0.5px",
};

const metaContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  paddingBottom: "24px",
  borderBottom: "1px solid var(--border)",
  marginBottom: "24px",
};

const avatarStyle = {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, var(--primary) 0%, #34d399 100%)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "700",
  fontSize: "18px",
};

const authorNameStyle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "var(--text-main)",
};

const readTimeStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  color: "var(--text-muted)",
  fontSize: "12px",
  marginTop: "4px",
};

const articleBodyStyle = {
  fontSize: "16px",
  lineHeight: "1.8",
  color: "var(--text-main)",
  marginBottom: "32px",
};

const actionRowStyle = {
  display: "flex",
  gap: "16px",
  borderTop: "1px solid var(--border)",
  paddingTop: "24px",
};

const actionButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 20px",
  borderRadius: "12px",
  border: "1px solid var(--border)",
  cursor: "pointer",
  fontSize: "14px",
  transition: "all 0.2s ease",
  fontFamily: "inherit",
};

const commentsSectionStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "20px",
  padding: "32px",
  boxShadow: "var(--shadow-lg)",
};

const commentsTitleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "18px",
  fontWeight: "700",
  color: "var(--text-main)",
  marginBottom: "24px",
};

const commentInputContainerStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "32px",
};

const commentsListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const commentCardStyle = {
  display: "flex",
  gap: "12px",
  paddingBottom: "16px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
};

const commentAvatarStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #818cf8 0%, #34d399 100%)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "600",
  fontSize: "12px",
};

const commentContentStyle = {
  flex: 1,
};

const commentHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "4px",
};

const commentAuthorNameStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "var(--text-main)",
};

const commentTimeStyle = {
  fontSize: "11px",
  color: "var(--text-muted)",
};

const commentTextStyle = {
  fontSize: "14px",
  color: "var(--text-muted)",
  lineHeight: "1.5",
};

export default PostDetail;