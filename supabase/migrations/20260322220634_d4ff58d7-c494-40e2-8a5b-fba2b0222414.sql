
-- Performance indices for high-traffic tables

-- trading_signals
CREATE INDEX IF NOT EXISTS idx_trading_signals_status ON public.trading_signals(status);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON public.trading_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_signals_currency_pair ON public.trading_signals(currency_pair);
CREATE INDEX IF NOT EXISTS idx_trading_signals_status_created ON public.trading_signals(status, created_at DESC);

-- forum_messages
CREATE INDEX IF NOT EXISTS idx_forum_messages_channel_created ON public.forum_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_messages_user ON public.forum_messages(user_id);

-- forum_reactions
CREATE INDEX IF NOT EXISTS idx_forum_reactions_message ON public.forum_reactions(message_id);

-- favorite_signals
CREATE INDEX IF NOT EXISTS idx_favorite_signals_user ON public.favorite_signals(user_id);

-- imported_trades
CREATE INDEX IF NOT EXISTS idx_imported_trades_user_entry ON public.imported_trades(user_id, entry_time DESC);

-- ai_analysis_cache
CREATE INDEX IF NOT EXISTS idx_ai_cache_symbol_type ON public.ai_analysis_cache(symbol, analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON public.ai_analysis_cache(expires_at);

-- market_data_cache
CREATE INDEX IF NOT EXISTS idx_market_cache_key ON public.market_data_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_market_cache_expires ON public.market_data_cache(expires_at);

-- news_ai_analysis_cache
CREATE INDEX IF NOT EXISTS idx_news_ai_cache_news_id ON public.news_ai_analysis_cache(news_id);

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_alias ON public.profiles(alias);

-- course_progress
CREATE INDEX IF NOT EXISTS idx_course_progress_user ON public.course_progress(user_id);

-- api_usage_logs
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON public.api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_function ON public.api_usage_logs(function_name);

-- push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);

-- positions
CREATE INDEX IF NOT EXISTS idx_positions_user ON public.positions(user_id);

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
