"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { API_BASE_URL } from "../api";
import {
  createChatConversation,
  listChatConversations,
  markChatConversationRead,
  sendChatMessageRest,
  type CreateChatConversationInput,
} from "../chat";
import { session } from "../session";
import type { ChatConversation, ChatMessage } from "../types";

type SocketSendAck = {
  ok: boolean;
  error?: string;
  message?: ChatMessage;
  conversation?: ChatConversation;
  recipientId?: string;
};

type SocketSimpleAck = {
  ok: boolean;
  error?: string;
  readAt?: string;
};

type SocketConversationAck = {
  ok: boolean;
  error?: string;
  conversation?: ChatConversation;
};

type TypingState = Record<string, string | null>;

const SOCKET_URL = API_BASE_URL.replace(/\/api$/, "");

function sortConversations(items: ChatConversation[]) {
  return [...items].sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
}

function mergeMessages(messages: ChatMessage[]) {
  const byId = new Map<string, ChatMessage>();
  for (const message of messages) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function useRealtimeChat(userId: string | null | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [typingByConversation, setTypingByConversation] = useState<TypingState>({});

  const upsertConversation = useCallback(
    (conversation: ChatConversation, message?: ChatMessage) => {
      setConversations((current) => {
        const existing = current.find((item) => item.id === conversation.id);
        const mergedMessages = mergeMessages([
          ...(existing?.messages ?? []),
          ...(conversation.messages ?? []),
          ...(message ? [message] : []),
        ]);
        const hasIncomingMessage =
          !!message && message.sender_id !== userId && !existing?.messages.some((m) => m.id === message.id);
        const isActive = activeConversationIdRef.current === conversation.id;
        const unreadCount =
          hasIncomingMessage && !isActive
            ? (existing?.unreadCount ?? 0) + 1
            : isActive
              ? 0
              : (existing?.unreadCount ?? conversation.unreadCount ?? 0);
        const lastMessage = mergedMessages[mergedMessages.length - 1] ?? conversation.lastMessage ?? null;

        const nextConversation: ChatConversation = {
          ...(existing ?? conversation),
          ...conversation,
          messages: mergedMessages,
          unreadCount,
          lastMessage,
          last_message_at: message?.created_at ?? conversation.last_message_at,
        };

        const withoutCurrent = current.filter((item) => item.id !== conversation.id);
        return sortConversations([nextConversation, ...withoutCurrent]);
      });
    },
    [userId],
  );

  const markReadLocal = useCallback(
    (conversationId: string, readAt: string, readerId: string) => {
      setConversations((current) =>
        current.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          const messages = conversation.messages.map((message) =>
            message.sender_id !== readerId && !message.read_at
              ? { ...message, read_at: readAt }
              : message,
          );

          return {
            ...conversation,
            messages,
            unreadCount: readerId === userId ? 0 : conversation.unreadCount,
            lastMessage:
              messages.find((message) => message.id === conversation.lastMessage?.id) ??
              conversation.lastMessage,
          };
        }),
      );
    },
    [userId],
  );

  const refresh = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const items = await listChatConversations();
      setConversations(sortConversations(items));
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Gagal memuat chat");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;

    const intervalId = window.setInterval(() => {
      void refresh();
    }, 10_000);

    const refreshOnFocus = () => {
      void refresh();
    };

    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [refresh, userId]);

  useEffect(() => {
    if (!userId) return;
    const token = session.get();
    if (!token) {
      setConnected(false);
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setErrorMsg(null);
      const activeId = activeConversationIdRef.current;
      if (activeId) {
        socket.emit("chat:join", { conversationId: activeId });
      }
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (error) => {
      setConnected(false);
      setErrorMsg(error.message || "Koneksi realtime chat terputus");
    });
    socket.on(
      "chat:conversation",
      (conversation: ChatConversation) => upsertConversation(conversation),
    );
    socket.on(
      "chat:message",
      (payload: { message: ChatMessage; conversation: ChatConversation }) => {
        upsertConversation(payload.conversation, payload.message);

        if (
          payload.message.sender_id !== userId &&
          activeConversationIdRef.current === payload.message.conversation_id
        ) {
          void markChatConversationRead(payload.message.conversation_id).then((result) => {
            markReadLocal(payload.message.conversation_id, result.readAt, userId);
            socket.emit("chat:read", { conversationId: payload.message.conversation_id });
          });
        }
      },
    );
    socket.on(
      "chat:typing",
      (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
        if (payload.userId === userId) return;
        if (typingTimeoutRef.current[payload.conversationId]) {
          clearTimeout(typingTimeoutRef.current[payload.conversationId]);
        }
        setTypingByConversation((current) => ({
          ...current,
          [payload.conversationId]: payload.isTyping ? payload.userId : null,
        }));
        if (payload.isTyping) {
          typingTimeoutRef.current[payload.conversationId] = setTimeout(() => {
            setTypingByConversation((current) => ({
              ...current,
              [payload.conversationId]: null,
            }));
          }, 2500);
        }
      },
    );
    socket.on(
      "chat:read",
      (payload: { conversationId: string; userId: string; readAt: string }) => {
        markReadLocal(payload.conversationId, payload.readAt, payload.userId);
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [markReadLocal, upsertConversation, userId]);

  const joinConversation = useCallback(
    async (conversationId: string) => {
      activeConversationIdRef.current = conversationId;
      const socket = socketRef.current;

      if (socket?.connected) {
        await new Promise<void>((resolve) => {
          socket.emit(
            "chat:join",
            { conversationId },
            () => resolve(),
          );
        });
      }

      try {
        const result = await markChatConversationRead(conversationId);
        if (userId) markReadLocal(conversationId, result.readAt, userId);
        socket?.emit("chat:read", { conversationId });
      } catch {
        // Read receipt tidak boleh menghalangi pengguna membuka percakapan.
      }
    },
    [markReadLocal, userId],
  );

  const createConversation = useCallback(
    async (input: CreateChatConversationInput) => {
      const conversation = await createChatConversation(input);
      upsertConversation(conversation);

      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit(
          "chat:conversation:created",
          { conversationId: conversation.id },
          (response: SocketConversationAck) => {
            if (response?.ok && response.conversation) {
              upsertConversation(response.conversation);
            }
          },
        );
      }

      return conversation;
    },
    [upsertConversation],
  );

  const sendMessage = useCallback(
    async (conversationId: string, body: string) => {
      const messageBody = body.trim();
      if (!messageBody) return null;

      const socket = socketRef.current;
      if (socket?.connected) {
        const response = await new Promise<SocketSendAck>((resolve) => {
          socket.emit("chat:send", { conversationId, body: messageBody }, resolve);
        });
        if (!response.ok || !response.message || !response.conversation) {
          throw new Error(response.error ?? "Gagal mengirim pesan");
        }
        upsertConversation(response.conversation, response.message);
        return response.message;
      }

      const result = await sendChatMessageRest(conversationId, messageBody);
      upsertConversation(result.conversation, result.message);
      return result.message;
    },
    [upsertConversation],
  );

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    socketRef.current?.emit("chat:typing", { conversationId, isTyping });
  }, []);

  const markRead = useCallback(
    async (conversationId: string) => {
      const result = await markChatConversationRead(conversationId);
      if (userId) markReadLocal(conversationId, result.readAt, userId);

      await new Promise<SocketSimpleAck | void>((resolve) => {
        const socket = socketRef.current;
        if (!socket?.connected) {
          resolve();
          return;
        }
        socket.emit("chat:read", { conversationId }, resolve);
      });
    },
    [markReadLocal, userId],
  );

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    [conversations],
  );

  return {
    conversations,
    connected,
    loading,
    errorMsg,
    unreadTotal,
    typingByConversation,
    refresh,
    joinConversation,
    createConversation,
    sendMessage,
    sendTyping,
    markRead,
  };
}
