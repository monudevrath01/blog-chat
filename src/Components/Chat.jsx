import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { getAllUsers } from "../Service/AuthService";
import { FiSend, FiUsers, FiMessageSquare, FiCircle, FiPlus, FiHash, FiSettings, FiTrash2, FiMoreVertical, FiEdit2 } from "react-icons/fi";
import { toast } from "react-toastify";


const socket = io("http://localhost:4300");

function Chat() {
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const currentUserId = currentUser._id || currentUser.id || "current_user";
  const isAdmin = currentUser.email?.toLowerCase() === "admin@gmail.com" || currentUser.role === "admin";

  const [msg, setMsg] = useState("");
  const [users, setUsers] = useState([]);

  // Message edit and action dropdown states
  const [activeMenuMessageId, setActiveMenuMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMsgText, setEditMsgText] = useState("");


  // Load groups list scoped by logged-in user session
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem(`groups_${currentUserId}`);
    return saved ? JSON.parse(saved) : [{ id: "global", name: "Global Chat", creatorId: "admin", members: [] }];
  });

  // Load chat history scoped by logged-in user session
  const [chat, setChat] = useState(() => {
    const saved = localStorage.getItem(`chat_history_${currentUserId}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Active chat state (defaults to global group)
  const [activeChat, setActiveChat] = useState({ id: "global", name: "Global Chat", type: "group" });

  // Modal triggers for group creation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Modal triggers for managing members
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  // Custom popup trigger for delete confirmations
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: "", id: "", name: "" });

  // Retrieve signed-up users list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getAllUsers();
        setUsers(res.data || []);
      } catch (error) {
        console.log(error);
      }
    };
    fetchUsers();
  }, []);

  // Click-away listener to close message action dropdowns
  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveMenuMessageId(null);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);


  // Listen to socket broadcasts for messages and group updates
  useEffect(() => {
    socket.on("receive_message", (data) => {
      // Sync group creation events
      if (data.action === "create_group") {
        setGroups((prev) => {
          if (prev.some((g) => g.id === data.group.id)) return prev;
          const newGroups = [...prev, data.group];
          localStorage.setItem(`groups_${currentUserId}`, JSON.stringify(newGroups));
          return newGroups;
        });
        return;
      }

      // Sync message deletion events
      if (data.action === "delete_message") {
        setChat((prev) => {
          const updated = prev.filter((m) => m.messageId !== data.messageId);
          localStorage.setItem(`chat_history_${currentUserId}`, JSON.stringify(updated));
          return updated;
        });
        return;
      }

      // Sync message editing events
      if (data.action === "edit_message") {
        setChat((prev) => {
          const updated = prev.map((m) =>
            m.messageId === data.messageId ? { ...m, text: data.text, isEdited: true } : m
          );
          localStorage.setItem(`chat_history_${currentUserId}`, JSON.stringify(updated));
          return updated;
        });
        return;
      }


      // Sync group deletion events
      if (data.action === "delete_group") {
        setGroups((prev) => {
          const newGroups = prev.filter((g) => g.id !== data.groupId);
          localStorage.setItem(`groups_${currentUserId}`, JSON.stringify(newGroups));
          return newGroups;
        });
        setActiveChat((prev) => {
          if (prev.id === data.groupId) {
            toast.warn(`Group "${prev.name}" was deleted by its creator.`);
            return { id: "global", name: "Global Chat", type: "group" };
          }
          return prev;
        });
        return;
      }

      // Sync group member updates
      if (data.action === "update_group_members") {
        setGroups((prev) => {
          const newGroups = prev.map((g) => {
            if (g.id === data.groupId) {
              return { ...g, members: data.members };
            }
            return g;
          });
          localStorage.setItem(`groups_${currentUserId}`, JSON.stringify(newGroups));
          return newGroups;
        });

        // Check if user was removed from active chat
        if (activeChat.id === data.groupId && !data.members.includes(currentUserId) && data.groupId !== "global") {
          setActiveChat({ id: "global", name: "Global Chat", type: "group" });
          toast.warn(`You were removed from group "${activeChat.name}"`);
        }
        return;
      }

      // Direct message privacy filter
      const isPrivate = data.type === "private";
      const isMeSender = data.senderId === currentUserId || data.sender === currentUser.name;
      const isMeRecipient = data.targetId === currentUserId;

      if (!isPrivate || isMeSender || isMeRecipient) {
        setChat((prev) => {
          // Prevent duplicate message rendering
          if (data.messageId && prev.some((m) => m.messageId === data.messageId)) {
            return prev;
          }
          const updated = [...prev, {
            ...data,
            self: isMeSender,
          }];
          localStorage.setItem(`chat_history_${currentUserId}`, JSON.stringify(updated));
          return updated;
        });
      }

    });

    return () => socket.off("receive_message");
  }, [currentUserId, currentUser.name, activeChat, groups]);

  // Dispatch standard text message
  const sendMessage = () => {
    if (!msg.trim()) return;

    const messageData = {
      messageId: "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: currentUser.name,
      senderId: currentUserId,
      type: activeChat.type,
      targetId: activeChat.id,
    };

    socket.emit("send_message", messageData);

    setMsg("");
  };


  // Trigger delete message confirmation popup
  const triggerDeleteMessage = (messageId) => {
    setDeleteConfirm({ isOpen: true, type: "message", id: messageId, name: "" });
  };

  // Perform actual message deletion
  const executeDeleteMessage = (messageId) => {
    setChat((prev) => {
      const updated = prev.filter((m) => m.messageId !== messageId);
      localStorage.setItem(`chat_history_${currentUserId}`, JSON.stringify(updated));
      return updated;
    });

    socket.emit("send_message", {
      action: "delete_message",
      messageId: messageId,
      sender: currentUser.name,
      senderId: currentUserId,
    });

    setDeleteConfirm({ isOpen: false, type: "", id: "", name: "" });
  };

  // Trigger inline message edit mode
  const startEditMessage = (messageId, currentText) => {
    setEditingMessageId(messageId);
    setEditMsgText(currentText);
    setActiveMenuMessageId(null);
  };

  // Perform actual message editing
  const handleEditMessage = (messageId) => {
    if (!editMsgText.trim()) return;

    setChat((prev) => {
      const updated = prev.map((m) =>
        m.messageId === messageId ? { ...m, text: editMsgText.trim(), isEdited: true } : m
      );
      localStorage.setItem(`chat_history_${currentUserId}`, JSON.stringify(updated));
      return updated;
    });

    socket.emit("send_message", {
      action: "edit_message",
      messageId: messageId,
      text: editMsgText.trim(),
      sender: currentUser.name,
      senderId: currentUserId,
    });

    setEditingMessageId(null);
    setEditMsgText("");
  };


  // Dispatch group creation event (Any user can create)
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup = {
      id: "group_" + Date.now(),
      name: newGroupName.trim(),
      createdBy: currentUser.name,
      creatorId: currentUserId,
      members: [currentUserId], // Starts with creator
    };

    setGroups((prev) => {
      const newGroups = [...prev, newGroup];
      localStorage.setItem(`groups_${currentUserId}`, JSON.stringify(newGroups));
      return newGroups;
    });

    socket.emit("send_message", {
      action: "create_group",
      group: newGroup,
      sender: currentUser.name,
      senderId: currentUserId,
    });

    setActiveChat({ id: newGroup.id, name: newGroup.name, type: "group" });
    setNewGroupName("");
    setIsModalOpen(false);
    toast.success(`Group "${newGroup.name}" created!`);
  };

  // Trigger delete group confirmation popup
  const triggerDeleteGroup = (groupId, groupName) => {
    setDeleteConfirm({ isOpen: true, type: "group", id: groupId, name: groupName });
  };

  // Perform actual group deletion
  const executeDeleteGroup = (groupId, groupName) => {
    setGroups((prev) => {
      const newGroups = prev.filter((g) => g.id !== groupId);
      localStorage.setItem(`groups_${currentUserId}`, JSON.stringify(newGroups));
      return newGroups;
    });

    socket.emit("send_message", {
      action: "delete_group",
      groupId: groupId,
      sender: currentUser.name,
      senderId: currentUserId,
    });

    setActiveChat({ id: "global", name: "Global Chat", type: "group" });
    setDeleteConfirm({ isOpen: false, type: "", id: "", name: "" });
    toast.success(`Group "${groupName}" deleted.`);
  };

  // Open manage members dialog
  const openManageMembers = () => {
    const group = groups.find((g) => g.id === activeChat.id);
    if (group) {
      setSelectedMemberIds(group.members || [currentUserId]);
      setIsManageMembersOpen(true);
    }
  };

  // Toggle user membership selections in modal
  const handleToggleMember = (userId) => {
    setSelectedMemberIds((prev) => {
      // Don't allow removing the creator
      const group = groups.find((g) => g.id === activeChat.id);
      if (group && group.creatorId === userId) {
        toast.info("The group creator cannot be removed.");
        return prev;
      }
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Save updated group members
  const handleSaveMembers = () => {
    const updatedGroups = groups.map((g) => {
      if (g.id === activeChat.id) {
        const updated = { ...g, members: selectedMemberIds };
        
        socket.emit("send_message", {
          action: "update_group_members",
          groupId: g.id,
          members: selectedMemberIds,
          sender: currentUser.name,
          senderId: currentUserId,
        });

        return updated;
      }
      return g;
    });

    setGroups(updatedGroups);
    localStorage.setItem(`groups_${currentUserId}`, JSON.stringify(updatedGroups));
    setIsManageMembersOpen(false);
    toast.success("Group members updated successfully!");
  };

  // Helper to get group member count
  const getMemberCount = (group) => {
    if (group.id === "global") return users.length + 1;
    return group.members?.length || 1;
  };

  // Filter messages relative to selected context
  const filteredMessages = chat.filter((m) => {
    const msgType = m.type || "group";
    const msgTargetId = m.targetId || "global";

    if (activeChat.type === "group") {
      return msgType === "group" && msgTargetId === activeChat.id;
    } else if (activeChat.type === "private") {
      const isMeSender = m.senderId === currentUserId;
      const isMeRecipient = m.targetId === currentUserId;
      const isOtherSender = m.senderId === activeChat.id;
      const isOtherRecipient = m.targetId === activeChat.id;

      return (
        msgType === "private" &&
        ((isMeSender && isOtherRecipient) || (isOtherSender && isMeRecipient))
      );
    }
    return false;
  });

  // Filter groups visible to the logged-in user
  const visibleGroups = groups.filter((g) => {
    if (g.id === "global") return true;
    return g.creatorId === currentUserId || g.members?.includes(currentUserId);
  });

  const activeGroup = groups.find((g) => g.id === activeChat.id) || {};
  const isCreatorOfActiveGroup = activeGroup.creatorId === currentUserId || isAdmin;

  return (
    <div style={chatContainerStyle} className="animate-fade-in">
      {/* SIDEBAR FOR CHANNELS & DIRECT MESSAGES */}
      <div style={usersSidebarStyle}>
        {/* Groups & Channels */}
        <div style={sectionContainerStyle}>
          <div style={sidebarHeaderStyle}>
            <FiHash size={18} style={{ color: "var(--primary)" }} />
            <h3 style={sidebarTitleStyle}>Channels</h3>
            <button onClick={() => setIsModalOpen(true)} style={createGroupButtonStyle} title="Create Group">
              <FiPlus size={16} />
            </button>
          </div>
          <div style={listStyle}>
            {visibleGroups.map((group) => {
              const isSelected = activeChat.id === group.id;
              const isCreator = group.creatorId === currentUserId;
              return (
                <div
                  key={group.id}
                  onClick={() => setActiveChat({ id: group.id, name: group.name, type: "group" })}
                  style={{
                    ...itemStyle,
                    backgroundColor: isSelected ? "var(--primary-light)" : "transparent",
                    color: isSelected ? "var(--primary)" : "var(--text-main)",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <FiMessageSquare size={14} />
                      <span style={{ fontWeight: isSelected ? "700" : "500", fontSize: "14px" }}>{group.name}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: isSelected ? "var(--primary)" : "var(--text-muted)", paddingLeft: "24px", opacity: 0.8 }}>
                      {getMemberCount(group)} members
                    </span>
                  </div>

                  {isCreator && group.id !== "global" && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerDeleteGroup(group.id, group.name);
                      }} 
                      style={sidebarDeleteButtonStyle}
                      title="Delete Group"
                    >
                      <FiTrash2 size={13} style={{ color: "var(--danger)" }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Direct Messages */}
        <div style={{ ...sectionContainerStyle, borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "8px" }}>
          <div style={sidebarHeaderStyle}>
            <FiUsers size={18} style={{ color: "var(--primary)" }} />
            <h3 style={sidebarTitleStyle}>Direct Messages</h3>
          </div>
          <div style={listStyle}>
            {users
              .filter((u) => u._id !== currentUserId)
              .map((user) => {
                const isUserAdmin = user.email?.toLowerCase() === "admin@gmail.com" || user.role === "admin";
                const isSelected = activeChat.id === user._id;
                return (
                  <div
                    key={user._id}
                    onClick={() => setActiveChat({ id: user._id, name: user.name, type: "private" })}
                    style={{
                      ...userItemStyle,
                      backgroundColor: isSelected ? "var(--primary-light)" : "transparent",
                    }}
                  >
                    <div style={userAvatarStyle}>
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div style={userInfoStyle}>
                      <span style={{
                        ...userNameStyle,
                        fontWeight: isSelected ? "700" : "500",
                        color: isSelected ? "var(--primary)" : "var(--text-main)",
                        display: "flex",
                        alignItems: "center",
                      }}>
                        {user.name}
                        {isUserAdmin && <span style={adminBadgeStyle}>Admin</span>}
                      </span>
                      <div style={userStatusContainerStyle}>
                        <FiCircle size={8} fill="var(--success)" color="var(--success)" />
                        <span style={userStatusTextStyle}>Online</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* CHAT VIEW CANVAS */}
      <div style={chatAreaStyle}>
        {/* HEADER */}
        <div style={{ ...chatHeaderStyle, justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {activeChat.type === "group" ? <FiHash size={20} style={{ color: "var(--primary)" }} /> : <FiUsers size={20} style={{ color: "var(--primary)" }} />}
              <span style={chatHeaderTitleStyle}>{activeChat.name}</span>
              {activeChat.type === "private" && <span style={adminBadgeStyle}>Direct Message</span>}
            </div>
            {activeChat.type === "group" && (
              <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", paddingLeft: "28px" }}>
                {getMemberCount(activeChat)} members
              </span>
            )}
          </div>

          {/* Group Admin management tools */}
          {activeChat.type === "group" && activeChat.id !== "global" && isCreatorOfActiveGroup && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={openManageMembers} style={headerActionButtonStyle} title="Manage Members">
                <FiSettings size={16} />
                <span className="btn-label-desktop">Manage Members</span>
              </button>
              <button onClick={() => triggerDeleteGroup(activeChat.id, activeChat.name)} style={headerDeleteButtonStyle} title="Delete Group">
                <FiTrash2 size={16} />
                <span className="btn-label-desktop">Delete Group</span>
              </button>
            </div>
          )}
        </div>

        {/* CHAT MESSAGES DISPLAY */}
        <div style={chatBoxStyle}>
          {filteredMessages.length === 0 ? (
            <div style={emptyChatStyle}>
              <FiMessageSquare size={36} style={{ color: "var(--border)", marginBottom: "12px" }} />
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No messages in this chat yet.</p>
              <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>Send a message to start conversing!</p>
            </div>
          ) : (
            filteredMessages.map((m, i) => (
              <div
                key={i}
                className="message-wrapper"
                style={{
                  ...messageWrapperStyle,
                  alignSelf: m.self ? "flex-end" : "flex-start",
                  alignItems: m.self ? "flex-end" : "flex-start",
                }}
              >
                {!m.self && <div style={messageSenderStyle}>{m.sender}</div>}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: m.self ? "row-reverse" : "row" }}>
                  {editingMessageId === m.messageId ? (
                    <div style={editMessageInputContainerStyle}>
                      <input
                        type="text"
                        value={editMsgText}
                        onChange={(e) => setEditMsgText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEditMessage(m.messageId);
                          if (e.key === "Escape") setEditingMessageId(null);
                        }}
                        className="premium-input"
                        style={{ fontSize: "13px", padding: "8px 12px", height: "36px", width: "200px" }}
                        autoFocus
                      />
                      <div style={{ display: "flex", gap: "6px", marginTop: "4px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleEditMessage(m.messageId)}
                          className="premium-btn"
                          style={{ height: "28px", padding: "0 10px", fontSize: "11px", width: "auto" }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingMessageId(null)}
                          style={{ ...cancelButtonStyle, padding: "0 10px", fontSize: "11px", height: "28px" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span
                      style={{
                        ...messageBubbleStyle,
                        backgroundColor: m.self ? "var(--primary)" : "var(--bg-input)",
                        color: m.self ? "#ffffff" : "var(--text-main)",
                        borderRadius: m.self ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                      }}
                    >
                      {m.text}
                    </span>
                  )}

                  {/* Message Actions Dropdown (Only own messages, and when not in editing mode) */}
                  {m.self && m.messageId && editingMessageId !== m.messageId && (
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuMessageId(
                            activeMenuMessageId === m.messageId ? null : m.messageId
                          );
                        }}
                        className="message-menu-trigger"
                        style={messageMenuTriggerStyle}
                        title="Actions"
                      >
                        <FiMoreVertical size={14} />
                      </button>

                      {activeMenuMessageId === m.messageId && (
                        <div className="message-actions-dropdown">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditMessage(m.messageId, m.text);
                            }}
                            className="message-dropdown-item"
                          >
                            <FiEdit2 size={12} style={{ marginRight: "6px" }} />
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerDeleteMessage(m.messageId);
                              setActiveMenuMessageId(null);
                            }}
                            className="message-dropdown-item danger-item"
                          >
                            <FiTrash2 size={12} style={{ marginRight: "6px" }} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div style={messageTimeStyle}>
                  {m.time}
                  {m.isEdited && <span style={{ marginLeft: "6px", fontSize: "9px", fontStyle: "italic", opacity: 0.7 }}>(edited)</span>}
                </div>
              </div>
            ))

          )}
        </div>

        {/* MESSAGE INPUT CONSOLE */}
        <div style={inputAreaStyle}>
          <input
            type="text"
            placeholder={`Message ${activeChat.name}...`}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="premium-input"
            style={{ flex: 1 }}
          />
          <button onClick={sendMessage} className="premium-btn" style={{ width: "auto", padding: "0 24px", height: "48px" }}>
            <FiSend size={16} />
            <span>Send</span>
          </button>
        </div>
      </div>

      {/* CREATE GROUP MODAL DIALOG */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContainerStyle} className="animate-fade-in">
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>Create New Group</h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Create a new discussion channel for everyone to participate.</p>
            
            <input
              type="text"
              placeholder="e.g. Project Discussions"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
              className="premium-input"
              autoFocus
            />

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
              <button onClick={() => { setIsModalOpen(false); setNewGroupName(""); }} style={cancelButtonStyle}>
                Cancel
              </button>
              <button onClick={handleCreateGroup} className="premium-btn" style={{ width: "auto", padding: "0 18px", height: "38px", fontSize: "14px" }}>
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE MEMBERS MODAL DIALOG (Creator/Admin only) */}
      {isManageMembersOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContainerStyle} className="animate-fade-in">
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>Group Members</h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Select the users you want to add or remove from this group.</p>
            
            <div style={modalUserListContainerStyle}>
              {users
                .filter((u) => u._id !== currentUserId)
                .map((user) => {
                  const isChecked = selectedMemberIds.includes(user._id);
                  return (
                    <label key={user._id} style={modalUserCheckboxRowStyle}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMember(user._id)}
                        style={{ cursor: "pointer", width: "16px", height: "16px" }}
                      />
                      <span style={{ fontSize: "14px", color: "var(--text-main)" }}>{user.name}</span>
                    </label>
                  );
                })}
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
              <button onClick={() => setIsManageMembersOpen(false)} style={cancelButtonStyle}>
                Cancel
              </button>
              <button onClick={handleSaveMembers} className="premium-btn" style={{ width: "auto", padding: "0 18px", height: "38px", fontSize: "14px" }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteConfirm.isOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContainerStyle} className="animate-fade-in">
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--danger)", margin: 0 }}>
              {deleteConfirm.type === "group" ? "Delete Group?" : "Delete Message?"}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, lineHeight: "1.5" }}>
              {deleteConfirm.type === "group" 
                ? `Are you sure you want to delete the group "${deleteConfirm.name}"? All members will be removed and this action cannot be undone.`
                : "Are you sure you want to permanently delete this message? It will be removed for all participants."
              }
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
              <button onClick={() => setDeleteConfirm({ isOpen: false, type: "", id: "", name: "" })} style={cancelButtonStyle}>
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (deleteConfirm.type === "group") {
                    executeDeleteGroup(deleteConfirm.id, deleteConfirm.name);
                  } else {
                    executeDeleteMessage(deleteConfirm.id);
                  }
                }} 
                className="premium-btn" 
                style={{ width: "auto", padding: "0 18px", height: "38px", fontSize: "14px", backgroundColor: "var(--danger)", background: "var(--danger)", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */
const chatContainerStyle = {
  display: "flex",
  height: "calc(100vh - 120px)",
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "20px",
  overflow: "hidden",
  boxShadow: "var(--shadow-xl)",
};

const usersSidebarStyle = {
  width: "260px",
  backgroundColor: "var(--bg-main)",
  borderRight: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
};

const sectionContainerStyle = {
  display: "flex",
  flexDirection: "column",
  padding: "16px 12px",
};

const sidebarHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "4px 8px 12px 8px",
  gap: "8px",
};

const sidebarTitleStyle = {
  fontSize: "13px",
  fontWeight: "700",
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: 0,
  flex: 1,
};

const createGroupButtonStyle = {
  background: "none",
  border: "none",
  color: "var(--primary)",
  cursor: "pointer",
  padding: "4px",
  borderRadius: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
  backgroundColor: "var(--primary-light)",
};

const listStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const itemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 12px",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  textDecoration: "none",
};

const userItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "8px 10px",
  borderRadius: "10px",
  transition: "background-color 0.2s ease",
  cursor: "pointer",
};

const userAvatarStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, var(--primary) 0%, #34d399 100%)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "700",
  fontSize: "13px",
  boxShadow: "0 2px 6px rgba(99, 102, 241, 0.15)",
};

const userInfoStyle = {
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  flex: 1,
};

const userNameStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "var(--text-main)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const adminBadgeStyle = {
  marginLeft: "6px",
  backgroundColor: "rgba(99, 102, 241, 0.12)",
  color: "var(--primary)",
  fontSize: "9px",
  fontWeight: "800",
  padding: "2px 5px",
  borderRadius: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  lineHeight: "1",
};

const userStatusContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginTop: "2px",
};

const userStatusTextStyle = {
  fontSize: "11px",
  color: "var(--text-muted)",
};

const chatAreaStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  backgroundColor: "rgba(0, 0, 0, 0.005)",
};

const chatHeaderStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  backgroundColor: "var(--bg-card)",
};

const chatHeaderTitleStyle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "var(--text-main)",
};

const chatBoxStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const emptyChatStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  textAlign: "center",
};

const messageWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  maxWidth: "70%",
};

const messageSenderStyle = {
  fontSize: "11px",
  fontWeight: "600",
  color: "var(--primary)",
  marginBottom: "3px",
  paddingLeft: "4px",
};

const messageBubbleStyle = {
  padding: "10px 14px",
  fontSize: "14px",
  lineHeight: "1.5",
  wordWrap: "break-word",
  boxShadow: "var(--shadow-sm)",
};

const messageTimeStyle = {
  fontSize: "10px",
  color: "var(--text-muted)",
  marginTop: "4px",
  padding: "0 4px",
};

const messageDeleteButtonStyle = {
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  padding: "4px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0.4,
  transition: "all 0.2s ease",
  alignSelf: "center",
};

const editMessageInputContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  backgroundColor: "var(--bg-main)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "8px",
  boxShadow: "var(--shadow-sm)",
  marginTop: "4px",
};

const messageMenuTriggerStyle = {
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  padding: "6px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
  alignSelf: "center",
};


const inputAreaStyle = {
  padding: "20px 24px",
  borderTop: "1px solid var(--border)",
  display: "flex",
  gap: "12px",
  alignItems: "center",
  backgroundColor: "var(--bg-card)",
};

/* Modal Styles */
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  backdropFilter: "blur(4px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2000,
};

const modalContainerStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "24px",
  width: "90%",
  maxWidth: "400px",
  boxShadow: "var(--shadow-xl)",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const cancelButtonStyle = {
  padding: "8px 16px",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-muted)",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.2s ease",
  fontFamily: "inherit",
};

/* Additional Group management styles */
const headerActionButtonStyle = {
  display: "flex",
  alignItems: "center",
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

const headerDeleteButtonStyle = {
  ...headerActionButtonStyle,
  color: "var(--danger)",
  borderColor: "rgba(239, 68, 68, 0.2)",
  backgroundColor: "rgba(239, 68, 68, 0.04)",
};

const sidebarDeleteButtonStyle = {
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  padding: "4px",
  borderRadius: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0.6,
  transition: "opacity 0.2s ease",
};

const modalUserListContainerStyle = {
  maxHeight: "200px",
  overflowY: "auto",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "8px 12px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  backgroundColor: "var(--bg-main)",
};

const modalUserCheckboxRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  cursor: "pointer",
  padding: "4px 0",
};

export default Chat;