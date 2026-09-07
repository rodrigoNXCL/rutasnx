import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <header className="border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-white">rutasNX</span>
          <Link
            href="/auth/login"
            className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: '#10B981' }}
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      <main>
        <section className="py-40 px-6">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-6xl sm:text-7xl font-bold tracking-tighter text-white mb-6 leading-[0.95]">
              RutasNX
            </h1>
            <p className="text-xl text-zinc-400 leading-relaxed mb-5">
              Gestión de transporte para empresas
            </p>
            <p className="text-base text-zinc-500 leading-relaxed mb-12">
              Control de flotas, registro de viajes y gastos en tiempo real
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-10 py-4 rounded-lg text-base font-medium text-white transition-colors"
              style={{ background: '#10B981' }}
            >
              Acceder a la plataforma
            </Link>
          </div>
        </section>

        <section className="py-32 px-6" style={{ background: '#0F0F0F' }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-white text-center mb-16 tracking-tight">¿Cómo funciona?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl p-8 border" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
                <h3 className="text-lg font-semibold text-white mb-3">Asigna</h3>
                <p className="text-zinc-400 leading-relaxed">El admin asigna choferes y camiones a cada servicio de forma permanente.</p>
              </div>
              <div className="rounded-xl p-8 border" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
                <h3 className="text-lg font-semibold text-white mb-3">Registra</h3>
                <p className="text-zinc-400 leading-relaxed">Los choferes registran kilómetros y gastos desde su dispositivo móvil.</p>
              </div>
              <div className="rounded-xl p-8 border" style={{ background: '#141414', borderColor: '#2A2A2A' }}>
                <h3 className="text-lg font-semibold text-white mb-3">Informa</h3>
                <p className="text-zinc-400 leading-relaxed">Clientes acceden a informes y historial de servicios en línea.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 px-6" style={{ background: '#0D0D0D' }}>
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-semibold text-white mb-6 tracking-tight">NXChile</h2>
            <p className="text-zinc-400 leading-loose mb-8">
              Tecnología para operaciones logísticas y transporte en Chile.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <a href="https://www.nxchile.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
                nxchile.com
              </a>
              <span className="text-zinc-700">·</span>
              <a href="https://wa.me/56977412178" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
                +56 9 7741 2178
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-10 px-6" style={{ background: '#0D0D0D' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-sm text-zinc-500">NXChile © 2024</span>
          <Link href="/auth/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Acceder →
          </Link>
        </div>
      </footer>
    </div>
  );
}
