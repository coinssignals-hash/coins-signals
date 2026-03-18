import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ForumChannel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  sort_order: number;
}

export interface ForumMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  signal_id: string | null;
  reply_to_id: string | null;
  is_deleted: boolean;
  created_at: string;
  // Joined fields
  user_name?: string;
  user_avatar?: string;
  user_language?: string;
  reactions?: ReactionCount[];
  reply_to?: { content: string; user_name: string } | null;
}

export interface ReactionCount {
  emoji: string;
  count: number;
  user_reacted: boolean;
}

export interface DailyTopic {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  option_a: string;
  option_b: string;
  topic_date: string;
  votes_a: number;
  votes_b: number;
  user_vote: 'a' | 'b' | null;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface DMConversation {
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  last_message: string;
  last_at: string;
  unread_count: number;
}

export function useForumChannels() {
  const [channels, setChannels] = useState<ForumChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('forum_channels')
        .select('*')
        .order('sort_order');
      setChannels((data as ForumChannel[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return { channels, loading };
}

export function useForumMessages(channelId: string | null) {
  const [messages, setMessages] = useState<ForumMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!channelId) return;
    setLoading(true);

    // Fetch messages
    const { data: msgs } = await supabase
      .from('forum_messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!msgs) { setLoading(false); return; }

    // Get unique user IDs
    const userIds = [...new Set(msgs.map(m => m.user_id))];
    
    // Fetch profiles for those users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, alias, avatar_url, language')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // Fetch reactions for these messages
    const messageIds = msgs.map(m => m.id);
    const { data: reactions } = await supabase
      .from('forum_reactions')
      .select('*')
      .in('message_id', messageIds);

    // Get reply-to messages
    const replyIds = msgs.filter(m => m.reply_to_id).map(m => m.reply_to_id!);
    let replyMap = new Map<string, { content: string; user_name: string }>();
    if (replyIds.length > 0) {
      const { data: replies } = await supabase
        .from('forum_messages')
        .select('id, content, user_id')
        .in('id', replyIds);
      if (replies) {
        for (const r of replies) {
          const p = profileMap.get(r.user_id);
          replyMap.set(r.id, {
            content: r.content.slice(0, 60),
            user_name: p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Anónimo' : 'Anónimo',
          });
        }
      }
    }

    // Build reaction counts per message
    const reactionsByMessage = new Map<string, ReactionCount[]>();
    if (reactions) {
      const grouped = new Map<string, Map<string, { count: number; userReacted: boolean }>>();
      for (const r of reactions) {
        if (!grouped.has(r.message_id)) grouped.set(r.message_id, new Map());
        const emojiMap = grouped.get(r.message_id)!;
        if (!emojiMap.has(r.emoji)) emojiMap.set(r.emoji, { count: 0, userReacted: false });
        const entry = emojiMap.get(r.emoji)!;
        entry.count++;
        if (r.user_id === user?.id) entry.userReacted = true;
      }
      for (const [msgId, emojiMap] of grouped) {
        reactionsByMessage.set(msgId, Array.from(emojiMap.entries()).map(([emoji, data]) => ({
          emoji,
          count: data.count,
          user_reacted: data.userReacted,
        })));
      }
    }

    const enriched: ForumMessage[] = msgs.map(m => {
      const p = profileMap.get(m.user_id);
      return {
        ...m,
        user_name: p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Anónimo' : 'Anónimo',
        user_avatar: (p as any)?.avatar_url || null,
        user_language: (p as any)?.language || 'es',
        reactions: reactionsByMessage.get(m.id) || [],
        reply_to: m.reply_to_id ? replyMap.get(m.reply_to_id) || null : null,
      };
    });

    setMessages(enriched);
    setLoading(false);
  }, [channelId, user?.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!channelId) return;
    const channel = supabase
      .channel(`forum-${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'forum_messages',
        filter: `channel_id=eq.${channelId}`,
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [channelId, fetchMessages]);

  const sendMessage = useCallback(async (content: string, replyToId?: string, signalId?: string, imageUrl?: string) => {
    if (!user || !channelId) return;
    await supabase.from('forum_messages').insert({
      channel_id: channelId,
      user_id: user.id,
      content,
      reply_to_id: replyToId || null,
      signal_id: signalId || null,
      image_url: imageUrl || null,
    });
  }, [user, channelId]);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;
    const existing = messages.find(m => m.id === messageId)?.reactions?.find(r => r.emoji === emoji && r.user_reacted);
    if (existing) {
      await supabase.from('forum_reactions').delete().match({ message_id: messageId, user_id: user.id, emoji });
    } else {
      await supabase.from('forum_reactions').insert({ message_id: messageId, user_id: user.id, emoji });
    }
    fetchMessages();
  }, [user, messages, fetchMessages]);

  const reportMessage = useCallback(async (messageId: string, reason: string) => {
    if (!user) return;
    await supabase.from('forum_reports').insert({
      message_id: messageId,
      reporter_id: user.id,
      reason,
    });
  }, [user]);

  return { messages, loading, sendMessage, toggleReaction, reportMessage, refetch: fetchMessages };
}

export function useDailyTopic() {
  const [topic, setTopic] = useState<DailyTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTopic = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('forum_daily_topics')
      .select('*')
      .eq('topic_date', today)
      .maybeSingle();

    if (!data) { setTopic(null); setLoading(false); return; }

    // Get votes
    const { data: votes } = await supabase
      .from('forum_topic_votes')
      .select('vote, user_id')
      .eq('topic_id', data.id);

    let votesA = 0, votesB = 0, userVote: 'a' | 'b' | null = null;
    if (votes) {
      for (const v of votes) {
        if (v.vote === 'a') votesA++;
        else votesB++;
        if (v.user_id === user?.id) userVote = v.vote as 'a' | 'b';
      }
    }

    setTopic({
      id: data.id,
      title: data.title,
      description: data.description,
      image_url: (data as any).image_url || null,
      option_a: data.option_a,
      option_b: data.option_b,
      topic_date: data.topic_date,
      votes_a: votesA,
      votes_b: votesB,
      user_vote: userVote,
    });
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchTopic(); }, [fetchTopic]);

  const vote = useCallback(async (option: 'a' | 'b') => {
    if (!user || !topic) return;

    if (topic.user_vote) {
      // Update existing vote
      await supabase.from('forum_topic_votes')
        .update({ vote: option })
        .match({ topic_id: topic.id, user_id: user.id });
    } else {
      await supabase.from('forum_topic_votes').insert({
        topic_id: topic.id,
        user_id: user.id,
        vote: option,
      });
    }
    fetchTopic();
  }, [user, topic, fetchTopic]);

  return { topic, loading, vote, refetchTopic: fetchTopic };
}

export function useDirectMessages(partnerId: string | null) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDMs = useCallback(async () => {
    if (!user || !partnerId) return;
    setLoading(true);

    const { data } = await supabase
      .from('forum_direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!data) { setLoading(false); return; }

    const userIds = [...new Set(data.map(d => d.sender_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    setMessages(data.map(d => {
      const p = profileMap.get(d.sender_id);
      return {
        ...d,
        sender_name: p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Anónimo' : 'Anónimo',
        sender_avatar: p?.avatar_url || null,
      };
    }));
    setLoading(false);

    // Mark as read
    await supabase.from('forum_direct_messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', partnerId)
      .eq('is_read', false);
  }, [user, partnerId]);

  useEffect(() => { fetchDMs(); }, [fetchDMs]);

  // Realtime
  useEffect(() => {
    if (!user || !partnerId) return;
    const channel = supabase
      .channel(`dm-${user.id}-${partnerId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'forum_direct_messages',
      }, (payload) => {
        const msg = payload.new as any;
        if (
          (msg.sender_id === user.id && msg.receiver_id === partnerId) ||
          (msg.sender_id === partnerId && msg.receiver_id === user.id)
        ) {
          fetchDMs();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, partnerId, fetchDMs]);

  const sendDM = useCallback(async (content: string) => {
    if (!user || !partnerId) return;
    await supabase.from('forum_direct_messages').insert({
      sender_id: user.id,
      receiver_id: partnerId,
      content,
    });
  }, [user, partnerId]);

  return { messages, loading, sendDM };
}

export function useDMConversations() {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      // Get all DMs involving this user
      const { data } = await supabase
        .from('forum_direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(500);

      if (!data || data.length === 0) { setConversations([]); setLoading(false); return; }

      // Group by partner
      const partnerMap = new Map<string, { msgs: typeof data; unread: number }>();
      for (const d of data) {
        const partnerId = d.sender_id === user.id ? d.receiver_id : d.sender_id;
        if (!partnerMap.has(partnerId)) partnerMap.set(partnerId, { msgs: [], unread: 0 });
        const entry = partnerMap.get(partnerId)!;
        entry.msgs.push(d);
        if (!d.is_read && d.receiver_id === user.id) entry.unread++;
      }

      // Fetch partner profiles
      const partnerIds = [...partnerMap.keys()];
      const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', partnerIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const convos: DMConversation[] = partnerIds.map(pid => {
        const entry = partnerMap.get(pid)!;
        const lastMsg = entry.msgs[0];
        const p = profileMap.get(pid);
        return {
          user_id: pid,
          user_name: p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Anónimo' : 'Anónimo',
          user_avatar: p?.avatar_url || null,
          last_message: lastMsg.content.slice(0, 50),
          last_at: lastMsg.created_at,
          unread_count: entry.unread,
        };
      }).sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());

      setConversations(convos);
      setLoading(false);
    };

    fetch();
  }, [user]);

  return { conversations, loading };
}
