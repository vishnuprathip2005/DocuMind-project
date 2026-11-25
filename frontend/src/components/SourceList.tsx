import React from 'react';
import { FileText, Download } from 'lucide-react';
import { SourceItem } from '../types';
import { getDownloadUrl } from '../api/documents';

interface SourceListProps {
  sources: SourceItem[];
  onSelectSource?: (id: string) => void;
}

export const SourceList: React.FC<SourceListProps> = ({ sources, onSelectSource }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div style={{
      marginTop: '0.85rem',
      paddingTop: '0.75rem',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--text-muted)',
        marginBottom: '0.5rem',
      }}>
        <FileText size={13} color="#818cf8" />
        <span>Grounded in Sources:</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
        {sources.map((src) => (
          <div
            key={src.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              fontSize: '0.75rem',
              color: '#c7d2fe',
              transition: 'all 0.2s ease',
            }}
          >
            <span
              onClick={() => onSelectSource && onSelectSource(src.id)}
              style={{
                cursor: onSelectSource ? 'pointer' : 'default',
                fontWeight: 600,
              }}
              title={`View ${src.originalName}`}
            >
              {src.originalName}
            </span>

            <a
              href={getDownloadUrl(src.id)}
              download={src.originalName}
              title={`Download ${src.originalName}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: '#818cf8',
                opacity: 0.8,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
            >
              <Download size={11} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
