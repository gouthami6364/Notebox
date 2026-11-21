import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    global: {
      fetch: (input, init = {}) => {
        const headers = new Headers(init.headers);
        const code = localStorage.getItem("classCode");
        if (code) headers.set("x-class-code", code);
        return fetch(input, { ...init, headers });
      },
    },
  }
);