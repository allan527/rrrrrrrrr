export const APP_CONFIG = {
  appName: import.meta.env.VITE_APP_NAME || 'Texas Finance',
  ownerEmail: import.meta.env.VITE_OWNER_EMAIL || 'william@boss.com',
  dataMode: (import.meta.env.VITE_DATA_MODE || 'local') as 'local' | 'remote',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/make-server-68baa523',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

export const isRemoteMode = APP_CONFIG.dataMode === 'remote';
