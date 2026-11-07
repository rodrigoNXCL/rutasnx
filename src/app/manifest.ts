import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'rutasNX',
    short_name: 'rutasNX',
    description: 'Gestión de rutas, kilometraje, gastos y guías',
    start_url: '/chofer/registro',
    display: 'standalone',
    background_color: '#0D0D0D',
    theme_color: '#10B981',
    lang: 'es-CL',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
