import type { Profile } from '@/lib/supabase/types';

interface AvatarProps {
  profile?: Pick<Profile, 'display_name' | 'email' | 'avatar_url'> | null;
  size?: number;
  nickname?: string | null;
  className?: string;
  title?: string;
}

/**
 * Rond d'avatar avec initiales ou image.
 * Préférence d'affichage : nickname > display_name > email.
 */
export function Avatar({ profile, size = 28, nickname, className = '', title }: AvatarProps) {
  const label = nickname || profile?.display_name || profile?.email || '?';
  const initial = label.trim().charAt(0).toUpperCase();
  const hasImg = Boolean(profile?.avatar_url);

  // Couleur déterministe basée sur le label (stable entre les renders)
  const hue = hashString(label) % 360;

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.42),
        background: hasImg ? undefined : `hsl(${hue}, 65%, 50%)`,
      }}
      title={title ?? label}
    >
      {hasImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile!.avatar_url!}
          alt={label}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        initial
      )}
    </div>
  );
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
