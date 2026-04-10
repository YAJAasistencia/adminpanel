export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section className="mb-20">
          <h2 className="text-4xl font-bold mb-6">Bienvenido al Admin Panel</h2>
          <p className="text-xl text-gray-400 mb-8">
            Gestiona tu negocio desde aquí. Una plataforma completa para administrar usuarios, servicios y más.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold">
            Comenzar
          </button>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
            <h3 className="text-xl font-bold mb-3">Usuarios</h3>
            <p className="text-gray-400">Gestiona y administra todos los usuarios del sistema.</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
            <h3 className="text-xl font-bold mb-3">Servicios</h3>
            <p className="text-gray-400">Configura y personaliza los servicios disponibles.</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
            <h3 className="text-xl font-bold mb-3">Reportes</h3>
            <p className="text-gray-400">Visualiza estadísticas y reportes del sistema.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-800 bg-black/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>&copy; 2026 Admin Panel. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

