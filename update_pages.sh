#!/bin/bash

# Lista de páginas a actualizar
pages=(
  "admin-users:AdminUsers"
  "analytics:Analytics" 
  "anuncios:Anuncios"
  "bonos:Bonos"
  "cancellation-policies:CancellationPolicies"
  "cash-cutoff:CashCutoff"
  "chats:Chats"
  "cities:Cities"
  "companies:Companies"
  "dashboard:Dashboard"
  "driver-app:DriverApp"
  "driver-earnings:DriverEarnings"
  "drivers:Drivers"
  "earnings:Earnings"
  "geo-zones:GeoZones"
  "invoices:Invoices"
  "liquidaciones:Liquidaciones"
  "live-drivers:LiveDrivers"
  "notificaciones:Notificaciones"
  "passengers:Passengers"
  "payment-methods:PaymentMethods"
  "red-zones:RedZones"
  "road-assist-app:RoadAssistApp"
  "service-types:ServiceTypes"
  "settings:Settings"
  "sos-alerts:SosAlerts"
  "support-tickets:SupportTickets"
  "surveys:Surveys"
)

for page_info in "${pages[@]}"; do
  IFS=':' read -r folder page_name <<< "$page_info"
  
  # Convertir a título legible
  title=$(echo "$page_name" | sed 's/\([A-Z]\)/ \1/g' | sed 's/^ //')
  
  cat > "app/$folder/page.tsx" << PAGE_EOF
import Layout from "@/components/admin/Layout";

export default function ${page_name}Page() {
  return (
    <Layout currentPageName="$page_name">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">$title</h1>
          <p className="text-slate-600">Gestión de $title</p>
        </div>

        {/* Contenido de la página aquí */}
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <p className="text-slate-500">Contenido pendiente de implementar</p>
        </div>
      </div>
    </Layout>
  );
}
PAGE_EOF

  echo "Updated app/$folder/page.tsx"
done
