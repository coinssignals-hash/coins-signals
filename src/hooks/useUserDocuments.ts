import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: string;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

const ACCEPTED_TYPES = ['image/gif', 'image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function useUserDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
    } else {
      setDocuments((data as unknown as UserDocument[]) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = useCallback(async (file: File, documentType: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'Debes iniciar sesión', variant: 'destructive' });
      return false;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: 'Formato no válido', description: 'Solo se aceptan GIF, JPG, PNG y PDF', variant: 'destructive' });
      return false;
    }

    if (file.size > MAX_SIZE) {
      toast({ title: 'Archivo muy grande', description: 'El tamaño máximo es 5MB', variant: 'destructive' });
      return false;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/${documentType}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast({ title: 'Error al subir', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return false;
    }

    const { error: insertError } = await supabase
      .from('user_documents')
      .insert({
        user_id: user.id,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending',
      } as any);

    if (insertError) {
      console.error('Insert error:', insertError);
      toast({ title: 'Error al registrar', description: insertError.message, variant: 'destructive' });
      setUploading(false);
      return false;
    }

    toast({ title: '¡Documento enviado!', description: 'Tu documento está en revisión.' });
    await fetchDocuments();
    setUploading(false);
    return true;
  }, [user, fetchDocuments]);

  const deleteDocument = useCallback(async (doc: UserDocument) => {
    if (!user) return;

    await supabase.storage.from('user-documents').remove([doc.file_path]);
    await supabase.from('user_documents').delete().eq('id', doc.id as any);
    toast({ title: 'Documento eliminado' });
    await fetchDocuments();
  }, [user, fetchDocuments]);

  const getDocumentsByType = useCallback((type: string) => {
    return documents.filter(d => d.document_type === type);
  }, [documents]);

  const getLatestByType = useCallback((type: string) => {
    const docs = getDocumentsByType(type);
    return docs.length > 0 ? docs[0] : null;
  }, [getDocumentsByType]);

  return {
    documents,
    loading,
    uploading,
    uploadDocument,
    deleteDocument,
    getDocumentsByType,
    getLatestByType,
    refetch: fetchDocuments,
  };
}
