'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Calendar, Mail, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    router.replace('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    const { error } = await signIn(email);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
          <Check size={32} className="text-success" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold">Lien envoye !</h1>
          <p className="text-text-muted text-sm max-w-xs">
            Verifie ta boite mail <span className="text-text">{email}</span> et clique sur le lien magique.
          </p>
        </div>
        <Button variant="ghost" onClick={() => setSent(false)}>
          Renvoyer le lien
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
      <Link href="/" className="self-start">
        <Button variant="ghost" size="sm">
          <ArrowLeft size={16} />
          Retour
        </Button>
      </Link>

      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
          <Calendar size={28} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Connexion</h1>
        <p className="text-text-muted text-sm">Un lien magique sera envoye a ton email</p>
      </div>

      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-text-muted block mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                required
                className="w-full bg-surface-elevated border border-border rounded-xl pl-10 pr-4 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-error text-sm">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading || !email}>
            {loading ? 'Envoi...' : 'Envoyer le lien magique'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
