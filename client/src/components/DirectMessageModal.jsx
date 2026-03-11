import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, MessageSquare } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import ApiService from "../services/api";
import { formatDistanceToNow } from "../utils/dateUtils";
import { DEFAULT_PROFILE_IMAGE } from "../utils/constants";

export default function DirectMessageModal({ isOpen, onClose, recipient }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && recipient?.id) {
      loadOrCreateConversation();
    }
  }, [isOpen, recipient?.id]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleNewMessage = (message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleMessagesRead = (data) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((msg) => ({ ...msg, isRead: true }))
        );
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [socket, conversationId]);

  const loadOrCreateConversation = async () => {
    try {
      setLoading(true);
      
      // Try to get existing conversation
      const conversationsResponse = await ApiService.getConversations();
      const existingConv = conversationsResponse.data?.find((conv) =>
        conv.participants.some((p) => p.id === recipient.id)
      );

      if (existingConv) {
        setConversationId(existingConv.id);
        await loadMessages(existingConv.id);
      } else {
        // Create new conversation
        const response = await ApiService.createConversation({
          participantId: recipient.id,
        });
        setConversationId(response.data.id);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId) => {
    try {
      const response = await ApiService.getMessages(convId);
      if (response.success) {
        setMessages(response.data || []);
        
        // Mark messages as read
        await ApiService.markMessagesAsRead(convId);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !conversationId) return;

    setSending(true);
    try {
      const response = await ApiService.sendMessage({
        conversationId,
        content: newMessage.trim(),
      });

      if (response.success) {
        setMessages((prev) => [...prev, response.data]);
        setNewMessage("");
        
        // Emit socket event
        if (socket) {
          socket.emit("send_message", {
            conversationId,
            message: response.data,
          });
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const recipientName = recipient?.firstName
    ? `${recipient.firstName} ${recipient.lastName || ""}`.trim()
    : recipient?.institutionProfile?.name || "User";

  const recipientAvatar = recipient?.profilePicture || DEFAULT_PROFILE_IMAGE;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`${theme.cardBg} w-full max-w-2xl h-[600px] rounded-2xl shadow-2xl border ${theme.cardBorder} flex flex-col pointer-events-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-6 py-4 border-b ${theme.divider}`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                {recipientAvatar ? (
                  <img
                    src={recipientAvatar}
                    alt={recipientName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {recipientName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800"></div>
              </div>
              <div>
                <h3 className={`font-semibold ${theme.textPrimary}`}>
                  {recipientName}
                </h3>
                <p className={`text-xs ${theme.textMuted}`}>
                  {recipient?.role === "INSTITUTION"
                    ? "Institution"
                    : recipient?.role === "TRAINER"
                    ? "Trainer"
                    : "User"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${theme.hoverBg} ${theme.textMuted} ${theme.hoverText} transition-colors`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className={`w-8 h-8 animate-spin ${theme.accentColor}`} />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <MessageSquare className={`w-16 h-16 ${theme.textMuted} mb-4`} />
                <p className={`text-lg font-semibold ${theme.textPrimary} mb-2`}>
                  Start a conversation
                </p>
                <p className={`text-sm ${theme.textMuted} text-center max-w-sm`}>
                  Send a message to {recipientName} to start chatting
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const isOwn = message.senderId === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isOwn
                            ? "bg-blue-500 text-white"
                            : `${theme.inputBg} ${theme.textPrimary}`
                        } rounded-2xl px-4 py-2.5`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? "text-blue-100" : theme.textMuted
                          }`}
                        >
                          {formatDistanceToNow(new Date(message.createdAt))}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className={`px-6 py-4 border-t ${theme.divider}`}
          >
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${recipientName}...`}
                className={`flex-1 px-4 py-2.5 rounded-full border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none`}
                disabled={sending || loading}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending || loading}
                className="p-2.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-400/50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
