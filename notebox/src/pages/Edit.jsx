import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import BackLink from "../components/BackLink";

const SECTIONS = [
  { id: "notes", label: "Notes" },
  { id: "homework", label: "Today's homework" },
  { id: "assignment", label: "Assignment" },
  { id: "internal", label: "Internal paper" },
  { id: "external", label: "External paper" },
];

export default function Edit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const s = await supabase.from("subjects").select("code, name").order("code");
      setSubjects(s.data || []);
      const d = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      setDoc(d.data);
      setLoading(false);
    }
    load();
  }, [id]);

  function set(field, value) {
    setDoc((old) => ({ ...old, [field]: value }));
  }

  async function save(e) {
    e.preventDefault();
    setMessage("");
    if (!doc.title.trim()) return setMessage("Add a title.");

    setBusy(true);
    const { error } = await supabase
      .from("documents")
      .update({
        subject_code: doc.subject_code,
        section: doc.section,
        title: doc.title.trim(),
      })
      .eq("id", id);
    if (error) {
      setMessage("Could not save. Check your connection and try again.");
      setBusy(false);
    } else {
      navigate(`/subject/${doc.subject_code}/${doc.section}`);
    }
  }

  async function remove() {
    if (!window.confirm("Remove this file for everyone in the class?")) return;
    setBusy(true);
    const { error } = await supabase
      .from("documents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      setMessage("Could not remove it. Try again.");
      setBusy(false);
    } else {
      navigate(`/subject/${doc.subject_code}/${doc.section}`);
    }
  }

  if (loading) {
    return (
      <main className="app">
        <BackLink to="/" />
        <p className="muted">Loading...</p>
      </main>
    );
  }
  if (!doc) {
    return (
      <main className="app">
        <BackLink to="/" />
        <p>This file was not found. It may have been removed.</p>
      </main>
    );
  }

  return (
    <main className="app">
      <BackLink to={`/subject/${doc.subject_code}/${doc.section}`} />
      <h1>Edit file</h1>

      <form className="form" onSubmit={save}>
        <label>
          Subject
          <select value={doc.subject_code} onChange={(e) => set("subject_code", e.target.value)}>
            {subjects.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} · {s.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Section
          <select value={doc.section} onChange={(e) => set("section", e.target.value)}>
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>

        <label>
          Title
          <input value={doc.title} onChange={(e) => set("title", e.target.value)} />
        </label>

        {message && <p className="error">{message}</p>}

        <button className="primary" disabled={busy}>Save changes</button>
        <button type="button" className="danger" onClick={remove} disabled={busy}>
          Remove this file
        </button>
      </form>
    </main>
  );
}
