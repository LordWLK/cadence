'use client';

import { useState, useEffect } from 'react';
import { MoodSelector } from './MoodSelector';
import { EnergySlider } from './EnergySlider';
import { PhotoOCR } from './PhotoOCR';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCheckins } from '@/lib/hooks/useCheckins';
import { Sun, Moon, Send, AlertCircle } from 'lucide-react';

interface CheckinFormProps {
  onSuccess?: () => void;
}

export function CheckinForm({ onSuccess }: CheckinFormProps) {
  const { create, loading, error: hookError } = useCheckins();
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(5);
  const [note, setNote] = useState('');
  const [type, setType] = useState<'morning' | 'evening'>('morning');
  const [coherenceWarning, setCoherenceWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    setType(hour < 14 ? 'morning' : 'evening');
  }, []);

  useEffect(() => {
    if (mood >= 4 && energy <= 3) {
      setCoherenceWarning("Tu te sens bien mais ton energie est basse. Prends soin de toi !");
    } else if (mood <= 2 && energy >= 8) {
      setCoherenceWarning("Beaucoup d'energie mais le moral est bas. Qu'est-ce qui se passe ?");
    } else {
      setCoherenceWarning(null);
    }
  }, [mood, energy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const result = await create({
      type,
      mood,
      energy,
      note: note.trim() || null,
      date: new Date().toISOString().split('T')[0],
    });
    if (result) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 1500);
    } else {
      setSubmitError(hookError ?? "Impossible d'enregistrer. Verifie ta connexion et ta configuration Supabase.");
    }
  };

  const isMorning = type === 'morning';

  if (success) {
    return (
      <Card className="text-center py-8 space-y-3">
        <div className="text-4xl">{mood >= 4 ? '✨' : mood >= 3 ? '👍' : '💪'}</div>
        <p className="font-medium">Check-in enregistre !</p>
        <p className="text-sm text-text-muted">
          {isMorning ? "Bonne journee !" : "Bonne nuit !"}
        </p>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('morning')}
          style={isMorning ? {
            backgroundColor: 'color-mix(in srgb, #7c3aed 12%, transparent)',
            color: '#7c3aed',
            outline: '1px solid color-mix(in srgb, #7c3aed 30%, transparent)',
          } : {
            backgroundColor: 'var(--color-surface-elevated)',
            color: 'var(--color-text-muted)',
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all flex-1"
        >
          <Sun size={16} />
          <span className="text-sm font-medium">Matin</span>
        </button>
        <button
          type="button"
          onClick={() => setType('evening')}
          style={!isMorning ? {
            backgroundColor: 'color-mix(in srgb, #4f46e5 12%, transparent)',
            color: '#4f46e5',
            outline: '1px solid color-mix(in srgb, #4f46e5 30%, transparent)',
          } : {
            backgroundColor: 'var(--color-surface-elevated)',
            color: 'var(--color-text-muted)',
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all flex-1"
        >
          <Moon size={16} />
          <span className="text-sm font-medium">Soir</span>
        </button>
      </div>

      <Card>
        <div className="space-y-6">
          <MoodSelector value={mood} onChange={setMood} />
          <EnergySlider value={energy} onChange={setEnergy} />

          {coherenceWarning && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 text-warning text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{coherenceWarning}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-text-muted">
                {isMorning ? "Ton intention pour la journee" : "Qu'est-ce que t'as compris aujourd'hui ?"}
              </label>
              <PhotoOCR
                onTextExtracted={(text) => {
                  setNote((prev) => prev ? `${prev}\n${text}` : text);
                }}
                disabled={loading}
              />
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isMorning ? "Aujourd'hui je veux..." : "Aujourd'hui j'ai compris que..."}
              rows={3}
              className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
            />
          </div>
        </div>
      </Card>

      {submitError && (
        <div className="flex items-start gap-2 p-3 rounded-xl text-sm"
             style={{ backgroundColor: 'color-mix(in srgb, #ef4444 10%, transparent)', color: '#ef4444' }}>
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        <Send size={16} />
        {loading ? 'Enregistrement...' : 'Enregistrer mon check-in'}
      </Button>
    </form>
  );
}
