import { useState, useRef, useEffect } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Hash, Send, MessageCircle, ArrowLeft, ThumbsUp, Heart, Flame, Flag,
  Reply, Loader2, Vote, Users, Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useForumChannels, useForumMessages, useDailyTopic, useDMConversations, useDirectMessages, ForumMessage } from '@/hooks/useForum';
import { format } from 'date-fns';
import { useTranslation } from '@/i18n/LanguageContext';
import { useDateLocale } from '@/hooks/useDateLocale';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

type ForumView = 'channels' | 'chat' | 'dms' | 'dm-chat';

const REACTION_EMOJIS = ['👍', '❤️', '🔥', '🚀', '😂', '🎯'];

export default function Forum() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { user } = useAuth();

  const [view, setView] = useState<ForumView>('channels');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedChannelName, setSelectedChannelName] = useState('');
  const [selectedChannelIcon, setSelectedChannelIcon] = useState('');
  const [dmPartnerId, setDmPartnerId] = useState<string | null>(null);
  const [dmPartnerName, setDmPartnerName] = useState('');
  const [replyTo, setReplyTo] = useState<ForumMessage | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [signalPickerOpen, setSignalPickerOpen] = useState(false);
  const [pendingSignalId, setPendingSignalId] = useState<string | null>(null);

  const { channels, loading: channelsLoading } = useForumChannels();
  const { messages, loading: msgsLoading, sendMessage, toggleReaction, reportMessage } = useForumMessages(selectedChannelId);
  const { topic, vote } = useDailyTopic();
  const { conversations, loading: convosLoading } = useDMConversations();
  const { messages: dmMessages, loading: dmLoading, sendDM } = useDirectMessages(dmPartnerId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, dmMessages]);

  const openChannel = (channelId: string, name: string, icon: string) => {
    setSelectedChannelId(channelId);
    setSelectedChannelName(name);
    setSelectedChannelIcon(icon);
    setView('chat');
  };

  const openDM = (userId: string, name: string) => {
    setDmPartnerId(userId);
    setDmPartnerName(name);
    setView('dm-chat');
  };

  const handleSend = async () => {
    const text = messageInput.trim();
    if (!text) return;
    if (!user) { toast.error('Inicia sesión para enviar mensajes'); return; }

    if (view === 'chat') {
      await sendMessage(text, replyTo?.id);
    } else if (view === 'dm-chat') {
      await sendDM(text);
    }
    setMessageInput('');
    setReplyTo(null);
  };

  const handleReport = async (msgId: string) => {
    await reportMessage(msgId, 'Contenido inapropiado');
    toast.success('Mensaje reportado');
  };

  // ═══ CHANNELS LIST VIEW ═══
  const renderChannelsView = () => (
    <div className="space-y-4">
      {/* Daily Topic */}
      {topic && (
        <Card className="bg-card border-border overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Vote className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Tema del Día</span>
            </div>
            <h3 className="text-sm font-bold text-foreground">{topic.title}</h3>
            {topic.description && <p className="text-xs text-muted-foreground">{topic.description}</p>}
            <div className="grid grid-cols-2 gap-2">
              {(['a', 'b'] as const).map(opt => {
                const label = opt === 'a' ? topic.option_a : topic.option_b;
                const votes = opt === 'a' ? topic.votes_a : topic.votes_b;
                const total = topic.votes_a + topic.votes_b;
                const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                const isSelected = topic.user_vote === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => user ? vote(opt) : toast.error('Inicia sesión para votar')}
                    className={cn(
                      "relative overflow-hidden rounded-lg border p-3 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary hover:border-primary/50"
                    )}
                  >
                    <div
                      className="absolute inset-0 bg-primary/10 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="relative text-xs font-semibold text-foreground">{label}</span>
                    <div className="relative flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-muted-foreground">{votes} votos</span>
                      <span className="text-[10px] font-bold text-primary">{pct}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Channels vs DMs */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('channels')}
          className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-colors",
            view === 'channels' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}
        >
          <Hash className="w-3.5 h-3.5 inline mr-1" /> Canales
        </button>
        <button
          onClick={() => setView('dms')}
          className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-colors",
            view === 'dms' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}
        >
          <Mail className="w-3.5 h-3.5 inline mr-1" /> Mensajes
        </button>
      </div>

      {/* Channel list */}
      {channelsLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-1.5">
          {channels.map(ch => (
            <button
              key={ch.id}
              onClick={() => openChannel(ch.id, ch.name, ch.icon)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors text-left"
            >
              <span className="text-xl">{ch.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{ch.name}</p>
                {ch.description && <p className="text-[10px] text-muted-foreground truncate">{ch.description}</p>}
              </div>
              <Hash className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ═══ DM CONVERSATIONS LIST ═══
  const renderDMsView = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setView('channels')}
          className="flex-1 py-2 rounded-lg text-xs font-bold bg-secondary text-muted-foreground"
        >
          <Hash className="w-3.5 h-3.5 inline mr-1" /> Canales
        </button>
        <button className="flex-1 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground">
          <Mail className="w-3.5 h-3.5 inline mr-1" /> Mensajes
        </button>
      </div>

      {!user ? (
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center space-y-2">
            <Users className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Inicia sesión para ver tus mensajes directos</p>
            <Link to="/auth" className="text-xs text-primary font-bold hover:underline">Iniciar Sesión</Link>
          </CardContent>
        </Card>
      ) : convosLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : conversations.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No tienes conversaciones aún</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {conversations.map(c => (
            <button
              key={c.user_id}
              onClick={() => openDM(c.user_id, c.user_name)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors text-left"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={c.user_avatar || ''} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">{c.user_name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{c.user_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{c.last_message}</p>
              </div>
              {c.unread_count > 0 && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5">{c.unread_count}</Badge>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ═══ CHAT VIEW (channel or DM) ═══
  const renderChatView = () => {
    const isDM = view === 'dm-chat';
    const chatMessages = isDM ? dmMessages : messages;
    const chatLoading = isDM ? dmLoading : msgsLoading;
    const title = isDM ? dmPartnerName : `${selectedChannelIcon} ${selectedChannelName}`;

    return (
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Chat header */}
        <div className="flex items-center gap-3 pb-3">
          <button onClick={() => setView(isDM ? 'dms' : 'channels')} className="text-primary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-bold text-foreground truncate">{title}</h2>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {chatMessages.length} msgs
          </span>
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 pr-2">
          {chatLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageCircle className="w-10 h-10 mb-2" />
              <p className="text-xs">No hay mensajes aún. ¡Sé el primero!</p>
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {(isDM ? dmMessages : messages).map((msg: any) => {
                const isOwn = msg.user_id === user?.id || msg.sender_id === user?.id;
                const userName = isDM ? msg.sender_name : msg.user_name;
                const userAvatar = isDM ? msg.sender_avatar : msg.user_avatar;
                const msgId = msg.id;

                return (
                  <div key={msgId} className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
                    <Avatar className="w-7 h-7 mt-1 flex-shrink-0">
                      <AvatarImage src={userAvatar || ''} />
                      <AvatarFallback className="bg-primary/20 text-primary text-[10px]">{(userName || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div className={cn("max-w-[75%] space-y-1", isOwn && "items-end")}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-primary">{userName}</span>
                        <span className="text-[9px] text-muted-foreground">
                          {format(new Date(msg.created_at), 'HH:mm', { locale: dateLocale })}
                        </span>
                      </div>

                      {/* Reply preview */}
                      {!isDM && msg.reply_to && (
                        <div className="bg-secondary/50 border-l-2 border-primary/50 px-2 py-1 rounded-r text-[10px] text-muted-foreground">
                          <span className="font-semibold">{msg.reply_to.user_name}</span>: {msg.reply_to.content}
                        </div>
                      )}

                      <div className={cn(
                        "px-3 py-2 rounded-xl text-xs text-foreground",
                        isOwn ? "bg-primary/20 rounded-tr-sm" : "bg-secondary rounded-tl-sm"
                      )}>
                        {msg.is_deleted ? (
                          <span className="italic text-muted-foreground">Mensaje eliminado</span>
                        ) : (
                          msg.content
                        )}
                      </div>

                      {/* Reactions */}
                      {!isDM && msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {msg.reactions.map((r: any) => (
                            <button
                              key={r.emoji}
                              onClick={() => toggleReaction(msgId, r.emoji)}
                              className={cn(
                                "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] border transition-colors",
                                r.user_reacted
                                  ? "bg-primary/10 border-primary/30 text-primary"
                                  : "bg-secondary border-border text-muted-foreground hover:border-primary/30"
                              )}
                            >
                              {r.emoji} {r.count}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      {!isDM && !msg.is_deleted && (
                        <div className="flex gap-1 mt-0.5">
                          {/* Quick reactions */}
                          <button
                            onClick={() => setShowReactions(showReactions === msgId ? null : msgId)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setReplyTo(msg)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Reply className="w-3 h-3" />
                          </button>
                          {!isOwn && (
                            <button
                              onClick={() => handleReport(msgId)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Flag className="w-3 h-3" />
                            </button>
                          )}
                          {/* DM user */}
                          {!isOwn && user && (
                            <button
                              onClick={() => openDM(msg.user_id, msg.user_name || 'Usuario')}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Mail className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Emoji picker */}
                      {showReactions === msgId && (
                        <div className="flex gap-1 bg-card border border-border rounded-full px-2 py-1">
                          {REACTION_EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => { toggleReaction(msgId, emoji); setShowReactions(null); }}
                              className="hover:scale-125 transition-transform text-sm"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Reply bar */}
        {replyTo && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border-t border-border">
            <Reply className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-muted-foreground flex-1 truncate">
              Respondiendo a <strong>{replyTo.user_name}</strong>: {replyTo.content.slice(0, 40)}
            </span>
            <button onClick={() => setReplyTo(null)} className="text-muted-foreground text-xs">✕</button>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={user ? "Escribe un mensaje..." : "Inicia sesión para escribir"}
            disabled={!user}
            className="flex-1 h-9 text-xs bg-secondary border-border"
          />
          <button
            onClick={handleSend}
            disabled={!user || !messageInput.trim()}
            className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <PageShell>
      <Header />
      <main className="container py-4 space-y-4">
        {/* Title */}
        {(view === 'channels' || view === 'dms') && (
          <div className="flex items-center gap-3">
            <Link to="/" className="text-primary hover:text-primary/80 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-foreground italic">
              <MessageCircle className="w-5 h-5 inline mr-2" />
              Comunidad
            </h1>
            <span className="ml-auto text-[10px] text-muted-foreground">
              <Users className="w-3 h-3 inline mr-0.5" />
              En línea
            </span>
          </div>
        )}

        {view === 'channels' && renderChannelsView()}
        {view === 'dms' && renderDMsView()}
        {(view === 'chat' || view === 'dm-chat') && renderChatView()}
      </main>
    </PageShell>
  );
}
