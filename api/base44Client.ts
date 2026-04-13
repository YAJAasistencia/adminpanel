/*
  Compatibility shim: provide a `base44` object backed by Supabase.
  This implements a minimal subset of the original base44 SDK surface used
  across the codebase: `auth.me`, `auth.logout`, `entities.<Entity>.list|filter|create|update|subscribe`,
  and `integrations.Core.UploadFile` / `SendEmail`.

  NOTE: This file requires `@supabase/supabase-js` at runtime. Install with:
    npm install @supabase/supabase-js

  Supabase credentials were provided by the user and are embedded below.
*/

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dsruuvvbeudbkdpevgwd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcnV1dnZiZXVkYmtkcGV2Z3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTMwODAsImV4cCI6MjA5MTMyOTA4MH0.b9pMUsCW8RN6RDLCEPmIJba2CO03BUYJi8UOvfwibCg';

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function toTableName(entityName: string) {
  // Convert CamelCase (e.g. RideRequest) to snake_case plural (ride_requests)
  const snake = entityName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
  return snake.endsWith('s') ? snake : `${snake}s`;
}

async function maybeSelect(q: any) {
  // supabase-js query returns { data, error }
  const res = await q;
  if (res.error) throw res.error;
  return res.data;
}

function entityProxy(entityName: string) {
  const table = toTableName(entityName);
  return {
    list: async (order: string | null = '-created_date', limit: number | null = 100) => {
      let q: any = supabase.from(table).select('*');
      if (order) {
        const desc = order.startsWith('-');
        const col = order.replace(/^-/, '');
        q = q.order(col, { ascending: !desc });
      }
      if (limit) q = q.limit(limit);
      return await maybeSelect(q);
    },
    filter: async (filters: Record<string, any> = {}, order: string | null = null) => {
      let q: any = supabase.from(table).select('*');
      if (filters && Object.keys(filters).length) q = q.match(filters);
      if (order) {
        const desc = order.startsWith('-');
        const col = order.replace(/^-/, '');
        q = q.order(col, { ascending: !desc });
      }
      return await maybeSelect(q);
    },
    create: async (obj: Record<string, any>) => {
      const res = await supabase.from(table).insert([obj]).select();
      if (res.error) throw res.error;
      return res.data?.[0];
    },
    update: async (idOrMatch: any, updates: Record<string, any>) => {
      if (idOrMatch && typeof idOrMatch === 'object') {
        const res = await supabase.from(table).update(updates).match(idOrMatch).select();
        if (res.error) throw res.error;
        return res.data;
      }
      const id = idOrMatch;
      const res = await supabase.from(table).update(updates).eq('id', id).select();
      if (res.error) throw res.error;
      return res.data;
    },
    listOnce: async (...args: any[]) => {
      // alias
      return await entityProxy(entityName).list(...args as any);
    },
    subscribe: (handler: (event: any) => void) => {
      try {
        const channel = supabase.channel(`${table}-changes`).on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload: any) => handler(payload)
        ).subscribe();
        return async () => {
          try { await supabase.removeChannel(channel); } catch (e) { /* ignore */ }
        };
      } catch (e) {
        return () => {};
      }
    }
  };
}

export const base44 = {
  supabase,
  auth: {
    async me() {
      const res = await supabase.auth.getUser();
      if (res.error) return null;
      return res.data.user || null;
    },
    async logout(redirectUrl?: string) {
      try { await supabase.auth.signOut(); } catch (e) { /* ignore */ }
      if (redirectUrl) window.location.href = redirectUrl;
    },
    redirectToLogin(redirectUrl?: string) {
      // Fallback: navigate to a /login page in the app
      if (redirectUrl) window.location.href = `/login?next=${encodeURIComponent(redirectUrl)}`;
      else window.location.href = '/login';
    }
  },
  entities: new Proxy({}, {
    get(_, prop: string) {
      return entityProxy(prop);
    }
  }),
  integrations: {
    Core: {
      async UploadFile({ file }: { file: any }) {
        try {
          if (!file) throw new Error('No file');
          const filename = `${Date.now()}-${file.name || 'upload'}`;
          const path = filename;
          // Ensure a bucket named 'uploads' exists and is public
          const up = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
          if (up.error) throw up.error;
          const url = supabase.storage.from('uploads').getPublicUrl(path).data.publicUrl;
          return { file_url: url };
        } catch (e) {
          return { file_url: null };
        }
      },
      async SendEmail(payload: any) {
        // Best-effort: try to call a Supabase Edge Function named 'send-email'
        try {
          // @ts-ignore
          if (supabase.functions) {
            // send payload to an edge function if configured
            // supabase.functions.invoke may not be available; this is best-effort
            // @ts-ignore
            await supabase.functions.invoke('send-email', { body: payload });
          }
        } catch (e) { /* ignore */ }
        return { ok: true };
      }
    }
  },
  appLogs: {
    async logUserInApp(pageName: string) {
      try {
        await supabase.from('app_logs').insert([{ page: pageName, created_at: new Date().toISOString() }]);
      } catch (e) { /* ignore */ }
    }
  }
};

export default base44;
