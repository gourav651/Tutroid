import React from "react";
import { formatDistanceToNow } from "../../utils/dateUtils";

const ConversationList = ({ conversations, selectedConversation, onSelectConversation, loading }) => {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="mb-3 p-3 bg-gray-100 rounded-lg animate-pulse h-16" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 p-4">
        <p>No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map(conv => {
        const participant = conv.participants[0];
        const lastMessage = conv.messages?.[0];
        const unreadCount = conv._count?.messages || 0;
        const isSelected = selectedConversation?.id === conv.id;

        return (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv)}
            className={`w-full p-4 border-b hover:bg-gray-50 transition text-left ${
              isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {participant?.firstName?.[0]}{participant?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold truncate">
                    {participant?.firstName} {participant?.lastName}
                  </h3>
                  {lastMessage && (
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatDistanceToNow(lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate">
                    {lastMessage?.content || "No messages yet"}
                  </p>
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 capitalize">
                  {participant?.role?.toLowerCase()}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ConversationList;
