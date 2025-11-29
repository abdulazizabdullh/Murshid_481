import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
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

// Public Yjs WebSocket server (for production, use your own server)
const YJS_WEBSOCKET_URL = 'murshid-481.vercel.app';

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

export const MessagingProvider = ({ children }: MessagingProviderProps) => {
  const { user } = useAuth();
  
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  
  // Yjs awareness state
  const [typingUsers, setTypingUsers] = useState<{ [conversationId: string]: UserInfo[] }>({});
  const [onlineUsers, setOnlineUsers] = useState<{ [userId: string]: boolean }>({});
  
  // Refs for Yjs
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const persistenceRef = useRef<IndexeddbPersistence | null>(null);
  const awarenessCleanupRef = useRef<(() => void) | null>(null);
  
  // Refs for subscriptions
  const messageUnsubRef = useRef<(() => void) | null>(null);
  const conversationUnsubRef = useRef<(() => void) | null>(null);
  
  // Track active conversation for real-time messages
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Initialize Yjs for presence/awareness
  useEffect(() => {
    if (!user) return;

    // Create Yjs document for global awareness
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Connect to WebSocket provider - ALL users join the SAME room for shared awareness
    const provider = new WebsocketProvider(
      YJS_WEBSOCKET_URL,
      'murshid-messaging-global-room',
      ydoc
    );
    providerRef.current = provider;

    // Set up IndexedDB persistence for offline support
    const persistence = new IndexeddbPersistence('murshid-messaging-local', ydoc);
    persistenceRef.current = persistence;

    // Set up awareness
    const awareness = provider.awareness;
    
    // Set local state
    awareness.setLocalState({
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url,
      isOnline: true,
      isTyping: false,
      lastSeen: new Date().toISOString(),
      conversationId: null,
    });

    // Listen for awareness changes
    const handleAwarenessChange = () => {
      const states = awareness.getStates();
      const online: { [userId: string]: boolean } = {};
      const typing: { [conversationId: string]: UserInfo[] } = {};

      states.forEach((state) => {
        if (state && state.id) {
          online[state.id] = state.isOnline || false;
          
          if (state.isTyping && state.conversationId) {
            if (!typing[state.conversationId]) {
              typing[state.conversationId] = [];
            }
            typing[state.conversationId].push({
              id: state.id,
              name: state.name,
              avatar_url: state.avatar_url,
            });
          }
        }
      });

      setOnlineUsers(online);
      setTypingUsers(typing);
    };

    awareness.on('change', handleAwarenessChange);
    awarenessCleanupRef.current = () => {
      awareness.off('change', handleAwarenessChange);
    };

    // Update last seen on window focus/blur
    const handleVisibilityChange = () => {
      awareness.setLocalStateField('isOnline', !document.hidden);
      awareness.setLocalStateField('lastSeen', new Date().toISOString());
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      awarenessCleanupRef.current?.();
      provider.disconnect();
      persistence.destroy();
      ydoc.destroy();
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

  // Set typing status
  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (!providerRef.current) return;
    
    const awareness = providerRef.current.awareness;
    awareness.setLocalStateField('isTyping', isTyping);
    awareness.setLocalStateField('conversationId', isTyping ? conversationId : null);
  }, []);

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
      (newMessage) => {
        console.log('Received new message via realtime:', newMessage);
        // Only add if not from current user (already added optimistically)
        if (newMessage.sender_id !== user?.id) {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.find(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          
          // Also update conversation list
          setConversations(prev =>
            prev.map(c =>
              c.id === activeConversationId
                ? { ...c, last_message: newMessage, updated_at: newMessage.created_at }
                : c
            ).sort((a, b) => 
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
          );
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

