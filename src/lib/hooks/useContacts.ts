'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { ContactWithProfile, Profile, UserContact } from '@/lib/supabase/types';

/**
 * Hook de gestion des contacts (amis).
 *
 * Un contact peut être :
 * - `outgoing` : demande émise par moi, en attente d'acceptation
 * - `incoming` : demande reçue, à accepter ou refuser
 * - `accepted` (peu importe le sens) : relation établie
 *
 * La direction est inférée depuis `user_id` (émetteur) vs `contact_user_id` (destinataire).
 */
export function useContacts() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ContactWithProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);

    // Récupérer toutes les lignes où je suis émetteur ou destinataire
    const { data: rows } = await supabase
      .from('user_contacts')
      .select('*')
      .or(`user_id.eq.${user.id},contact_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    const contactRows = (rows ?? []) as UserContact[];

    // Récupérer les profils des "autres" (celui qui n'est pas moi sur chaque ligne)
    const otherIds = Array.from(
      new Set(
        contactRows.map((r) => (r.user_id === user.id ? r.contact_user_id : r.user_id))
      )
    );

    let profiles: Profile[] = [];
    if (otherIds.length > 0) {
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', otherIds);
      profiles = (profData ?? []) as Profile[];
    }

    const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

    const enriched: ContactWithProfile[] = contactRows.flatMap((row) => {
      const otherId = row.user_id === user.id ? row.contact_user_id : row.user_id;
      const profile = profileMap.get(otherId);
      if (!profile) return [];
      return [
        {
          ...row,
          profile,
          direction: row.user_id === user.id ? 'outgoing' : 'incoming',
        },
      ];
    });

    setContacts(enriched);
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    load();
  }, [load]);

  /** Envoyer une demande de contact à un utilisateur (par son user_id). */
  const sendRequest = useCallback(
    async (contactUserId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!supabase || !user) return { ok: false, error: 'Non connecté' };
      if (contactUserId === user.id) return { ok: false, error: "Tu ne peux pas t'ajouter toi-même" };

      // Vérifier s'il existe déjà une relation dans un sens ou dans l'autre
      const { data: existing } = await supabase
        .from('user_contacts')
        .select('*')
        .or(
          `and(user_id.eq.${user.id},contact_user_id.eq.${contactUserId}),and(user_id.eq.${contactUserId},contact_user_id.eq.${user.id})`
        )
        .maybeSingle();

      if (existing) {
        const e = existing as UserContact;
        if (e.status === 'accepted') return { ok: false, error: 'Déjà dans tes contacts' };
        if (e.status === 'pending') return { ok: false, error: 'Demande déjà en cours' };
        if (e.status === 'blocked') return { ok: false, error: 'Contact bloqué' };
      }

      const { error } = await supabase.from('user_contacts').insert({
        user_id: user.id,
        contact_user_id: contactUserId,
        status: 'pending',
      });

      if (error) return { ok: false, error: error.message };
      await load();
      return { ok: true };
    },
    [supabase, user, load]
  );

  /** Accepter une demande reçue (je suis `contact_user_id`). */
  const accept = useCallback(
    async (contactRowId: string) => {
      if (!supabase || !user) return;
      await supabase
        .from('user_contacts')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', contactRowId)
        .eq('contact_user_id', user.id);
      await load();
    },
    [supabase, user, load]
  );

  /** Refuser / annuler une demande — supprime la ligne. */
  const remove = useCallback(
    async (contactRowId: string) => {
      if (!supabase || !user) return;
      await supabase.from('user_contacts').delete().eq('id', contactRowId);
      await load();
    },
    [supabase, user, load]
  );

  /** Mettre à jour le surnom que j'attribue à ce contact. */
  const setNickname = useCallback(
    async (contactRowId: string, nickname: string | null) => {
      if (!supabase || !user) return;
      await supabase
        .from('user_contacts')
        .update({ nickname, updated_at: new Date().toISOString() })
        .eq('id', contactRowId)
        .eq('user_id', user.id); // uniquement le surnom de MA ligne (si je suis émetteur)
      await load();
    },
    [supabase, user, load]
  );

  // Getters pratiques
  const accepted = contacts.filter((c) => c.status === 'accepted');
  const outgoingPending = contacts.filter((c) => c.status === 'pending' && c.direction === 'outgoing');
  const incomingPending = contacts.filter((c) => c.status === 'pending' && c.direction === 'incoming');

  return {
    contacts,
    accepted,
    outgoingPending,
    incomingPending,
    loading,
    load,
    sendRequest,
    accept,
    remove,
    setNickname,
  };
}
