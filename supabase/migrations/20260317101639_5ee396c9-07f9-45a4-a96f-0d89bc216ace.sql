
DROP POLICY "Service can manage AI analysis cache" ON public.ai_analysis_cache;
CREATE POLICY "Service can manage AI analysis cache"
ON public.ai_analysis_cache FOR ALL
TO service_role
USING (true) WITH CHECK (true);

DROP POLICY "Service can manage news AI analysis cache" ON public.news_ai_analysis_cache;
CREATE POLICY "Service can manage news AI analysis cache"
ON public.news_ai_analysis_cache FOR ALL
TO service_role
USING (true) WITH CHECK (true);
