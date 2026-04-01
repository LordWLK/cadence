import type { Checkin } from '@/lib/supabase/types';
import { MOOD_LABELS } from '@/lib/config/constants';

// ─── CSV export ──────────────────────────────────────────────────────────────
export function checkinsToCSV(checkins: Checkin[]): string {
  const header = 'Date,Type,Humeur (1-5),Label humeur,Energie (1-10),Note';
  const rows = checkins.map((c) => {
    const moodLabel = MOOD_LABELS[c.mood - 1] || '';
    const note = c.note ? `"${c.note.replace(/"/g, '""')}"` : '';
    return `${c.date},${c.type === 'morning' ? 'Matin' : 'Soir'},${c.mood},${moodLabel},${c.energy},${note}`;
  });
  return [header, ...rows].join('\n');
}

// ─── JSON export ─────────────────────────────────────────────────────────────
export function checkinsToJSON(checkins: Checkin[]): string {
  const data = checkins.map((c) => ({
    date: c.date,
    type: c.type === 'morning' ? 'Matin' : 'Soir',
    mood: c.mood,
    moodLabel: MOOD_LABELS[c.mood - 1] || '',
    energy: c.energy,
    note: c.note,
  }));
  return JSON.stringify(data, null, 2);
}

// ─── Download helper ─────────────────────────────────────────────────────────
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCheckinsCSV(checkins: Checkin[]): void {
  const csv = checkinsToCSV(checkins);
  const date = new Date().toISOString().split('T')[0];
  downloadFile(csv, `cadence-checkins-${date}.csv`, 'text/csv');
}

export function exportCheckinsJSON(checkins: Checkin[]): void {
  const json = checkinsToJSON(checkins);
  const date = new Date().toISOString().split('T')[0];
  downloadFile(json, `cadence-checkins-${date}.json`, 'application/json');
}
