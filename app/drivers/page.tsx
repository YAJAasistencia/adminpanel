import Layout from "@/components/admin/Layout";

export default function DriversPage() {
  return (
    <Layout currentPageName="Drivers">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Drivers</h1>
          <p className="text-slate-600">Gestión de Drivers</p>
        </div>

        {/* Contenido de la página aquí */}
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <p className="text-slate-500">Contenido pendiente de implementar</p>
        </div>
      </div>
    </Layout>
  );
}
