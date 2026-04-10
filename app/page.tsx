'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [data, setData] = useState<any[] | null>(null)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function fetchAdminUsers() {
      try {
        const result = await supabase.from('admin_users').select('*')
        setData(result.data)
        setError(result.error)
      } catch (err) {
        setError(err)
      }
    }

    fetchAdminUsers()
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-3xl w-full bg-white/90 dark:bg-zinc-900/90 rounded-3xl border border-gray-200 dark:border-zinc-700 p-8 shadow-xl">
        <h1 className="text-3xl font-bold mb-4">Probando Supabase</h1>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Consulta `admin_users` desde el cliente.</p>
        <div className="mb-4">
          <strong>Datos:</strong>
          <pre className="mt-2 rounded-lg border border-gray-200 bg-gray-100 p-4 text-xs text-gray-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-100">{JSON.stringify(data, null, 2)}</pre>
        </div>
        <div>
          <strong>Error:</strong>
          <pre className="mt-2 rounded-lg border border-gray-200 bg-gray-100 p-4 text-xs text-red-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-red-400">{JSON.stringify(error, null, 2)}</pre>
        </div>
      </div>
    </main>
  )
}
