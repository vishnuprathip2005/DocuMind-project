import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Loader2 } from 'lucide-react';
import { uploadDocument } from '../api/documents';
import { DocumentMetadata } from '../types';

interface UploadPanelProps {
  maxUploadMb: number;
  onUploadSuccess: (newDoc: DocumentMetadata) => void;
  onError: (message: string) => void;
}

const SUPPORTED_EXTS = ['.txt', '.md', '.json'];

export const UploadPanel: React.FC<UploadPanelProps> = ({
  maxUploadMb,
  onUploadSuccess,
  onError,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccessName, setUploadSuccessName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = async (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_EXTS.includes(ext)) {
      onError(`Unsupported format "${ext}". Please upload .txt, .md, or .json.`);
      return;
    }

    if (file.size === 0) {
      onError('The selected file is empty (0 bytes).');
      return;
    }

    const maxBytes = maxUploadMb * 1024 * 1024;
    if (file.size > maxBytes) {
      onError(`File exceeds size limit of ${maxUploadMb} MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    setIsUploading(true);
    setSelectedFile(file);

    try {
      const doc = await uploadDocument(file);
      setUploadSuccessName(file.name);
      onUploadSuccess(doc);
      setTimeout(() => {
        setUploadSuccessName(null);
        setSelectedFile(null);
      }, 3500);
    } catch (err: any) {
      onError(err.detail || 'Upload failed. Please try again.');
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.12)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '1.75rem 1.5rem',
      textAlign: 'center',
      position: 'relative',
      transition: 'all 0.25s ease',
      boxShadow: isDragging ? 'var(--shadow-glow)' : 'none',
      backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
    }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={isUploading}
      />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        {/* Upload Icon */}
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: isDragging ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isDragging ? '#818cf8' : 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
          transition: 'all 0.2s ease',
        }}>
          {isUploading ? (
            <Loader2 size={26} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          ) : uploadSuccessName ? (
            <CheckCircle2 size={26} color="#34d399" />
          ) : (
            <UploadCloud size={26} />
          )}
        </div>

        {/* Status / Call to Action */}
        <div>
          {isUploading ? (
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#818cf8' }}>
                Extracting & Storing Document...
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {selectedFile?.name}
              </p>
            </div>
          ) : uploadSuccessName ? (
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#34d399' }}>
                Uploaded Successfully!
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {uploadSuccessName} is ready for queries
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Drag & Drop file here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    color: '#818cf8',
                    textDecoration: 'underline',
                    fontWeight: 700,
                    background: 'transparent',
                    fontSize: 'inherit',
                  }}
                >
                  Browse Files
                </button>
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Accepts <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>.txt, .md, .json</span> up to {maxUploadMb} MB
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
