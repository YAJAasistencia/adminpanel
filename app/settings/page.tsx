"use client";
export const dynamic = 'force-dynamic';

import Layout from "@/components/admin/Layout";
import LandingEditor from "@/components/settings/LandingEditor";

export default function SettingsPage() {
  return (
    <Layout currentPageName="Settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
          <p className="text-slate-600 mt-1">Gestiona los settings de tu aplicación</p>
        </div>

        {/* Landing Page Editor */}
        <LandingEditor />
      </div>
    </Layout>
  );
}
