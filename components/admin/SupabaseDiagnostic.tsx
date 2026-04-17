/**
 * Componente de Diagnóstico - Muestra el estado de Supabase en tiempo real
 * Úsalo en layout.tsx temporalmente para debugging:
 * 
 * import SupabaseDiagnostic from '@/components/admin/SupabaseDiagnostic';
 * in your JSX: <SupabaseDiagnostic />
 */

"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, XCircle, Loader, Copy } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface TableStatus {
  name: string;
  status: "✅" | "❌" | "⏳";
  message: string;
  count?: number;
}

interface DiagnosticStatus {
  auth?: { status: "✅" | "❌" | "⏳"; message: string };
  tables?: TableStatus[];
}

export default function SupabaseDiagnostic() {
  const [status, setStatus] = useState<DiagnosticStatus>({});
  const [expanded, setExpanded] = useState(false);
  const [diagCode, setDiagCode] = useState("");

  useEffect(() => {
    const runDiagnostics = async () => {
      const results: DiagnosticStatus = {};
      const tablesData: TableStatus[] = [];

      // 1. Check auth
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          results.auth = {
            status: "✅",
            message: `✓ Conectado: ${user.email?.slice(0, 25)}...`
          };
        } else {
          results.auth = {
            status: "❌",
            message: "✗ No hay usuario logueado"
          };
        }
      } catch (err) {
        results.auth = {
          status: "❌",
          message: `✗ Error auth: ${(err as any)?.message?.slice(0, 40)}`
        };
      }

      // 2. Check multiple tables
      const tableNames = [
        "Company", "Driver", "RideRequest", "Invoice",
        "City", "GeoZone", "ServiceType", "AdminUser"
      ];

      for (const table of tableNames) {
        try {
          const { data, error, count } = await Promise.race([
            supabase.from(table).select("id", { count: "exact" }).limit(1),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 3000)
            ),
          ]) as any;

          if (error) {
            tablesData.push({
              name: table,
              status: "❌",
              message: `Error: ${error.message?.slice(0, 35)}`,
            });
          } else if (count === 0) {
            tablesData.push({
              name: table,
              status: "⚠️" as any,
              message: "Accesible pero vacía (RLS bloqueando?)",
              count: 0,
            });
          } else {
            tablesData.push({
              name: table,
              status: "✅",
              message: `${count || 0} registros`,
              count: count || 0,
            });
          }
        } catch (err: any) {
          tablesData.push({
            name: table,
            status: "❌",
            message: err.message?.includes("Timeout") ? "Timeout" : "Error conexión",
          });
        }
      }

      results.tables = tablesData;
      setStatus(results);
    };

    runDiagnostics();
  }, []);

  const hasErrors = status.tables?.some(t => t.status === "❌");
  const hasWarnings = status.tables?.some(t => t.status === "⚠️");

  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        className="fixed bottom-4 right-4 cursor-pointer z-50"
      >
        <div className={`${
          status.auth?.status === "❌" ? "bg-red-100 border-red-400" :
          hasErrors ? "bg-red-100 border-red-400" :
          hasWarnings ? "bg-yellow-100 border-yellow-400" :
          status.tables ? "bg-green-100 border-green-400" :
          "bg-blue-100 border-blue-400"
        } border-2 rounded-full p-3 shadow-lg hover:scale-110 transition`}>
          <AlertCircle className={`w-6 h-6 ${
            status.auth?.status === "❌" ? "text-red-600" :
            hasErrors ? "text-red-600" :
            hasWarnings ? "text-yellow-600" :
            "text-blue-600"
          }`} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-2xl z-50 max-w-md w-full max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-3 pb-2 border-b">
        <h3 className="font-bold text-sm">🔍 Diagnóstico Supabase</h3>
        <button
          onClick={() => setExpanded(false)}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ✕
        </button>
      </div>

      {/* AUTH STATUS */}
      {status.auth && (
        <div className={`p-2 rounded border mb-2 ${
          status.auth.status === "✅"
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-start gap-2">
            {status.auth.status === "✅" && (
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            )}
            {status.auth.status === "❌" && (
              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">Autenticación</p>
              <p className="text-xs text-gray-600">{status.auth.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* TABLES STATUS */}
      {status.tables && (
        <div>
          <p className="font-medium text-xs mb-2 text-gray-600">Tablas Principales:</p>
          <div className="grid grid-cols-2 gap-2">
            {status.tables.map((table) => (
              <div
                key={table.name}
                className={`p-2 rounded border text-xs ${
                  table.status === "✅"
                    ? "bg-green-50 border-green-200"
                    : table.status === "❌"
                    ? "bg-red-50 border-red-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-start gap-1">
                  {table.status === "✅" && (
                    <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                  )}
                  {table.status === "❌" && (
                    <XCircle className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  {table.status === "⚠️" && (
                    <AlertCircle className="w-3 h-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{table.name}</p>
                    <p className="text-gray-600">{table.message}</p>
                    {table.count !== undefined && (
                      <p className="text-gray-500">({table.count} rows)</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUMMARY */}
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs">
        <p className="font-medium mb-2 text-red-600">⚠️ Si TODO es ❌ o ⚠️:</p>
        <p className="text-gray-600 mb-2">
          Problema de RLS (Row Level Security). Las políticas no están configuradas en Supabase.
        </p>
        <p className="text-blue-600 font-medium cursor-pointer hover:underline">
          📖 Ver solución: SOLUCION_GLOBAL_NO_TRAE_DATOS.md
        </p>
      </div>
    </div>
  );
}
