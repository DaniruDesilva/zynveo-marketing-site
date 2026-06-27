declare var process: any;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const safeJson = async (res: Response) => {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (e) {
    return { message: "Invalid JSON response from server. Check your SUPABASE_URL." };
  }
};

export const supabase = {
  from: (table: string) => {
    const url = SUPABASE_URL ? `${SUPABASE_URL}/rest/v1/${table}` : `/api/mock/${table}`;
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    return {
      select: (query = '*') => {
        let urlObj = `${url}?select=${query}`;
        const selectObj = {
          order: async (column: string, { ascending }: { ascending: boolean }) => {
            if (!SUPABASE_URL) return { error: null, data: [] };
            urlObj += `&order=${column}.${ascending ? 'asc' : 'desc'}`;
            const res = await fetch(urlObj, { headers });
            if (!res.ok) return { error: await safeJson(res), data: null };
            return { error: null, data: await safeJson(res) };
          },
          then: async (resolve: any, reject: any) => {
            if (!SUPABASE_URL) return resolve({ error: null, data: [] });
            try {
              const res = await fetch(urlObj, { headers });
              if (!res.ok) resolve({ error: await safeJson(res), data: null });
              else resolve({ error: null, data: await safeJson(res) });
            } catch (err) {
              reject(err);
            }
          }
        };
        return selectObj;
      },
      insert: async (data: any[]) => {
        if (!SUPABASE_URL) return { error: { message: "Supabase URL not configured" }, data: null };
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) });
        if (!res.ok) return { error: await safeJson(res), data: null };
        return { error: null, data: await safeJson(res) };
      },
      update: (data: any) => ({
        eq: async (column: string, value: string) => {
          if (!SUPABASE_URL) return { error: { message: "Supabase URL not configured" }, data: null };
          const res = await fetch(`${url}?${column}=eq.${value}`, { method: 'PATCH', headers, body: JSON.stringify(data) });
          if (!res.ok) return { error: await safeJson(res), data: null };
          return { error: null, data: await safeJson(res) };
        }
      }),
      delete: () => ({
        eq: async (column: string, value: string) => {
          if (!SUPABASE_URL) return { error: { message: "Supabase URL not configured" }, data: null };
          const res = await fetch(`${url}?${column}=eq.${value}`, { method: 'DELETE', headers });
          if (!res.ok) return { error: await safeJson(res), data: null };
          return { error: null, data: await safeJson(res) };
        }
      })
    };
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        if (!SUPABASE_URL) return { error: { message: "Supabase URL not configured" }, data: null };
        const formData = new FormData();
        formData.append('', file);
        const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: formData
        });
        if (!res.ok) return { error: await safeJson(res), data: null };
        return { error: null, data: await safeJson(res) };
      },
      getPublicUrl: (path: string) => {
        return { data: { publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}` } };
      }
    })
  },
  channel: (name: string) => ({ on: (event: string, opts: any, callback: any) => ({ subscribe: () => {} }) }),
  removeChannel: (channel: any) => {}
};
