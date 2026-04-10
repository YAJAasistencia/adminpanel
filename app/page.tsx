'use client'

import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export default function Home() {
  const [data, setData] = useState<any[] | null>(null)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function test() {
      try {
        const result = await supabase.from('admin_users').select('*')
        setData(result.data)
        setError(result.error)
      } catch (err) {
        setError(err)
      }
    }
    test()
  }, [])

  return (
    <main>
      <h1>Probando Supabase...</h1>
      <p>Datos: {JSON.stringify(data)}</p>
      <p>Error: {JSON.stringify(error)}</p>
    </main>
  )
}
      } catch (err) {
        setError(err)
      }
    }
>>>>>>> d0bfa47 (Move Supabase query to client-side to fix Vercel build)
    test()
  }, [])

  return (
    <main>
      <h1>Probando Supabase...</h1>
<<<<<<< HEAD
=======
      <p>Datos: {JSON.stringify(data)}</p>
      <p>Error: {JSON.stringify(error)}</p>
>>>>>>> d0bfa47 (Move Supabase query to client-side to fix Vercel build)
    </main>
  )
}