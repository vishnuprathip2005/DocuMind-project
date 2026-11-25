import React from 'react';
import { Files, HardDrive, ShieldCheck, Zap } from 'lucide-react';
import { DocumentMetadata } from '../types';

interface StatsBarProps {
  documents: DocumentMetadata[];
  maxUploadMb: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ documents, maxUploadMb }) => {
  const totalBytes = documents.reduce((acc, doc) => acc + doc.sizeBytes, 0);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      margin: '1.25rem 0',
    }}>
      {/* Metric 1: Total Documents */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1.15rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(99, 102, 241, 0.15)',
          color: '#818cf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Files size={18} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Documents</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {documents.length} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>files</span>
          </div>
        </div>
      </div>

      {/* Metric 2: Storage Used */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1.15rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(6, 182, 212, 0.15)',
          color: '#22d3ee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <HardDrive size={18} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Storage Volume</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatSize(totalBytes)}
          </div>
        </div>
      </div>

      {/* Metric 3: Supported Formats */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1.15rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ShieldCheck size={18} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Supported Formats</div>
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>.TXT</span>
            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>.MD</span>
            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>.JSON</span>
          </div>
        </div>
      </div>

      {/* Metric 4: Limit & Security */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1.15rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Zap size={18} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Max File Size</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {maxUploadMb || 10} MB <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>per file</span>
          </div>
        </div>
      </div>
    </div>
  );
};
