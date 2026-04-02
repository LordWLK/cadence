'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, X, Loader2, RotateCcw, Check, Image } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PhotoOCRProps {
  onTextExtracted: (text: string) => void;
  onPhotoReady: (file: File) => void;
  disabled?: boolean;
}

type OCRStatus = 'idle' | 'processing' | 'done' | 'error';

export function PhotoOCR({ onTextExtracted, onPhotoReady, disabled }: PhotoOCRProps) {
  const [status, setStatus] = useState<OCRStatus>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [photoSaved, setPhotoSaved] = useState(false);
  const [textUsed, setTextUsed] = useState(false);
  const currentFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    currentFileRef.current = file;
    setPhotoSaved(false);
    setTextUsed(false);

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setStatus('processing');
    setProgress(0);
    setErrorMsg('');
    setExtractedText('');

    try {
      const Tesseract = await import('tesseract.js');

      const result = await Tesseract.recognize(file, 'fra', {
        logger: (info: { status: string; progress: number }) => {
          if (info.status === 'recognizing text') {
            setProgress(Math.round(info.progress * 100));
          }
        },
      });

      const text = result.data.text.trim();

      if (!text) {
        setStatus('error');
        setErrorMsg('Aucun texte detecte. Tu peux quand meme enregistrer la photo.');
        return;
      }

      setExtractedText(text);
      setStatus('done');
    } catch (err) {
      console.error('OCR error:', err);
      setStatus('error');
      setErrorMsg('Erreur lors de la reconnaissance. Tu peux quand meme enregistrer la photo.');
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleConfirmText = () => {
    onTextExtracted(extractedText);
    setTextUsed(true);
  };

  const handleSavePhoto = () => {
    if (currentFileRef.current) {
      onPhotoReady(currentFileRef.current);
      setPhotoSaved(true);
    }
  };

  const reset = () => {
    setStatus('idle');
    setPreview(null);
    setExtractedText('');
    setProgress(0);
    setErrorMsg('');
    setPhotoSaved(false);
    setTextUsed(false);
    currentFileRef.current = null;
  };

  // ─── Idle state ──────────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={handleCapture}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
            color: 'var(--color-primary)',
          }}
          aria-label="Prendre une photo pour scanner du texte ou enregistrer"
        >
          <Camera size={14} />
          Photo
        </button>
      </>
    );
  }

  // ─── Processing / Done / Error ─────────────────────────────────────────
  return (
    <div
      className="rounded-xl p-3 space-y-3"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">
          {status === 'processing' && 'Reconnaissance en cours...'}
          {status === 'done' && 'Texte reconnu'}
          {status === 'error' && 'Scan echoue'}
        </span>
        <button
          type="button"
          onClick={reset}
          className="p-1 rounded-lg hover:bg-surface-alt transition-colors text-text-dim"
          aria-label="Fermer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Image preview */}
      {preview && (
        <div className="flex gap-3">
          <img
            src={preview}
            alt="Photo capturee"
            className="w-16 h-16 rounded-lg object-cover shrink-0"
            style={{ border: '1px solid var(--color-border)' }}
          />
          <div className="flex-1 min-w-0">
            {/* Progress bar */}
            {status === 'processing' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  <span className="text-xs text-text-muted">{progress}%</span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--color-surface-alt)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: 'var(--color-primary)',
                    }}
                  />
                </div>
                <p className="text-[10px] text-text-dim">
                  Premier scan : telechargement du modele (~2 Mo)
                </p>
              </div>
            )}

            {/* Extracted text */}
            {status === 'done' && (
              <p className="text-xs text-text leading-relaxed line-clamp-3">
                {extractedText}
              </p>
            )}

            {/* Error */}
            {status === 'error' && (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {errorMsg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {/* Use text button (only when OCR succeeded) */}
        {status === 'done' && !textUsed && (
          <Button type="button" size="sm" onClick={handleConfirmText} className="flex-1">
            <Check size={14} />
            Utiliser le texte
          </Button>
        )}
        {status === 'done' && textUsed && (
          <span className="flex items-center gap-1 text-[11px] text-[var(--color-success)] px-2">
            <Check size={12} /> Texte ajoute
          </span>
        )}

        {/* Save photo button (always available when we have a photo) */}
        {(status === 'done' || status === 'error') && !photoSaved && (
          <Button type="button" size="sm" variant="secondary" onClick={handleSavePhoto}>
            <Image size={14} />
            Enregistrer la photo
          </Button>
        )}
        {photoSaved && (
          <span className="flex items-center gap-1 text-[11px] text-[var(--color-success)] px-2">
            <Check size={12} /> Photo enregistree
          </span>
        )}

        {/* Retry */}
        {(status === 'done' || status === 'error') && (
          <Button type="button" variant="ghost" size="sm" onClick={handleCapture}>
            <RotateCcw size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
