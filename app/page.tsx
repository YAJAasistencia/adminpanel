import { supabase } from '../lib/supabase'

export default function Home() {
  async function test() {
    const { data, error } = await supabase.from('admin_users').select('*')
    console.log(data, error)
  }

  test()

  return (
    <main>
      <h1>Probando Supabase...</h1>
    </main>
  )
}
