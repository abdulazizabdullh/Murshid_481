import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageApi,
  getOrCreateConversation,
  markConversationAsRead,
  getTotalUnreadCount,
  subscribeToMessages,
  subscribeToConversations,
} from '@/lib/messagingApi';
import type {
  Conversation,
  Message,
  UserInfo,
  MessagingContextType,
  ConversationWithDetails,
} from '@/types/messaging';
import type { RealtimeChannel } from '@supabase/supabase-js';

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within MessagingProvider');
  }
  return context;
};

interface MessagingProviderProps {
  children: ReactNode;
}

// Presence state type
interface PresenceState {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  is_online: boolean;
  is_typing: boolean;
  typing_in_conversation?: string | null;
  online_at: string;
}

export const MessagingProvider = ({ children }: MessagingProviderProps) => {
  const { user } = useAuth();
  
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  
  // Presence state
  const [typingUsers, setTypingUsers] = useState<{ [conversationId: string]: UserInfo[] }>({});
  const [onlineUsers, setOnlineUsers] = useState<{ [userId: string]: boolean }>({});
  
  // Refs for subscriptions
  const messageUnsubRef = useRef<(() => void) | null>(null);
  const conversationUnsubRef = useRef<(() => void) | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  
  // Track active conversation for real-time messages
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Initialize Supabase Presence for online status and typing indicators
  useEffect(() => {
    if (!user) {
      // Clean up presence when user logs out
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      setOnlineUsers({});
      setTypingUsers({});
      return;
    }

    // Create a presence channel for all online users
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Handle presence sync (initial state and updates)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceState>();
      const online: { [userId: string]: boolean } = {};
      const typing: { [conversationId: string]: UserInfo[] } = {};

      Object.entries(state).forEach(([userId, presences]) => {
        if (presences && presences.length > 0) {
          const presence = presences[0];
          online[userId] = presence.is_online;

          // Track typing users per conversation
          if (presence.is_typing && presence.typing_in_conversation) {
            if (!typing[presence.typing_in_conversation]) {
              typing[presence.typing_in_conversation] = [];
            }
            typing[presence.typing_in_conversation].push({
              id: userId,
              name: presence.user_name,
              avatar_url: presence.avatar_url,
            });
          }
        }
      });

      setOnlineUsers(online);
      setTypingUsers(typing);
    });

    // Handle user joining
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences);
      if (newPresences && newPresences.length > 0) {
        setOnlineUsers(prev => ({ ...prev, [key]: true }));
      }
    });

    // Handle user leaving
    channel.on('presence', { event: 'leave' }, ({ key }) => {
      console.log('User left:', key);
      setOnlineUsers(prev => ({ ...prev, [key]: false }));
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Presence channel subscribed');
        await channel.track({
          user_id: user.id,
          user_name: user.name || 'User',
          avatar_url: user.avatar_url,
          is_online: true,
          is_typing: false,
          typing_in_conversation: null,
          online_at: new Date().toISOString(),
        } as PresenceState);
      }
    });

    presenceChannelRef.current = channel;

    // Update presence on visibility change
    const handleVisibilityChange = async () => {
      if (presenceChannelRef.current) {
        await presenceChannelRef.current.track({
          user_id: user.id,
          user_name: user.name || 'User',
          avatar_url: user.avatar_url,
          is_online: !document.hidden,
          is_typing: false,
          typing_in_conversation: null,
          online_at: new Date().toISOString(),
        } as PresenceState);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [user]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    setLoadingConversations(true);
    try {
      const data = await getConversations();
      setConversations(data);
      
      // Update unread count
      const unread = await getTotalUnreadCount();
      setTotalUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, [user]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    // Set active conversation for real-time subscription
    setActiveConversationId(conversationId);
    
    setLoadingMessages(true);
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
      
      // Mark as read
      await markConversationAsRead(conversationId);
      
      // Update conversation's unread count locally
      setConversations(prev => 
        prev.map(c => 
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        )
      );
      
      // Recalculate total unread
      const unread = await getTotalUnreadCount();
      setTotalUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, [user]);

  // Send a message
  const sendMessageHandler = useCallback(async (
    conversationId: string,
    content: string
  ): Promise<Message | null> => {
    if (!user) return null;
    
    try {
      const message = await sendMessageApi(conversationId, content);
      
      // Add to local state immediately
      setMessages(prev => [...prev, message]);
      
      // Update conversation's last message
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId
            ? { ...c, last_message: message, updated_at: message.created_at }
            : c
        ).sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
      );
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }, [user]);

  // Start a new conversation
  const startConversation = useCallback(async (
    otherUserId: string
  ): Promise<Conversation | null> => {
    if (!user) return null;
    
    try {
      const conversation = await getOrCreateConversation(otherUserId);
      
      // Add to conversations list if not already there
      setConversations(prev => {
        const exists = prev.find(c => c.id === conversation.id);
        if (exists) return prev;
        return [conversation, ...prev];
      });
      
      return conversation;
    } catch (error) {
      console.error('Error starting conversation:', error);
      return null;
    }
  }, [user]);

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await markConversationAsRead(conversationId);
      
      // Update local state
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        )
      );
      
      // Recalculate total
      const unread = await getTotalUnreadCount();
      setTotalUnreadCount(unread);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  // Set typing status using Supabase Presence
  const setTyping = useCallback(async (conversationId: string, isTyping: boolean) => {
    if (!presenceChannelRef.current || !user) return;
    
    try {
      await presenceChannelRef.current.track({
        user_id: user.id,
        user_name: user.name || 'User',
        avatar_url: user.avatar_url,
        is_online: true,
        is_typing: isTyping,
        typing_in_conversation: isTyping ? conversationId : null,
        online_at: new Date().toISOString(),
      } as PresenceState);
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [user]);

  // Subscribe to real-time updates when user logs in
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setMessages([]);
      setTotalUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchConversations();

    // Subscribe to conversation updates
    conversationUnsubRef.current = subscribeToConversations(user.id, () => {
      fetchConversations();
    });

    return () => {
      conversationUnsubRef.current?.();
    };
  }, [user, fetchConversations]);

  // Subscribe to messages when viewing a conversation
  useEffect(() => {
    if (!activeConversationId) {
      messageUnsubRef.current?.();
      return;
    }

    console.log('Subscribing to messages for conversation:', activeConversationId);
    
    messageUnsubRef.current = subscribeToMessages(
      activeConversationId,
      async (newMessage) => {
        console.log('Received new message via realtime:', newMessage);
        // Only add if not from current user (already added optimistically)
        if (newMessage.sender_id !== user?.id) {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.find(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          
          // Also update conversation list - but don't increment unread since we're viewing it
          setConversations(prev =>
            prev.map(c =>
              c.id === activeConversationId
                ? { ...c, last_message: newMessage, updated_at: newMessage.created_at, unread_count: 0 }
                : c
            ).sort((a, b) => 
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
          );
          
          // Mark as read immediately since user is viewing this conversation
          await markConversationAsRead(activeConversationId);
        }
      }
    );

    return () => {
      messageUnsubRef.current?.();
    };
  }, [activeConversationId, user?.id]);

  const value: MessagingContextType = {
    conversations,
    currentConversation,
    loadingConversations,
    messages,
    loadingMessages,
    fetchConversations,
    fetchMessages,
    sendMessage: sendMessageHandler,
    startConversation,
    markAsRead,
    typingUsers,
    onlineUsers,
    setTyping,
    totalUnreadCount,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};
