import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhudnkgiycwfnywxqedx.supabase.co';
const supabaseAnonKey = 'sb_publishable_erbIhRPIbPI6j5l_izUawg_-G6_1ARS';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: undefined,
      });
    },
    headers: {
      'x-client-info': 'moneymap/1.0',
    },
  },
  db: {
    schema: 'public',
  },
});

export function keepAlive() {
  supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .then(() => {})
    .catch(() => {});
}
