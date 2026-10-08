import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhudnkgiycwfnywxqedx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodWRua2dpeWN3Zm55d3hxZWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMDI3NTksImV4cCI6MjEwNjc3ODc1OX0.io__r_WqY_drsWJHZx0nZwutOnh8JGzzRJVy8eRCzJg';

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
