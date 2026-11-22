import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Pencil, Download, Check } from "lucide-react";
import { supabase } from "../lib/supabase";
import BackLink from "../components/BackLink";
import { savedSet, saveFile, removeFile, openSaved } from "../lib/offline";
import { getAllDocs } from "../lib/docs";

const TITLES = {
  notes: "Notes",
  homework: "Today's homework",
  assignment: "Assignments",
  internal: "Internal papers",
  external: "External papers",
};

function sortDocs(docs) {
  return [...docs].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function detail(d) {
  return new Date(d.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function kind(path) {
  const ext = path.split(".").pop().toLowerCase();
  return ext === "pdf" ? "Open" : `${ext.toUpperCase()} · Download`;
}

function urlFor(path) {
  return supabase.storage.from("notes").getPublicUrl(path).data.publicUrl;
}

export default function Section() {
  const { code, section } = useParams();
  const [docs, setDocs] = useState([]);
  const [saved, setSaved] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [progress, setProgress] = useState("");
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
  getAllDocs().then(async ({ docs: all }) => {
    if (!all) {
      setError(
        navigator.onLine
          ? "Could not load files."
          : "You're offline. Open the app once with internet to load the lists."
      );
    } else {
      const list = sortDocs(
        all.filter((d) => d.subject_code === code && d.section === section)
      );
      setDocs(list);
      setSaved(await savedSet(list.map((d) => urlFor(d.file_path))));
    }
    setLoading(false);
  });
}, [code, section]);

  async function open(e, d) {
    const url = urlFor(d.file_path);
    if (saved.has(url)) {
      e.preventDefault();
      const w = window.open("", "_blank");
      const ok = await openSaved(url, w);
      if (!ok && w) w.close();
    } else if (!navigator.onLine) {
      e.preventDefault();
      setMessage("This file isn't saved for offline. Save it while you have internet.");
    }
  }

  async function toggleSave(d) {
    const url = urlFor(d.file_path);
    setBusyId(d.id);
    setMessage("");
    try {
      if (saved.has(url)) {
        await removeFile(url);
        setSaved((old) => {
          const n = new Set(old);
          n.delete(url);
          return n;
        });
      } else {
        await saveFile(url);
        setSaved((old) => new Set(old).add(url));
      }
    } catch (err) {
      console.error(err);
      setMessage("Could not save. Check your connection and try again.");
    }
    setBusyId(null);
  }

  async function saveAll() {
    setMessage("");
    const todo = docs.filter((d) => !saved.has(urlFor(d.file_path)));
    for (let i = 0; i < todo.length; i++) {
      setProgress(`Saving ${i + 1} of ${todo.length}...`);
      try {
        const url = urlFor(todo[i].file_path);
        await saveFile(url);
        setSaved((old) => new Set(old).add(url));
      } catch (err) {
        console.error(err);
        setMessage("Some files could not be saved. Try again with a better signal.");
        break;
      }
    }
    setProgress("");
  }

  const allSaved = docs.length > 0 && docs.every((d) => saved.has(urlFor(d.file_path)));

  return (
    <main className="app">
      <BackLink to={`/subject/${code}`} />
      <div>
        <h1>{TITLES[section] || "Files"}</h1>
        <div className="muted">{code}</div>
      </div>

      {!online && <p className="muted">Offline: showing what's saved on this phone.</p>}

      {docs.length > 0 && online && !allSaved && (
        <button className="seg-btn" onClick={saveAll} disabled={!!progress}>
          {progress || "Save all for offline"}
        </button>
      )}
      {allSaved && <p className="muted">All files here are saved for offline.</p>}

      <ul className="list">
        {docs.map((d) => {
          const url = urlFor(d.file_path);
          const isSaved = saved.has(url);
          return (
            <li key={d.id} className="doc-item">
              <a
                className="row between"
                href={url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => open(e, d)}
              >
                <span>
                  <strong>{d.title}</strong>
                  <br />
                  <span className="muted">
                    {detail(d)}
                    {d.uploaded_by ? ` · ${d.uploaded_by}` : ""}
                  </span>
                </span>
                <span className="muted">{kind(d.file_path)}</span>
              </a>
              <button
                className={`edit-btn save-btn ${isSaved ? "on" : ""}`}
                onClick={() => toggleSave(d)}
                disabled={busyId === d.id || (!isSaved && !online)}
                aria-label={
                  isSaved
                    ? `Remove ${d.title} from offline`
                    : `Save ${d.title} for offline`
                }
              >
                {isSaved ? <Check size={18} aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}
              </button>
              <Link className="edit-btn" to={`/edit/${d.id}`} aria-label={`Edit ${d.title}`}>
                <Pencil size={18} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
        {loading && <li className="empty">Loading...</li>}
        {error && <li className="empty">{error}</li>}
        {!loading && !error && docs.length === 0 && (
          <li className="empty">Nothing here yet.</li>
        )}
      </ul>
      {message && <p className="error">{message}</p>}
    </main>
  );
}