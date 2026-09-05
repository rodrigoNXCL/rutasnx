import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-emerald-400">NX</span>
            <span className="text-xl font-light text-white">Chile</span>
          </div>
          <Link
            href="/auth/login"
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block mb-6 px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase text-slate-900 bg-emerald-400 rounded-full">
              Gestión de transporte
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
              RutasNX
            </h1>

            <p className="text-xl sm:text-2xl text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8">
              Plataforma multi-tenant para empresas de transporte.
              Control de flotas, registro de viajes, gastos y asignaciones en tiempo real.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/login"
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors text-lg"
              >
                Acceder a la plataforma
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
              ¿Cómo funciona?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Asigna</h3>
                <p className="text-slate-600 text-sm">El admin asigna choferes y camiones a cada servicio de forma permanente.</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Registra</h3>
                <p className="text-slate-600 text-sm">Los choferes registran kilómetros y gastos desde su dispositivo móvil.</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Informa</h3>
                <p className="text-slate-600 text-sm">Clientes acceden a informes y historial de servicios en línea.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
              Sobre NXChile
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8">
              Somos una empresa chilena especializada en tecnología para operaciones logísticas y de transporte.
              Desarrollamos soluciones digitales que simplifican la gestión operacional y mejoran la productividad
              de empresas de transporte en todo Chile.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a href="https://www.nxchile.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 font-medium">
                www.nxchile.com
              </a>
              <span className="text-slate-300">|</span>
              <a href="https://instagram.com/nx_chile" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900 font-medium">
                @nx_chile
              </a>
              <span className="text-slate-300">|</span>
              <a href="https://wa.me/56977412178" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900 font-medium">
                WhatsApp +56 9 7741 2178
              </a>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-center mb-8">Nuestras soluciones</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <a href="https://gastos.nxchile.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">GastosNX</div>
                  <div className="text-sm text-slate-400">Control de gastos operacionales</div>
                </div>
              </a>
              <a href="https://trans.nxchile.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">TransNX</div>
                  <div className="text-sm text-slate-400">Gestión de transporte</div>
                </div>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-8 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-emerald-400">NX</span>
            <span className="text-white">Chile</span>
            <span className="text-slate-500 text-sm ml-2">© 2024</span>
          </div>
          <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
            Acceder a la plataforma →
          </Link>
        </div>
      </footer>
    </div>
  );
}
