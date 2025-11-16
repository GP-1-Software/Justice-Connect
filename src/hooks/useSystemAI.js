// src/hooks/useSystemAI.js

import { useState, useEffect, useCallback } from "react";
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage as sendMessageApi,
  deleteConversation as deleteConversationApi,
  updateConversationTitle,
} from "../services/systemAiApi";

const LAST_CONVERSATION_STORAGE_KEY = "systemAI:lastConversationId";

const getStoredConversationId = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_CONVERSATION_STORAGE_KEY);
};

const storeConversationId = (conversationId) => {
  if (typeof window === "undefined") return;
  if (conversationId) {
    window.localStorage.setItem(
      LAST_CONVERSATION_STORAGE_KEY,
      String(conversationId)
    );
  } else {
    window.localStorage.removeItem(LAST_CONVERSATION_STORAGE_KEY);
  }
};

/**
 * Custom hook for SystemAI chat functionality
 * @param {number} adminId - Admin ID
 */
export const useSystemAI = (adminId) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  // Load conversations
  const loadConversations = useCallback(async (restoreLast = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getConversations(adminId);
      setConversations(data);

      if (restoreLast) {
        const storedId = getStoredConversationId();
        let conversationToLoad = null;

        if (storedId) {
          conversationToLoad = data.find(
            (conversation) => String(conversation.id) === storedId
          );
        }

        if (!conversationToLoad && data.length > 0) {
          conversationToLoad = data[0];
        }

        if (conversationToLoad) {
          setCurrentConversation(conversationToLoad);
          try {
            const msgs = await getMessages(conversationToLoad.id);
            setMessages(msgs);
            storeConversationId(conversationToLoad.id);
          } catch (messageError) {
            setError(messageError.message);
            console.error("Failed to load messages:", messageError);
          }
        } else {
          setCurrentConversation(null);
          setMessages([]);
          storeConversationId(null);
        }
      }
    } catch (err) {
      setError(err.message);
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [adminId]);

  // Fetch all conversations on mount and restore last session
  useEffect(() => {
    if (adminId) {
      loadConversations(true);
    }
  }, [adminId, loadConversations]);

  // Create new conversation
  const createNewConversation = useCallback(async (title = "محادثة جديدة") => {
    try {
      setIsLoading(true);
      setError(null);
      const newConv = await createConversation(adminId, title);
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversation(newConv);
      setMessages([]);
      storeConversationId(newConv.id);
      return newConv;
    } catch (err) {
      setError(err.message);
      console.error("Failed to create conversation:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [adminId]);

  // Select a conversation and load its messages
  const selectConversation = useCallback(async (conversationId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) {
        setCurrentConversation(conv);
        storeConversationId(conv.id);
      }
      
      const msgs = await getMessages(conversationId);
      setMessages(msgs);
    } catch (err) {
      setError(err.message);
      console.error("Failed to load messages:", err);
    } finally {
      setIsLoading(false);
    }
  }, [conversations]);

  const streamAssistantMessage = useCallback(async (messageId, fullText = "") => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const chars = [...fullText];
    const baseDelay = fullText.length > 220 ? 4 : fullText.length > 120 ? 6 : 10;
    let current = "";

    for (const char of chars) {
      current += char;
      let messageStillExists = true;
      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === messageId);
        if (!exists) {
          messageStillExists = false;
          return prev;
        }
        return prev.map((msg) =>
          msg.id === messageId ? { ...msg, message: current } : msg
        );
      });
      if (!messageStillExists) break;
      // eslint-disable-next-line no-await-in-loop
      await delay(baseDelay);
    }
  }, []);

  // Send a message with fake streaming effect
  const sendMessage = useCallback(async (text) => {
    if (!currentConversation || !text.trim() || isSending) return;

    const conversationId = currentConversation.id;
    const tempUserId = `temp-user-${Date.now()}`;
    const tempAiId = `temp-ai-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      setIsSending(true);
      setError(null);

      // Optimistic user message + placeholder for assistant response
      setMessages((prev) => [
        ...prev,
        {
          id: tempUserId,
          conversation_id: conversationId,
          sender: "user",
          message: text,
          created_at: timestamp,
          isTemporary: true,
        },
        {
          id: tempAiId,
          conversation_id: conversationId,
          sender: "ai",
          message: "",
          created_at: timestamp,
          isStreaming: true,
        },
      ]);

      const { userMessage, aiMessage } = await sendMessageApi(
        conversationId,
        text
      );

      // Auto-update conversation title on first meaningful message
      let updatedTitle = null;
      const rawTitleCandidate = text.trim().split("\n")[0];
      const shouldRename =
        !currentConversation.title ||
        currentConversation.title.trim() === "" ||
        currentConversation.title === "محادثة جديدة";

      if (shouldRename && rawTitleCandidate) {
        const sanitizedTitle = rawTitleCandidate.slice(0, 60);
        try {
          const updatedConversation = await updateConversationTitle(
            conversationId,
            sanitizedTitle
          );
          updatedTitle = updatedConversation.title;
          setCurrentConversation((prev) =>
            prev && prev.id === conversationId
              ? { ...prev, ...updatedConversation }
              : prev
          );
        } catch (titleError) {
          console.error("Failed to update conversation title:", titleError);
          updatedTitle = sanitizedTitle;
          setCurrentConversation((prev) =>
            prev && prev.id === conversationId
              ? { ...prev, title: sanitizedTitle }
              : prev
          );
        }
      }

      // Replace temporary messages with the saved versions (assistant starts empty for streaming)
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === tempUserId) {
            return userMessage;
          }
          if (msg.id === tempAiId) {
            return { ...aiMessage, message: "" };
          }
          return msg;
        })
      );

      // Stream the assistant response character by character
      await streamAssistantMessage(aiMessage.id, aiMessage.message);

      // Ensure final content is set (in case streaming was interrupted)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessage.id ? { ...msg, message: aiMessage.message } : msg
        )
      );

      // Update conversation's last_message_at
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                last_message_at: aiMessage.created_at,
                ...(updatedTitle ? { title: updatedTitle } : {}),
              }
            : c
        )
      );

      setCurrentConversation((prev) =>
        prev && prev.id === conversationId
          ? {
              ...prev,
              last_message_at: aiMessage.created_at,
              ...(updatedTitle ? { title: updatedTitle } : {}),
            }
          : prev
      );
    } catch (err) {
      setError(err.message);
      console.error("Failed to send message:", err);

      // Show error in placeholder assistant bubble
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempAiId
            ? {
                ...msg,
                sender: "ai",
                message: "⚠️ حدث خطأ أثناء معالجة الرسالة. حاول مجدداً لاحقاً.",
                hasError: true,
              }
            : msg
        )
      );

      throw err;
    } finally {
      setIsSending(false);
    }
  }, [currentConversation, isSending, streamAssistantMessage]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      setError(null);
      await deleteConversationApi(conversationId);
      
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
        storeConversationId(null);
      } else {
        const storedId = getStoredConversationId();
        if (storedId && storedId === String(conversationId)) {
          storeConversationId(null);
        }
      }
    } catch (err) {
      setError(err.message);
      console.error("Failed to delete conversation:", err);
      throw err;
    }
  }, [currentConversation]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      return false;
    }
  }, []);

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isSending,
    error,
    createNewConversation,
    selectConversation,
    sendMessage,
    deleteConversation,
    copyToClipboard,
    loadConversations,
  };
};
