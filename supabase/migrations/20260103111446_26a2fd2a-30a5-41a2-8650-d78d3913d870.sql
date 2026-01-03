-- Add whatsapp_number column to profiles for WhatsApp notifications
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- Add whatsapp_notifications_enabled column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled boolean DEFAULT false;