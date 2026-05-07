/**
 * chat.ts — Domain wrapper untuk endpoint /api/chat/*.
 */

import { api } from "./api";
import type { ChatConversation, ChatMessage } from "./types";

export interface CreateChatConversationInput {
  dokterId: string;
  subject?: string | null;
  appointmentId?: string | null;
}

export async function listChatConversations(): Promise<ChatConversation[]> {
  const data = await api.get<{ items: ChatConversation[] }>("/chat/conversations");
  return data.items;
}

export async function createChatConversation(
  input: CreateChatConversationInput,
): Promise<ChatConversation> {
  const data = await api.post<{ conversation: ChatConversation }>(
    "/chat/conversations",
    input,
  );
  return data.conversation;
}

export async function sendChatMessageRest(
  conversationId: string,
  body: string,
): Promise<{
  message: ChatMessage;
  conversation: ChatConversation;
  recipientId: string;
}> {
  return api.post(`/chat/conversations/${conversationId}/messages`, { body });
}

export async function markChatConversationRead(
  conversationId: string,
): Promise<{ readAt: string }> {
  return api.patch(`/chat/conversations/${conversationId}/read`);
}
