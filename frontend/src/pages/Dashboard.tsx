import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { StatsBar } from '../components/StatsBar';
import { UploadPanel } from '../components/UploadPanel';
import { DocumentList } from '../components/DocumentList';
import { ChatPanel } from '../components/ChatPanel';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { DocumentMetadata, HealthStatus } from '../types';
import { fetchDocuments, deleteDocument, getDocumentDetails } from '../api/documents';
import { fetchHealth } from '../api/chat';

export const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentMetadata | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<DocumentMetadata | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, text }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadHealth = useCallback(async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err: any) {
      addToast('error', err.detail || 'Failed to load documents.');
    } finally {
      setIsLoadingDocs(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadHealth();
    loadDocuments();
  }, [loadHealth, loadDocuments]);

  const handleRefresh = async () => {
    await Promise.all([loadHealth(), loadDocuments()]);
    addToast('info', 'Repository and assistant status synchronized.');
  };

  const handleUploadSuccess = (newDoc: DocumentMetadata) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
    addToast('success', `"${newDoc.originalName}" uploaded and indexed successfully.`);
  };

  const handleConfirmDelete = async () => {
    if (!deleteDoc) return;
    setIsDeleting(true);

    try {
      await deleteDocument(deleteDoc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteDoc.id));
      addToast('success', `"${deleteDoc.originalName}" was deleted.`);
      if (previewDoc?.id === deleteDoc.id) {
        setPreviewDoc(null);
      }
      setDeleteDoc(null);
    } catch (err: any) {
      addToast('error', err.detail || 'Failed to delete document.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectSource = async (id: string) => {
    const found = documents.find((d) => d.id === id);
    if (found) {
      setPreviewDoc(found);
    } else {
      try {
        const detail = await getDocumentDetails(id);
        setPreviewDoc(detail);
      } catch (err: any) {
        addToast('error', 'Source document could not be previewed.');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        health={health}
        isLoading={isLoadingDocs}
        onRefresh={handleRefresh}
      />

      <main style={{
        flex: 1,
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '1.5rem 2rem 3rem',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Metric Summary Ribbon */}
        <StatsBar
          documents={documents}
          maxUploadMb={health?.maxUploadSizeMb || 10}
        />

        {/* 2-Column Responsive Workspace Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '1.75rem',
          alignItems: 'start',
          flex: 1,
        }}>
          {/* Left Column: Document Repository Hub */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <UploadPanel
              maxUploadMb={health?.maxUploadSizeMb || 10}
              onUploadSuccess={handleUploadSuccess}
              onError={(msg) => addToast('error', msg)}
            />

            <DocumentList
              documents={documents}
              isLoading={isLoadingDocs}
              onPreview={(doc) => setPreviewDoc(doc)}
              onRequestDelete={(doc) => setDeleteDoc(doc)}
            />
          </section>

          {/* Right Column: AI Assistant Chat Hub */}
          <section style={{ height: 'calc(100vh - 220px)', minHeight: '620px', position: 'sticky', top: '5.5rem' }}>
            <ChatPanel
              health={health}
              hasDocuments={documents.length > 0}
              onSelectSource={handleSelectSource}
              onError={(msg) => addToast('error', msg)}
            />
          </section>
        </div>
      </main>

      {/* Document Text Preview Modal */}
      <DocumentPreviewModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        document={deleteDoc}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDoc(null)}
      />

      {/* Floating Toast Notification Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
      />
    </div>
  );
};
