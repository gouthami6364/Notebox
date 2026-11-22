const CACHE = "notes-files";

export async function savedSet(urls) {
  const c = await caches.open(CACHE);
  const out = new Set();
  for (const u of urls) if (await c.match(u)) out.add(u);
  return out;
}

export async function saveFile(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("download failed");
  await (await caches.open(CACHE)).put(url, r);
}

export async function removeFile(url) {
  await (await caches.open(CACHE)).delete(url);
}

export async function openSaved(url, win) {
  const r = await (await caches.open(CACHE)).match(url);
  if (!r) return false;
  const blob = new Blob([await r.arrayBuffer()], {
    type: r.headers.get("content-type") || "application/pdf",
  });
  const blobUrl = URL.createObjectURL(blob);
  if (win) win.location.href = blobUrl;
  else window.location.href = blobUrl;
  return true;
}