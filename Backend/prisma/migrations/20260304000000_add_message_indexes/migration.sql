-- Add composite indexes for better query performance
CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "Message_conversationId_isRead_idx" ON "Message"("conversationId", "isRead");
