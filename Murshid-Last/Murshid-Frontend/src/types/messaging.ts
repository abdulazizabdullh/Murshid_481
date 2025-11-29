// ============================================================================
// MESSAGING SYSTEM TYPES
// ============================================================================

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  // Populated from joins
  participants?: ConversationParticipant[];
  last_message?: Message;
  other_user?: UserInfo;
  unread_count?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string;
  joined_at: string;
  // Populated from profile join
  user?: UserInfo;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  // Populated from profile join
  sender?: UserInfo;
}

export interface UserInfo {
  id: string;
  name: string;
  avatar_url?: string;
  role?: string;
  is_admin?: boolean;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateConversationRequest {
  participant_ids: string[]; // User IDs to add to conversation
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
}

export interface ConversationWithDetails extends Conversation {
  participants: ConversationParticipant[];
  messages: Message[];
}

// ============================================================================
// YJS AWARENESS TYPES
// ============================================================================

export interface UserAwareness {
  id: string;
  name: string;
  avatar_url?: string;
  isTyping: boolean;
  isOnline: boolean;
  lastSeen: string;
  conversationId?: string;
}

export interface TypingState {
  [conversationId: string]: {
    [userId: string]: boolean;
  };
}

export interface OnlineState {
  [userId: string]: {
    isOnline: boolean;
    lastSeen: string;
  };
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface MessagingContextType {
  // Conversations
  conversations: Conversation[];
  currentConversation: ConversationWithDetails | null;
  loadingConversations: boolean;
  
  // Messages
  messages: Message[];
  loadingMessages: boolean;
  
  // Actions
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<Message | null>;
  startConversation: (userId: string) => Promise<Conversation | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  
  // Yjs Awareness
  typingUsers: { [conversationId: string]: UserInfo[] };
  onlineUsers: { [userId: string]: boolean };
  setTyping: (conversationId: string, isTyping: boolean) => void;
  
  // Unread count
  totalUnreadCount: number;
}

// ============================================================================
// REALTIME TYPES
// ============================================================================

export interface RealtimeMessagePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Message;
  old?: Message;
}

export interface RealtimeConversationPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Conversation;
  old?: Conversation;
}

