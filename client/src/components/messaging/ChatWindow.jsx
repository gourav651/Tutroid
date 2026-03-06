import React, { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, Loader } from "lucide-react";
import ApiService from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { formatTime } from "../../utils/dateUtils";

const ChatWindow = ({ conversation, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  const participant = conversation.participants[0];

  useEffect(() => {
    loadMessages();
    
    if (socket) {
      socket.emit("join_conversation", conversation.id);
      
      socket.on("new_message", handleNewMessage);
      socket.on("user_typing", handleTyping);
      socket.on("messages_read", handleMessagesRead);

      return () => {
        socket.emit("leave_conversation", conversation.id);
        socket.off("new_message", handleNewMessage);
        socket.off("user_typing", handleTyping);
        socket.off("messages_read", handleMessagesRead);
      };
    }
  }, [conversation.id, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getMessages(conversation.id);
      setMessages(response.data || []);
      
      // Mark as read
      if (socket) {
        socket.emit("mark_read", { conversationId: conversation.id });
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    if (message.conversationId === conversation.id) {
      setMessages(prev => [...prev, message]);
    }
  };

  const handleTyping = ({ userId, isTyping: typing }) => {
    if (userId !== user.id) {
      setIsTyping(typing);
      if (typing) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    }
  };

  const handleMessagesRead = ({ conversationId }) => {
    if (conversationId === conversation.id) {
      setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await ApiService.sendMessage({
        conversationId: conversation.id,
        content: newMessage.trim()
      });
      
      setNewMessage("");
      
      // Stop typing indicator
      if (socket) {
        socket.emit("typing", { conversationId: conversation.id, isTyping: false });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleTypingChange = (value) => {
    setNewMessage(value);
    
    if (socket) {
      socket.emit("typing", { 
        conversationId: conversation.id, 
        isTyping: value.length > 0 
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center gap-3">
        <button onClick={onBack} className="lg:hidden">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
          {participant?.firstName?.[0]}{participant?.lastName?.[0]}
        </div>
        <div>
          <h2 className="font-semibold">
            {participant?.firstName} {participant?.lastName}
          </h2>
          <p className="text-sm text-gray-500 capitalize">
            {participant?.role?.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isOwn = msg.senderId === user.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-800 border"
                    }`}
                  >
                    <p className="break-words">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                      {isOwn && msg.isRead && " · Read"}
                    </p>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border px-4 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => handleTypingChange(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
