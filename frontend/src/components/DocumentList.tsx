import React, { useState } from 'react';
import { 
  FileText, 
  Code, 
  FileCode, 
  Download, 
  Trash2, 
  Eye, 
  Search, 
  Clock, 
  HardDrive,
  FolderOpen,
  ExternalLink
} from 'lucide-react';
import { DocumentMetadata } from '../types';
import { getDownloadUrl, getViewUrl } from '../api/documents';

interface DocumentListProps {
  documents: DocumentMetadata[];
  isLoading: boolean;
  onPreview: (doc: DocumentMetadata) => void;
  onRequestDelete: (doc: DocumentMetadata) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  onPreview,
  onRequestDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getFormatDetails = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'json') {
      return {
        label: 'JSON',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        badgeColor: '#fbbf24',
        icon: <Code size={18} color="#fbbf24" />,
      };
    }
    if (ext === 'md') {
      return {
        label: 'MD',
        badgeBg: 'rgba(6, 182, 212, 0.15)',
        badgeColor: '#22d3ee',
        icon: <FileCode size={18} color="#22d3ee" />,
      };
    }
    return {
      label: 'TXT',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeColor: '#34d399',
      icon: <FileText size={18} color="#34d399" />,
    };
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedFormat === 'ALL') return true;
    const ext = doc.originalName.split('.').pop()?.toUpperCase() || '';
    return ext === selectedFormat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Search and Filters Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Document Repository
          </h2>
          <span style={{
            fontSize: '0.75rem',
            padding: '0.1rem 0.5rem',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--text-secondary)',
            fontWeight: 600,
          }}>
            {filteredDocs.length}
          </span>
        </div>

        {/* Format Selector Pills */}
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '0.2rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}>
          {['ALL', 'TXT', 'MD', 'JSON'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: selectedFormat === fmt ? 'var(--accent-primary)' : 'transparent',
                color: selectedFormat === fmt ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Search input */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '0.85rem',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter documents by name..."
          style={{
            width: '100%',
            padding: '0.65rem 0.85rem 0.65rem 2.4rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              position: 'absolute',
              right: '0.85rem',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Document Items List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        maxHeight: '480px',
        overflowY: 'auto',
        paddingRight: '0.2rem',
      }}>
        {isLoading && documents.length === 0 ? (
          <div style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
          }}>
            Loading repository files...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}>
              <FolderOpen size={22} />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {searchTerm ? 'No matching documents found' : 'No documents uploaded yet'}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {searchTerm ? 'Try adjusting your search filter.' : 'Upload a .txt, .md, or .json file above to start.'}
              </p>
            </div>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const fmt = getFormatDetails(doc.originalName);

            return (
              <div
                key={doc.id}
                className="animate-fade-in"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                }}
              >
                {/* File info (clickable to view) */}
                <div 
                  onClick={() => onPreview(doc)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1, cursor: 'pointer' }}
                  title="Click to view extracted text and details"
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    background: fmt.badgeBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {fmt.icon}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        title={doc.originalName}
                        style={{
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textDecoration: 'none',
                        }}
                      >
                        {doc.originalName}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        background: fmt.badgeBg,
                        color: fmt.badgeColor,
                        flexShrink: 0,
                      }}>
                        {fmt.label}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginTop: '0.2rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <HardDrive size={12} />
                        {formatSize(doc.sizeBytes)}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} />
                        {formatDate(doc.uploadedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                  {/* Explicit View Button */}
                  <button
                    onClick={() => onPreview(doc)}
                    title="View extracted text & details"
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      color: '#ffffff',
                      background: 'rgba(99, 102, 241, 0.25)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
                    }}
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>

                  {/* Open Raw in New Tab */}
                  <a
                    href={getViewUrl(doc.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open original file in new browser tab"
                    style={{
                      padding: '0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#38bdf8';
                      e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                  >
                    <ExternalLink size={15} />
                  </a>

                  {/* Download Button */}
                  <a
                    href={getDownloadUrl(doc.id)}
                    download={doc.originalName}
                    title="Download original file"
                    style={{
                      padding: '0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#22d3ee';
                      e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                  >
                    <Download size={15} />
                  </a>

                  {/* Delete Button */}
                  <button
                    onClick={() => onRequestDelete(doc)}
                    title="Delete document"
                    style={{
                      padding: '0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#fb7185';
                      e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
