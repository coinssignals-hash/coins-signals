import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { GlowSection } from '@/components/ui/glow-section';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, FileText, Check, Clock, AlertCircle, Trash2, Loader2, ShieldCheck, Eye } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { useUserDocuments, type UserDocument } from '@/hooks/useUserDocuments';
import { useTranslation } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ACCENT = '187 72% 50%';

function getStatusBadge(status: string, t: (k: string) => string) {
  switch (status) {
    case 'verified':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'hsl(142 71% 45% / 0.15)', color: 'hsl(142 71% 45%)', border: '1px solid hsl(142 71% 45% / 0.2)' }}><Check className="w-3 h-3" />{t('doc_verified')}</span>;
    case 'pending':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'hsl(38 95% 55% / 0.15)', color: 'hsl(38 95% 55%)', border: '1px solid hsl(38 95% 55% / 0.2)' }}><Clock className="w-3 h-3" />{t('doc_pending')}</span>;
    case 'rejected':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'hsl(0 84% 60% / 0.15)', color: 'hsl(0 84% 60%)', border: '1px solid hsl(0 84% 60% / 0.2)' }}><AlertCircle className="w-3 h-3" />{t('doc_rejected')}</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-muted-foreground" style={{ background: 'hsl(var(--muted) / 0.3)', border: '1px solid hsl(var(--border))' }}><Upload className="w-3 h-3" />{t('doc_required')}</span>;
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
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `hsl(${ACCENT} / 0.04)`, border: `1px solid hsl(${ACCENT} / 0.1)` }}>
          <FileText className="w-5 h-5 shrink-0" style={{ color: `hsl(${ACCENT})` }} />
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
      <button className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-2"
        onClick={() => fileRef.current?.click()} disabled={uploading || latestDoc?.status === 'verified'}
        style={{
          background: `linear-gradient(165deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
          boxShadow: `0 0 15px hsl(${ACCENT} / 0.2)`,
        }}>
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {latestDoc?.status === 'verified' ? t('doc_verified_btn') : latestDoc?.status === 'pending' ? t('doc_resend') : t('doc_send')}
      </button>
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

      {/* ── Premium Hero Header ── */}
      <div className="relative overflow-hidden" style={{
        background: `linear-gradient(165deg, hsl(${ACCENT} / 0.15) 0%, hsl(var(--background)) 50%)`,
      }}>
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{
          background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.8), transparent)`,
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full opacity-20 pointer-events-none" style={{
          background: `radial-gradient(circle, hsl(${ACCENT} / 0.4), transparent 70%)`,
        }} />
        <div className="relative px-4 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <Link to="/settings" className="p-2 rounded-xl transition-all active:scale-95" style={{
              background: 'hsl(var(--muted) / 0.5)', backdropFilter: 'blur(8px)', border: `1px solid hsl(${ACCENT} / 0.15)`,
            }}>
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </Link>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
              background: `linear-gradient(165deg, hsl(${ACCENT} / 0.25), hsl(${ACCENT} / 0.08))`,
              border: `1px solid hsl(${ACCENT} / 0.3)`, boxShadow: `0 0 20px hsl(${ACCENT} / 0.15)`,
            }}>
              <FileText className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: `hsl(${ACCENT} / 0.5)` }}>{t('doc_kyc')}</p>
              <h1 className="text-lg font-bold text-foreground">{t('doc_title')}</h1>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl" style={{
              background: verifiedCount === DOCUMENT_SECTIONS.length ? 'hsl(142 71% 45% / 0.1)' : `hsl(${ACCENT} / 0.06)`,
              border: `1px solid ${verifiedCount === DOCUMENT_SECTIONS.length ? 'hsl(142 71% 45% / 0.2)' : `hsl(${ACCENT} / 0.15)`}`,
            }}>
              <ShieldCheck className="w-4 h-4" style={{ color: verifiedCount === DOCUMENT_SECTIONS.length ? 'hsl(142 71% 45%)' : `hsl(${ACCENT})` }} />
              <span className="text-sm font-bold text-foreground">{verifiedCount}/{DOCUMENT_SECTIONS.length}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 py-4 space-y-4">
        {!isAuthenticated && (
          <GlowSection color="0 84% 60%">
            <div className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5" style={{ color: 'hsl(0 84% 60%)' }} />
              <div>
                <p className="text-sm font-medium text-foreground">{t('doc_login_required')}</p>
                <Link to="/auth" className="text-xs font-bold hover:underline" style={{ color: `hsl(${ACCENT})` }}>{t('doc_login_link')}</Link>
              </div>
            </div>
          </GlowSection>
        )}

        <Accordion type="single" collapsible value={expandedSection} onValueChange={setExpandedSection}>
          {DOCUMENT_SECTIONS.map((section) => {
            const latestDoc = getLatestByType(section.key);
            const statusIcon = latestDoc?.status === 'verified' ? <Check className="w-4 h-4" style={{ color: 'hsl(142 71% 45%)' }} /> :
              latestDoc?.status === 'pending' ? <Clock className="w-4 h-4" style={{ color: 'hsl(38 95% 55%)' }} /> :
                latestDoc?.status === 'rejected' ? <AlertCircle className="w-4 h-4 text-destructive" /> : null;
            return (
              <AccordionItem key={section.key} value={section.key} className="border-none mb-3">
                <GlowSection color={ACCENT}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
                      <span className="font-medium text-sm">{section.label}</span>
                      <div className="ml-auto mr-2">{statusIcon}</div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <DocumentUploadSection section={section} latestDoc={latestDoc} uploading={uploading} onUpload={handleUpload} t={t} />
                  </AccordionContent>
                </GlowSection>
              </AccordionItem>
            );
          })}
        </Accordion>

        <GlowSection color={ACCENT}>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
              <span className="text-sm font-semibold text-foreground">{t('doc_history')}</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: `hsl(${ACCENT})` }} /></div>
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('doc_no_docs')}</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: `hsl(${ACCENT} / 0.04)`, border: `1px solid hsl(${ACCENT} / 0.1)` }}>
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
                      <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors" onClick={() => handlePreview(doc)}><Eye className="w-4 h-4 text-muted-foreground" /></button>
                      {doc.status !== 'verified' && (
                        <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors" onClick={() => deleteDocument(doc)}><Trash2 className="w-4 h-4 text-destructive" /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlowSection>
      </main>
    </PageShell>
  );
}
