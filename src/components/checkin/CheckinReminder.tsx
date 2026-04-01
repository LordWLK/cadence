'use client';

import { Sun, Moon, ArrowRight } from 'lucide-react';

interface CheckinReminderProps {
  hasMorning: boolean;
  hasEvening: boolean;
}

export function CheckinReminder({ hasMorning, hasEvening }: CheckinReminderProps) {
  const hour = new Date().getHours();

  // Determine what to remind
  let message: string | null = null;
  let Icon = Sun;
  let accentColor = 'var(--color-warning)';

  if (!hasMorning && hour >= 10 && hour < 14) {
    message = "N'oublie pas ton check-in du matin !";
    Icon = Sun;
    accentColor = 'var(--color-warning)';
  } else if (!hasEvening && hour >= 20) {
    message = "C'est l'heure du check-in du soir !";
    Icon = Moon;
    accentColor = 'var(--color-accent-light)';
  } else if (!hasMorning && !hasEvening && hour >= 14) {
    message = "Tu n'as pas encore fait de check-in aujourd'hui";
    Icon = Sun;
    accentColor = 'var(--color-warning)';
  }

  if (!message) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-in"
      style={{
        backgroundColor: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accentColor} 20%, transparent)`,
      }}
    >
      <Icon size={16} style={{ color: accentColor }} />
      <p className="flex-1 text-sm" style={{ color: accentColor }}>{message}</p>
      <ArrowRight size={14} style={{ color: accentColor, opacity: 0.6 }} />
    </div>
  );
}
