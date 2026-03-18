import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Hash, Send, MessageCircle, ArrowLeft, ThumbsUp, Heart, Flame, Flag,
  Reply, Loader2, Vote, Users, Mail, TrendingUp, Star, Globe, ImagePlus, X, UserPlus,
} from 'lucide-react';
import { LANGUAGE_FLAGS, LANGUAGE_LABELS } from '@/i18n/LanguageContext';
import { SignalPicker } from '@/components/forum/SignalPicker';
import { EmbeddedSignalCard } from '@/components/forum/EmbeddedSignalCard';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useForumChannels, useForumMessages, useDailyTopic, useDMConversations, useDirectMessages, ForumMessage } from '@/hooks/useForum';
import { useFavoriteUsers } from '@/hooks/useFavoriteUsers';
import { FavoriteUsersPanel } from '@/components/forum/FavoriteUsersPanel';
import { format } from 'date-fns';
import { useTranslation } from '@/i18n/LanguageContext';
import { useDateLocale } from '@/hooks/useDateLocale';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

type ForumView = 'channels' | 'chat' | 'dms' | 'dm-chat' | 'favorites';

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
  const [languageFilter, setLanguageFilter] = useState<string | null>(null);
  const [showLangFilter, setShowLangFilter] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { channels, loading: channelsLoading } = useForumChannels();
  const { messages, loading: msgsLoading, sendMessage, toggleReaction, reportMessage } = useForumMessages(selectedChannelId);
  const { topic, vote } = useDailyTopic();
  const { conversations, loading: convosLoading } = useDMConversations();
  const { messages: dmMessages, loading: dmLoading, sendDM } = useDirectMessages(dmPartnerId);
  const { favorites, loading: favsLoading, isFavorite, toggleFavorite } = useFavoriteUsers();

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

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede superar 5MB'); return; }
    const preview = URL.createObjectURL(file);
    setPendingImage({ file, preview });
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('forum-images').upload(path, file);
    if (error) { toast.error('Error al subir imagen'); return null; }
    const { data } = supabase.storage.from('forum-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSend = async () => {
    const text = messageInput.trim();
    if (!text && !pendingSignalId && !pendingImage) return;
    if (!user) { toast.error('Inicia sesión para enviar mensajes'); return; }

    let imageUrl: string | undefined;
    if (pendingImage) {
      setUploadingImage(true);
      const url = await uploadImage(pendingImage.file);
      setUploadingImage(false);
      if (!url) return;
      imageUrl = url;
      URL.revokeObjectURL(pendingImage.preview);
      setPendingImage(null);
    }

    if (view === 'chat') {
      await sendMessage(text || (imageUrl ? '📷 Imagen' : '📊 Señal compartida'), replyTo?.id, pendingSignalId || undefined, imageUrl);
    } else if (view === 'dm-chat') {
      await sendDM(text || '📷 Imagen');
    }
    setMessageInput('');
    setReplyTo(null);
    setPendingSignalId(null);
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
          {topic.image_url && (
            <img
              src={topic.image_url}
              alt={topic.title}
              className="w-full h-32 sm:h-40 object-cover"
              loading="lazy"
            />
          )}
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

      {/* Tabs: Channels / DMs / Favorites */}
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
        <button
          onClick={() => setView('favorites')}
          className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-colors",
            view === 'favorites' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}
        >
          <Star className="w-3.5 h-3.5 inline mr-1" /> Amigos
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
        <button
          onClick={() => setView('favorites')}
          className="flex-1 py-2 rounded-lg text-xs font-bold bg-secondary text-muted-foreground"
        >
          <Star className="w-3.5 h-3.5 inline mr-1" /> Amigos
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
    const filteredMessages = isDM || !languageFilter
      ? chatMessages
      : chatMessages.filter((msg: any) => msg.user_language === languageFilter);

    return (
      <div className="flex flex-col flex-1 min-h-0">
        {/* Chat header */}
        <div className="flex items-center gap-2 pb-2 sm:pb-3 border-b border-border mb-2">
          <button onClick={() => setView(isDM ? 'dms' : 'channels')} className="text-primary active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm sm:text-base font-bold text-foreground truncate">{title}</h2>
          {/* Language filter toggle - only in channel chat */}
          {!isDM && (
            <button
              onClick={() => setShowLangFilter(v => !v)}
              className={cn(
                "ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors active:scale-95",
                languageFilter
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <Globe className="w-3 h-3" />
              {languageFilter ? (LANGUAGE_FLAGS as any)[languageFilter] : '🌐'}
            </button>
          )}
          {isDM && (
            <span className="text-[10px] sm:text-xs text-muted-foreground ml-auto whitespace-nowrap">
              {chatMessages.length} msgs
            </span>
          )}
        </div>

        {/* Language filter bar */}
        {showLangFilter && !isDM && (
          <div className="flex gap-1.5 pb-3 pt-1 overflow-x-auto scrollbar-none -mx-1 px-1">
            <button
              onClick={() => { setLanguageFilter(null); setShowLangFilter(false); }}
              className={cn(
                "flex flex-col items-center justify-center min-w-[52px] h-[52px] rounded-xl text-[10px] font-bold whitespace-nowrap transition-all duration-200 active:scale-90",
                !languageFilter
                  ? "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[0_0_14px_hsl(var(--primary)/0.5)] border border-primary/70 ring-1 ring-primary/30"
                  : "bg-card text-muted-foreground border border-border hover:border-primary/40"
              )}
            >
              <span className="text-base leading-none mb-0.5">🌐</span>
              <span>Todos</span>
            </button>
            {(['es', 'en', 'pt', 'fr', 'it', 'de', 'nl', 'ar', 'mt'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => { setLanguageFilter(lang); setShowLangFilter(false); }}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[52px] h-[52px] rounded-xl text-[10px] font-bold whitespace-nowrap transition-all duration-200 active:scale-90",
                  languageFilter === lang
                    ? "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[0_0_14px_hsl(var(--primary)/0.5)] border border-primary/70 ring-1 ring-primary/30"
                    : "bg-card text-muted-foreground border border-border hover:border-primary/40"
                )}
              >
                <span className="text-lg leading-none mb-0.5">{(LANGUAGE_FLAGS as any)[lang]}</span>
                <span className="truncate max-w-[48px]">{(LANGUAGE_LABELS as any)[lang]}</span>
              </button>
            ))}
          </div>
        )}

        {/* Messages area */}
        <ScrollArea className="flex-1 pr-1 sm:pr-3">
          {chatLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-muted-foreground">
              <MessageCircle className="w-10 h-10 sm:w-14 sm:h-14 mb-2 opacity-40" />
              <p className="text-xs sm:text-sm">
                {languageFilter ? `No hay mensajes en ${(LANGUAGE_LABELS as any)[languageFilter]}` : 'No hay mensajes aún. ¡Sé el primero!'}
              </p>
              {languageFilter && (
                <button onClick={() => setLanguageFilter(null)} className="mt-2 text-xs text-primary underline">
                  Ver todos los idiomas
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 pb-2">
              {filteredMessages.map((msg: any) => {
                const isOwn = msg.user_id === user?.id || msg.sender_id === user?.id;
                const userName = isDM ? msg.sender_name : msg.user_name;
                const userAvatar = isDM ? msg.sender_avatar : msg.user_avatar;
                const msgId = msg.id;

                return (
                  <div key={msgId} className={cn("flex gap-2 sm:gap-3", isOwn && "flex-row-reverse")}>
                    {/* Avatar with popover for non-own users */}
                    {!isOwn && !isDM && user ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex-shrink-0 mt-1 active:scale-95 transition-transform">
                            <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                              <AvatarImage src={userAvatar || ''} />
                              <AvatarFallback className="bg-primary/20 text-primary text-[10px] sm:text-xs">{(userName || '?')[0]}</AvatarFallback>
                            </Avatar>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="right" align="start" className="w-44 p-2 space-y-1">
                          <p className="text-xs font-bold text-foreground px-2 py-1 truncate">{userName}</p>
                          <Separator />
                          <button
                            onClick={() => toggleFavorite(msg.user_id, msg.user_name || 'Usuario')}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-secondary transition-colors text-foreground"
                          >
                            <Star className={cn("w-3.5 h-3.5", isFavorite(msg.user_id) ? "text-yellow-500 fill-current" : "text-muted-foreground")} />
                            {isFavorite(msg.user_id) ? 'Quitar de amigos' : 'Agregar como amigo'}
                          </button>
                          <button
                            onClick={() => openDM(msg.user_id, msg.user_name || 'Usuario')}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-secondary transition-colors text-foreground"
                          >
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            Enviar mensaje
                          </button>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Avatar className="w-7 h-7 sm:w-8 sm:h-8 mt-1 flex-shrink-0">
                        <AvatarImage src={userAvatar || ''} />
                        <AvatarFallback className="bg-primary/20 text-primary text-[10px] sm:text-xs">{(userName || '?')[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn("max-w-[75%] sm:max-w-[65%] lg:max-w-[50%] space-y-1", isOwn && "items-end")}>
                      <div className="flex items-center gap-1.5">
                        {/* Tappable name for non-own users */}
                        {!isOwn && !isDM && user ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-[10px] font-semibold text-primary hover:underline active:scale-95 transition-transform">
                                {userName}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent side="bottom" align="start" className="w-44 p-2 space-y-1">
                              <p className="text-xs font-bold text-foreground px-2 py-1 truncate">{userName}</p>
                              <Separator />
                              <button
                                onClick={() => toggleFavorite(msg.user_id, msg.user_name || 'Usuario')}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-secondary transition-colors text-foreground"
                              >
                                <Star className={cn("w-3.5 h-3.5", isFavorite(msg.user_id) ? "text-yellow-500 fill-current" : "text-muted-foreground")} />
                                {isFavorite(msg.user_id) ? 'Quitar de amigos' : 'Agregar como amigo'}
                              </button>
                              <button
                                onClick={() => openDM(msg.user_id, msg.user_name || 'Usuario')}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-secondary transition-colors text-foreground"
                              >
                                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                Enviar mensaje
                              </button>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-[10px] font-semibold text-primary">{userName}</span>
                        )}
                        {!isDM && msg.user_language && (LANGUAGE_FLAGS as any)[msg.user_language] && (
                          <span className="text-[10px]" title={(LANGUAGE_LABELS as any)[msg.user_language]}>{(LANGUAGE_FLAGS as any)[msg.user_language]}</span>
                        )}
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
                        "px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm text-foreground leading-relaxed",
                        isOwn ? "bg-primary/20 rounded-tr-sm" : "bg-secondary rounded-tl-sm"
                      )}>
                        {msg.is_deleted ? (
                          <span className="italic text-muted-foreground">Mensaje eliminado</span>
                        ) : (
                          msg.content
                        )}
                      </div>

                      {/* Image attachment */}
                      {msg.image_url && !msg.is_deleted && (
                        <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block">
                          <img
                            src={msg.image_url}
                            alt="Imagen adjunta"
                            className="max-w-full rounded-lg border border-border max-h-48 sm:max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            loading="lazy"
                          />
                        </a>
                      )}

                      {/* Embedded signal card */}
                      {!isDM && msg.signal_id && (
                        <EmbeddedSignalCard signalId={msg.signal_id} />
                      )}

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
                          {/* Favorite user */}
                          {!isOwn && user && (
                            <button
                              onClick={() => toggleFavorite(msg.user_id, msg.user_name || 'Usuario')}
                              className={cn(
                                "transition-colors",
                                isFavorite(msg.user_id) ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
                              )}
                              title={isFavorite(msg.user_id) ? "Quitar de amigos" : "Agregar como amigo"}
                            >
                              <Star className={cn("w-3 h-3", isFavorite(msg.user_id) && "fill-current")} />
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

        {/* Pending signal preview */}
        {pendingSignalId && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border-t border-primary/20">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-primary flex-1">Señal adjunta</span>
            <button onClick={() => setPendingSignalId(null)} className="text-muted-foreground text-xs">✕</button>
          </div>
        )}

        {/* Pending image preview */}
        {pendingImage && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border-t border-primary/20">
            <img src={pendingImage.preview} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-border" />
            <span className="text-[10px] text-primary flex-1">Imagen adjunta</span>
            <button onClick={() => { URL.revokeObjectURL(pendingImage.preview); setPendingImage(null); }} className="text-muted-foreground text-xs">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Input */}
        <div className="flex gap-2 pt-2 sm:pt-3 border-t border-border bg-background/50 backdrop-blur-sm">
          {/* Image upload button */}
          {user && (
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 active:scale-95 transition-all disabled:opacity-40"
              title="Enviar imagen"
            >
              {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            </button>
          )}
          {/* Signal picker button - only in channel chat */}
          {!isDM && user && (
            <button
              onClick={() => setSignalPickerOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 active:scale-95 transition-all"
              title="Compartir señal"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          )}
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={user ? "Escribe un mensaje..." : "Inicia sesión para escribir"}
            disabled={!user}
            className="flex-1 h-9 sm:h-10 text-xs sm:text-sm bg-secondary border-border"
          />
          <button
            onClick={handleSend}
            disabled={!user || uploadingImage || (!messageInput.trim() && !pendingSignalId && !pendingImage)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Signal Picker Dialog */}
        <SignalPicker
          open={signalPickerOpen}
          onOpenChange={setSignalPickerOpen}
          onSelect={(signal) => {
            setPendingSignalId(signal.id);
            if (!messageInput.trim()) {
              setMessageInput(`📊 ${signal.currency_pair} ${signal.action} @ ${signal.entry_price}`);
            }
          }}
        />
      </div>
    );
  };

  const isInChat = view === 'chat' || view === 'dm-chat';

  return (
    <PageShell bottomPadding showBottomNav>
      <Header />
      <main className={cn("container space-y-4", isInChat ? "py-2 pb-0 flex flex-col overflow-hidden" : "py-4")}
        style={isInChat ? { height: 'calc(100dvh - 190px)' } : undefined}
      >
        {/* Title */}
        {(view === 'channels' || view === 'dms' || view === 'favorites') && (
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
        {view === 'favorites' && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2">
              <button onClick={() => setView('channels')} className="flex-1 py-2 rounded-lg text-xs font-bold bg-secondary text-muted-foreground">
                <Hash className="w-3.5 h-3.5 inline mr-1" /> Canales
              </button>
              <button onClick={() => setView('dms')} className="flex-1 py-2 rounded-lg text-xs font-bold bg-secondary text-muted-foreground">
                <Mail className="w-3.5 h-3.5 inline mr-1" /> Mensajes
              </button>
              <button className="flex-1 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground">
                <Star className="w-3.5 h-3.5 inline mr-1" /> Amigos
              </button>
            </div>
            <FavoriteUsersPanel
              favorites={favorites}
              loading={favsLoading}
              onOpenDM={(userId, name) => openDM(userId, name)}
              onRemove={(userId, name) => toggleFavorite(userId, name)}
            />
          </div>
        )}
        {(view === 'chat' || view === 'dm-chat') && renderChatView()}
      </main>
    </PageShell>
  );
}
