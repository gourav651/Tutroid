import React, { useState, useEffect } from "react";
import {
  X,
  MessageSquare,
  Search,
  Users,
  Send,
  MoreVertical,
  Phone,
  Video,
  Info,
} from "lucide-react";
import ApiService from "../services/api";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "../utils/dateUtils";

const MessagingPanel = ({ isOpen, onClose, initialUserId }) => {
  const [conversations, setConversations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("conversations");
  const [pendingUserId, setPendingUserId] = useState(null);
  const { socket } = useSocket();
  const { theme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      // Load conversations immediately
      loadConversations();
      // Only load available users when switching to "users" view
      if (view === "users" && availableUsers.length === 0) {
        loadAvailableUsers();
      }
    }
  }, [isOpen, view]);

  // Store initialUserId when panel opens
  useEffect(() => {
    if (isOpen && initialUserId) {
      setPendingUserId(initialUserId);
    } else if (!isOpen) {
      // Reset when panel closes
      setPendingUserId(null);
      setSelectedConversation(null);
    }
  }, [isOpen, initialUserId]);

  // Handle opening conversation with specific user after conversations load
  useEffect(() => {
    if (pendingUserId && conversations.length > 0 && !loading) {
      const existingConv = conversations.find(conv => 
        conv.participants.some(p => p.id === pendingUserId)
      );
      if (existingConv) {
        setSelectedConversation(existingConv);
        setView("conversations");
        setPendingUserId(null); // Clear pending
      } else {
        // Start new conversation with this user
        startConversation(pendingUserId);
        setPendingUserId(null); // Clear pending
      }
    }
  }, [pendingUserId, conversations, loading]);

  // helper used in multiple places so we can update the conversation list
  const { user } = useAuth();

  const handleNewMessage = (message) => {
    // Update conversations list with new message, moving it to the top
    setConversations((prev) => {
      // Check if conversation exists
      const convExists = prev.some((conv) => conv.id === message.conversationId);
      
      // If conversation doesn't exist, we need to reload conversations
      if (!convExists) {
        loadConversations();
        return prev;
      }
      
      return prev
        .map((conv) => {
          if (conv.id !== message.conversationId) return conv;

          // increment unread count if the message is not from the current user
          const isOwn = message.senderId === user?.id;
          const prevCount = conv._count?.messages || 0;
          const newCount = isOwn ? prevCount : prevCount + 1;

          return {
            ...conv,
            messages: [message],
            updatedAt: new Date(),
            _count: { ...conv._count, messages: newCount },
          };
        })
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("new_message", handleNewMessage);

    const handleRead = ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, _count: { ...conv._count, messages: 0 } }
            : conv,
        ),
      );
    };

    socket.on("messages_read", handleRead);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("messages_read", handleRead);
    };
  }, [socket]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getConversations();
      setConversations(response.data || []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await ApiService.getAvailableUsers();
      setAvailableUsers(response.data || []);
    } catch (error) {
      console.error("Failed to load available users:", error);
    }
  };

  const startConversation = async (userId) => {
    try {
      const response = await ApiService.createConversation({
        participantId: userId,
      });
      setSelectedConversation(response.data);
      setView("conversations");
      await loadConversations();
    } catch (error) {
      alert(error.message || "Failed to start conversation");
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const participant = conv.participants[0];
    const name =
      `${participant?.firstName || ""} ${participant?.lastName || ""}`.toLowerCase();
    const institutionName =
      participant?.institutionProfile?.name?.toLowerCase() || "";
    return (
      name.includes(searchQuery.toLowerCase()) ||
      institutionName.includes(searchQuery.toLowerCase())
    );
  });

  const filteredUsers = availableUsers.filter((user) => {
    const name =
      `${user?.firstName || ""} ${user?.lastName || ""}`.toLowerCase();
    const institutionName = user?.institutionProfile?.name?.toLowerCase() || "";
    return (
      name.includes(searchQuery.toLowerCase()) ||
      institutionName.includes(searchQuery.toLowerCase())
    );
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel - LinkedIn Style */}
      <div
        className={`fixed inset-0 sm:bottom-0 sm:right-6 sm:inset-auto w-full sm:w-[420px] h-full sm:h-[600px] ${theme.cardBg} sm:rounded-t-xl shadow-2xl z-50 flex flex-col border-t-2 ${theme.cardBorder}`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 border-b ${theme.cardBorder} flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg`}
            >
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-base font-semibold ${theme.textPrimary}`}>
                Messaging
              </h2>
              <p className={`text-xs ${theme.textMuted}`}>
                {conversations.length} conversation
                {conversations.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className={`p-2 rounded-lg ${theme.hoverBg} transition`}>
              <MoreVertical className={`w-4 h-4 ${theme.textSecondary}`} />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${theme.hoverBg} transition`}
            >
              <X className={`w-4 h-4 ${theme.textSecondary}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className={`px-4 py-3 border-b ${theme.cardBorder}`}>
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`}
            />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-lg text-sm ${theme.inputText} ${theme.inputPlaceholder} focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition`}
            />
          </div>
        </div>

        {/* View Toggle */}
        <div className={`px-4 py-2 border-b ${theme.cardBorder} flex gap-1`}>
          <button
            onClick={() => setView("conversations")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
              view === "conversations"
                ? `${theme.accentBg} text-white shadow-sm`
                : `${theme.textSecondary} ${theme.hoverBg}`
            }`}
          >
            Focused
          </button>
          <button
            onClick={() => setView("users")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
              view === "users"
                ? `${theme.accentBg} text-white shadow-sm`
                : `${theme.textSecondary} ${theme.hoverBg}`
            }`}
          >
            All Users
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {view === "conversations" ? (
            loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg ${theme.inputBg} animate-pulse`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-300" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-3/4" />
                      <div className="h-3 bg-gray-300 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div
                  className={`w-16 h-16 rounded-full ${theme.inputBg} flex items-center justify-center mb-4`}
                >
                  <MessageSquare className={`w-8 h-8 ${theme.textMuted}`} />
                </div>
                <h3
                  className={`text-sm font-semibold ${theme.textPrimary} mb-1`}
                >
                  No messages yet
                </h3>
                <p className={`text-xs ${theme.textMuted}`}>
                  Start a conversation from "All Users" tab
                </p>
              </div>
            ) : (
              <div className="p-2">
                {filteredConversations.map((conv) => {
                  const participant = conv.participants[0];
                  const lastMessage = conv.messages?.[0];
                  const unreadCount = conv._count?.messages || 0;
                  const displayName =
                    participant?.institutionProfile?.name ||
                    `${participant?.firstName || ""} ${participant?.lastName || ""}`.trim();

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-3 rounded-lg ${theme.hoverBg} transition text-left mb-1`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3
                              className={`font-semibold text-sm ${theme.textPrimary} truncate`}
                            >
                              {displayName}
                            </h3>
                            {lastMessage && (
                              <span
                                className={`text-xs ${theme.textMuted} flex-shrink-0 ml-2`}
                              >
                                {formatDistanceToNow(lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p
                              className={`text-xs ${theme.textSecondary} truncate`}
                            >
                              {lastMessage?.content || "Start a conversation"}
                            </p>
                            {unreadCount > 0 && (
                              <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 font-medium">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div className="p-2">
              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div
                    className={`w-16 h-16 rounded-full ${theme.inputBg} flex items-center justify-center mb-4`}
                  >
                    <Users className={`w-8 h-8 ${theme.textMuted}`} />
                  </div>
                  <h3
                    className={`text-sm font-semibold ${theme.textPrimary} mb-1`}
                  >
                    No users found
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    Try a different search
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const displayName =
                    user?.institutionProfile?.name ||
                    `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
                  const location =
                    user?.trainerProfile?.location ||
                    user?.institutionProfile?.location;

                  return (
                    <button
                      key={user.id}
                      onClick={() => startConversation(user.id)}
                      className={`w-full p-3 rounded-lg ${theme.hoverBg} transition text-left mb-1`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`font-semibold text-sm ${theme.textPrimary} truncate`}
                          >
                            {displayName}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs ${theme.textMuted} capitalize`}
                            >
                              {user?.role?.toLowerCase()}
                            </span>
                            {location && (
                              <>
                                <span className={`text-xs ${theme.textMuted}`}>
                                  •
                                </span>
                                <span
                                  className={`text-xs ${theme.textMuted} truncate`}
                                >
                                  {location}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Send className={`w-4 h-4 ${theme.textMuted}`} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Window Modal */}
      {selectedConversation && (
        <ChatWindowModal
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
          onNewMessage={handleNewMessage}
        />
      )}
    </>
  );
};

// Separate Chat Window Component
const ChatWindowModal = ({
  conversation,
  onClose,
  onNewMessage,
  onConversationRead,
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = React.useRef(null);
  const { socket } = useSocket();
  const { user } = useAuth();
  const { theme } = useTheme();

  const participant = conversation.participants[0];
  const displayName =
    participant?.institutionProfile?.name ||
    `${participant?.firstName || ""} ${participant?.lastName || ""}`.trim();

  useEffect(() => {
    if (!socket) return;

    // Join room first so we don't miss any events
    socket.emit("join_conversation", conversation.id);
    
    // Set up message handler before loading messages to catch any incoming messages
    const messageHandler = (message) => {
      if (message.conversationId === conversation.id) {
        setMessages((prev) => {
          // Avoid duplicates by checking if message already exists
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
        
        // Notify parent component
        onNewMessage && onNewMessage(message);
        
        // Auto-scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };
    
    socket.on("new_message", messageHandler);

    // Then fetch history
    loadMessages();

    return () => {
      socket.emit("leave_conversation", conversation.id);
      socket.off("new_message", messageHandler);
    };
  }, [conversation.id, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await ApiService.getMessages(conversation.id);
      setMessages(response.data || []);

      // clear our own unread counter locally
      onConversationRead && onConversationRead(conversation.id);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const tempContent = newMessage.trim();
    
    // Clear input immediately for better UX
    setNewMessage("");

    try {
      setSending(true);
      const response = await ApiService.sendMessage({
        conversationId: conversation.id,
        content: tempContent,
      });
      const sent = response.data;

      // Add the sent message to UI (with duplicate check)
      setMessages((prev) => {
        // Avoid duplicates if socket event arrived first
        if (prev.some((m) => m.id === sent.id)) {
          return prev;
        }
        return [...prev, sent];
      });
      
      // Notify parent component to update conversation list
      onNewMessage && onNewMessage(sent);

    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore message on error so user can retry
      setNewMessage(tempContent);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`fixed inset-0 sm:bottom-0 sm:right-[460px] sm:inset-auto w-full sm:w-[420px] h-full sm:h-[600px] ${theme.cardBg} sm:rounded-t-xl shadow-2xl z-50 flex flex-col border-t-2 ${theme.cardBorder}`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 border-b ${theme.cardBorder} flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${theme.textPrimary}`}>
                {displayName}
              </h3>
              <p className={`text-xs ${theme.textMuted} capitalize`}>
                {participant?.role?.toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className={`p-2 rounded-lg ${theme.hoverBg} transition`}>
              <Phone className={`w-4 h-4 ${theme.textSecondary}`} />
            </button>
            <button className={`p-2 rounded-lg ${theme.hoverBg} transition`}>
              <Video className={`w-4 h-4 ${theme.textSecondary}`} />
            </button>
            <button className={`p-2 rounded-lg ${theme.hoverBg} transition`}>
              <Info className={`w-4 h-4 ${theme.textSecondary}`} />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${theme.hoverBg} transition`}
            >
              <X className={`w-4 h-4 ${theme.textSecondary}`} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 ${theme.bg}`}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.senderId === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}
                    >
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? "bg-blue-500 text-white rounded-br-sm"
                            : `${theme.cardBg} ${theme.textPrimary} border ${theme.cardBorder} rounded-bl-sm`
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                      </div>
                      <p
                        className={`text-xs ${theme.textMuted} mt-1 ${isOwn ? "text-right" : "text-left"}`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSendMessage}
          className={`p-4 border-t ${theme.cardBorder}`}
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write a message..."
              className={`flex-1 px-4 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-full text-sm ${theme.inputText} ${theme.inputPlaceholder} focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition`}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default MessagingPanel;
