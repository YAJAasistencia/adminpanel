import Layout from "@/components/admin/Layout";

export default function Home() {
  return (
    <Layout currentPageName="Dashboard">
      <div className="min-h-screen bg-[#F4F6FA]">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Bienvenido al panel administrativo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Viajes Activos</h3>
            <p className="text-3xl font-bold text-blue-600">24</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Conductores</h3>
            <p className="text-3xl font-bold text-green-600">156</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Ingresos Hoy</h3>
            <p className="text-3xl font-bold text-purple-600">$12,450</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Alertas SOS</h3>
            <p className="text-3xl font-bold text-red-600">3</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Viajes Recientes</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">Viaje #1234</p>
                  <p className="text-sm text-slate-500">Juan Pérez → Centro Histórico</p>
                </div>
                <span className="text-sm text-green-600 font-medium">Completado</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">Viaje #1235</p>
                  <p className="text-sm text-slate-500">María García → Polanco</p>
                </div>
                <span className="text-sm text-blue-600 font-medium">En progreso</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Conductores Activos</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">Carlos Rodríguez</p>
                  <p className="text-sm text-slate-500">En servicio • 4.8★</p>
                </div>
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">Ana López</p>
                  <p className="text-sm text-slate-500">Disponible • 4.9★</p>
                </div>
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

