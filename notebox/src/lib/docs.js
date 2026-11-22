import { supabase } from "./supabase";

const KEY = "docsCache";

export async function getAllDocs() {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .is("deleted_at", null);

  if (!error && data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // storage full or blocked, so just carry on
    }
    return { docs: data };
  }

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { docs: JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { docs: null };
}