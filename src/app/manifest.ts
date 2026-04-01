import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cadence',
    short_name: 'Cadence',
    description: 'Planifie ta semaine, suis ton humeur, ne rate aucun match.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f4ef',
    theme_color: '#7c3aed',
    orientation: 'portrait-primary',
    categories: ['lifestyle', 'productivity', 'sports'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
