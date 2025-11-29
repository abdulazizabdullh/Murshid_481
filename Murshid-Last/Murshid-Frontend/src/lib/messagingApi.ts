import { supabase } from './supabase';
import type {
  Conversation,
  ConversationParticipant,
  Message,
  UserInfo,
  ConversationWithDetails,
} from '@/types/messaging';

// ============================================================================
// CONVERSATIONS
// ============================================================================

/**
 * Fetch all conversations for the current user
 */
export async function getConversations(): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get all conversation IDs the user is part of
  const { data: participations, error: partError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (partError) throw partError;
  if (!participations || participations.length === 0) return [];

  const conversationIds = participations.map(p => p.conversation_id);

  // Get conversations with participants and last message
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select(`
      id,
      created_at,
      updated_at
    `)
    .in('id', conversationIds)
    .order('updated_at', { ascending: false });

  if (convError) throw convError;
  if (!conversations) return [];

  // Enrich each conversation with participants and last message
  const enrichedConversations = await Promise.all(
    conversations.map(async (conv) => {
      // Get participants with profiles
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select(`
          id,
          conversation_id,
          user_id,
          last_read_at,
          joined_at
        `)
        .eq('conversation_id', conv.id);

      // Get user profiles for participants
      const participantUserIds = participants?.map(p => p.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, role, is_admin')
        .in('id', participantUserIds);

      const enrichedParticipants: ConversationParticipant[] = (participants || []).map(p => ({
        ...p,
        user: profiles?.find(profile => profile.id === p.user_id) as UserInfo,
      }));

      // Get the other user (not current user)
      const otherParticipant = enrichedParticipants.find(p => p.user_id !== user.id);
      const otherUser = otherParticipant?.user;

      // Get last message
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastMessage = lastMessages?.[0];

      // Count unread messages
      const myParticipation = enrichedParticipants.find(p => p.user_id === user.id);
      const lastReadAt = myParticipation?.last_read_at || conv.created_at;

      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', user.id)
        .gt('created_at', lastReadAt);

      return {
        ...conv,
        participants: enrichedParticipants,
        other_user: otherUser,
        last_message: lastMessage,
        unread_count: unreadCount || 0,
      } as Conversation;
    })
  );

  return enrichedConversations;
}

/**
 * Get or create a conversation between the current user and another user
 */
export async function getOrCreateConversation(otherUserId: string): Promise<Conversation> {
  console.log('getOrCreateConversation called with otherUserId:', otherUserId);
  
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user?.id);
  
  if (!user) throw new Error('Not authenticated');

  if (user.id === otherUserId) {
    throw new Error('Cannot start a conversation with yourself');
  }

  // Check if a conversation already exists between these two users
  const { data: myConversations, error: myConvError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  console.log('My conversations:', myConversations, 'Error:', myConvError);

  if (myConversations && myConversations.length > 0) {
    const conversationIds = myConversations.map(c => c.conversation_id);

    // Check if other user is in any of these conversations
    const { data: existingParticipation, error: existingError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', otherUserId)
      .in('conversation_id', conversationIds);

    console.log('Existing participation:', existingParticipation, 'Error:', existingError);

    if (existingParticipation && existingParticipation.length > 0) {
      // Get the existing conversation with 2 participants only (direct message)
      for (const participation of existingParticipation) {
        const { count } = await supabase
          .from('conversation_participants')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', participation.conversation_id);

        if (count === 2) {
          // This is a direct message conversation
          const conversations = await getConversations();
          const existing = conversations.find(c => c.id === participation.conversation_id);
          if (existing) return existing;
        }
      }
    }
  }

  // Create new conversation
  console.log('Creating new conversation...');
  const { data: newConversation, error: convError } = await supabase
    .from('conversations')
    .insert({})
    .select()
    .single();

  console.log('New conversation result:', newConversation, 'Error:', convError);
  if (convError) throw convError;

  // Add both participants
  console.log('Adding participants:', { conversationId: newConversation.id, userId: user.id, otherUserId });
  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: newConversation.id, user_id: user.id },
      { conversation_id: newConversation.id, user_id: otherUserId },
    ]);

  console.log('Participants insert error:', partError);
  if (partError) throw partError;

  // Get the other user's profile
  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, role, is_admin')
    .eq('id', otherUserId)
    .single();

  return {
    ...newConversation,
    participants: [],
    other_user: otherProfile as UserInfo,
    unread_count: 0,
  };
}

/**
 * Get a single conversation with full details
 */
export async function getConversation(conversationId: string): Promise<ConversationWithDetails | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (convError || !conversation) return null;

  // Get participants with profiles
  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('*')
    .eq('conversation_id', conversationId);

  const participantUserIds = participants?.map(p => p.user_id) || [];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, role, is_admin')
    .in('id', participantUserIds);

  const enrichedParticipants: ConversationParticipant[] = (participants || []).map(p => ({
    ...p,
    user: profiles?.find(profile => profile.id === p.user_id) as UserInfo,
  }));

  // Get all messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  // Add sender info to messages
  const enrichedMessages: Message[] = (messages || []).map(m => ({
    ...m,
    sender: profiles?.find(p => p.id === m.sender_id) as UserInfo,
  }));

  const otherParticipant = enrichedParticipants.find(p => p.user_id !== user.id);

  return {
    ...conversation,
    participants: enrichedParticipants,
    messages: enrichedMessages,
    other_user: otherParticipant?.user,
  };
}

// ============================================================================
// MESSAGES
// ============================================================================

/**
 * Get messages for a conversation
 */
export async function getMessages(
  conversationId: string,
  limit = 50,
  before?: string
): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data: messages, error } = await query;
  if (error) throw error;

  // Get sender profiles
  const senderIds = [...new Set(messages?.map(m => m.sender_id) || [])];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, role, is_admin')
    .in('id', senderIds);

  const enrichedMessages: Message[] = (messages || []).map(m => ({
    ...m,
    sender: profiles?.find(p => p.id === m.sender_id) as UserInfo,
  }));

  // Return in ascending order for display
  return enrichedMessages.reverse();
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
  conversationId: string,
  content: string
): Promise<Message> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const trimmedContent = content.trim();
  if (!trimmedContent) throw new Error('Message cannot be empty');

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmedContent,
    })
    .select()
    .single();

  if (error) throw error;

  // Get sender profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, role, is_admin')
    .eq('id', user.id)
    .single();

  return {
    ...message,
    sender: profile as UserInfo,
  };
}

/**
 * Mark all messages in a conversation as read
 */
export async function markConversationAsRead(conversationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Update the participant's last_read_at timestamp
  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);

  // Also mark all messages as read
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id);
}

/**
 * Get total unread message count across all conversations
 */
export async function getTotalUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  // Get all participations with last_read_at
  const { data: participations } = await supabase
    .from('conversation_participants')
    .select('conversation_id, last_read_at')
    .eq('user_id', user.id);

  if (!participations || participations.length === 0) return 0;

  let totalUnread = 0;

  for (const participation of participations) {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', participation.conversation_id)
      .neq('sender_id', user.id)
      .gt('created_at', participation.last_read_at);

    totalUnread += count || 0;
  }

  return totalUnread;
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to new messages in a conversation
 */
export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void
) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const newMessage = payload.new as Message;
        
        // Get sender profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, role, is_admin')
          .eq('id', newMessage.sender_id)
          .single();

        onMessage({
          ...newMessage,
          sender: profile as UserInfo,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to conversation updates (new messages, etc.)
 */
export function subscribeToConversations(
  userId: string,
  onUpdate: () => void
) {
  const channel = supabase
    .channel(`user-conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

