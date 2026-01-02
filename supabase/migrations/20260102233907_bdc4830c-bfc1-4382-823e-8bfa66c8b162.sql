-- Create table for storing AI analysis history for signals
CREATE TABLE public.signal_ai_analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID NOT NULL REFERENCES public.trading_signals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  analysis_text TEXT NOT NULL,
  confidence_level INTEGER,
  recommendation TEXT,
  risk_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_signal_ai_history_signal_id ON public.signal_ai_analysis_history(signal_id);
CREATE INDEX idx_signal_ai_history_created_at ON public.signal_ai_analysis_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.signal_ai_analysis_history ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read analysis history (signals are public)
CREATE POLICY "Anyone can view signal AI analysis history"
ON public.signal_ai_analysis_history
FOR SELECT
USING (true);

-- Allow authenticated users to create analysis history
CREATE POLICY "Authenticated users can create analysis history"
ON public.signal_ai_analysis_history
FOR INSERT
WITH CHECK (true);

-- Allow users to delete their own analysis
CREATE POLICY "Users can delete their own analysis"
ON public.signal_ai_analysis_history
FOR DELETE
USING (auth.uid() = user_id);