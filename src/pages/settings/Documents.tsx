import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, FileText, Check, Clock, AlertCircle, Trash2, Loader2, ShieldCheck, Eye } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useUserDocuments, type UserDocument } from '@/hooks/useUserDocuments';
import { useTranslation } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function getStatusBadge(status: string, t: (k: string) => string) {
  switch (status) {
    case 'verified':
      return <Badge className="bg-primary/20 text-primary border-0"><Check className="w-3 h-3 mr-1" />{t('doc_verified')}</Badge>;
    case 'pending':
      return <Badge className="bg-accent/20 text-accent border-0"><Clock className="w-3 h-3 mr-1" />{t('doc_pending')}</Badge>;
    case 'rejected':
      return <Badge className="bg-destructive/20 text-destructive border-0"><AlertCircle className="w-3 h-3 mr-1" />{t('doc_rejected')}</Badge>;
    default:
      return <Badge className="bg-muted text-muted-foreground border-0"><Upload className="w-3 h-3 mr-1" />{t('doc_required')}</Badge>;
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentUploadSection({ section, latestDoc, uploading, onUpload, t }: {
  section: { key: string; label: string; description: string };
  latestDoc: UserDocument | null;
  uploading: boolean;
  onUpload: (file: File, type: string) => void;
  t: (k: string) => string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { onUpload(file, section.key); e.target.value = ''; }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('doc_formats')}</p>
      <p className="text-sm text-foreground">{section.description}</p>
      {latestDoc && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
          <FileText className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{latestDoc.file_name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(latestDoc.file_size)}</p>
          </div>
          {getStatusBadge(latestDoc.status, t)}
        </div>
      )}
      {latestDoc?.status === 'rejected' && latestDoc.review_notes && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive font-medium">{t('doc_rejection_reason')}</p>
          <p className="text-xs text-destructive/80 mt-1">{latestDoc.review_notes}</p>
        </div>
      )}
      <input ref={fileRef} type="file" accept=".gif,.jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFileChange} />
      <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => fileRef.current?.click()} disabled={uploading || latestDoc?.status === 'verified'}>
        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
        {latestDoc?.status === 'verified' ? t('doc_verified_btn') : latestDoc?.status === 'pending' ? t('doc_resend') : t('doc_send')}
      </Button>
    </div>
  );
}

export default function Documents() {
  const [expandedSection, setExpandedSection] = useState<string>('');
  const { user, isAuthenticated } = useAuth();
  const { documents, loading, uploading, uploadDocument, deleteDocument, getLatestByType } = useUserDocuments();
  const { t } = useTranslation();

  const DOCUMENT_SECTIONS = [
    { key: 'identity', label: t('doc_identity'), description: t('doc_identity_desc') },
    { key: 'residence', label: t('doc_residence'), description: t('doc_residence_desc') },
    { key: 'legal', label: t('doc_legal'), description: t('doc_legal_desc') },
  ];

  const handleUpload = async (file: File, type: string) => { await uploadDocument(file, type); };
  const handlePreview = async (doc: UserDocument) => {
    const { data } = await supabase.storage.from('user-documents').createSignedUrl(doc.file_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const verifiedCount = DOCUMENT_SECTIONS.filter(s => getLatestByType(s.key)?.status === 'verified').length;

  return (
    <PageShell>
      <Header />
      <main className="py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/settings"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div className="flex-1">
            <span className="text-xs text-muted-foreground">{t('doc_kyc')}</span>
            <h1 className="text-xl font-bold text-foreground">{t('doc_title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${verifiedCount === DOCUMENT_SECTIONS.length ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium text-foreground">{verifiedCount}/{DOCUMENT_SECTIONS.length}</span>
          </div>
        </div>

        {!isAuthenticated && (
          <Card className="bg-destructive/10 border-destructive/20 mb-4">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-foreground">{t('doc_login_required')}</p>
                <Link to="/auth" className="text-xs text-primary hover:underline">{t('doc_login_link')}</Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <Accordion type="single" collapsible value={expandedSection} onValueChange={setExpandedSection}>
            {DOCUMENT_SECTIONS.map((section) => {
              const latestDoc = getLatestByType(section.key);
              const statusIcon = latestDoc?.status === 'verified' ? <Check className="w-4 h-4 text-primary" /> :
                latestDoc?.status === 'pending' ? <Clock className="w-4 h-4 text-accent" /> :
                  latestDoc?.status === 'rejected' ? <AlertCircle className="w-4 h-4 text-destructive" /> : null;
              return (
                <AccordionItem key={section.key} value={section.key} className="border-border mb-3">
                  <Card className="bg-card border-border">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="font-medium">{section.label}</span>
                        <div className="ml-auto mr-2">{statusIcon}</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <DocumentUploadSection section={section} latestDoc={latestDoc} uploading={uploading} onUpload={handleUpload} t={t} />
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>

          <Card className="bg-card border-border mt-6">
            <CardHeader><CardTitle className="text-sm text-primary">{t('doc_history')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : documents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t('doc_no_docs')}</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {DOCUMENT_SECTIONS.find(s => s.key === doc.document_type)?.label || doc.document_type}
                        {' · '}{formatFileSize(doc.file_size)}
                      </p>
                      <p className="text-xs text-muted-foreground">{format(new Date(doc.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(doc.status, t)}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePreview(doc)}><Eye className="w-4 h-4 text-muted-foreground" /></Button>
                      {doc.status !== 'verified' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteDocument(doc)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </PageShell>
  );
}