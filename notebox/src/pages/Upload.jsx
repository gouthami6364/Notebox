import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { makePdf } from "../lib/makePdf";


const SECTIONS = [
  { id: "notes", label: "Notes" },
  { id: "homework", label: "Today's homework" },
  { id: "internal", label: "Internal paper" },
  { id: "external", label: "External paper" },
];

const SESSIONS = ["Dec-Jan", "Jun-Jul"];

export default function Upload() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState("");
  const [section, setSection] = useState("notes");
  const [title, setTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [year, setYear] = useState("");
  const [session, setSession] = useState(SESSIONS[0]);
  const [name, setName] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(null);

  useEffect(() => {
    supabase
      .from("subjects")
      .select("code, name")
      .order("code")
      .then(({ data }) => setSubjects(data || []));
  }, []);

  function addFiles(e) {
    const picked = Array.from(e.target.files).map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    setFiles((old) => [...old, ...picked]);
    e.target.value = "";
  }

  function move(i, d) {
    setFiles((old) => {
      const next = [...old];
      const j = i + d;
      if (j < 0 || j >= next.length) return old;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function remove(i) {
    setFiles((old) => old.filter((_, k) => k !== i));
  }

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    if (!subject) return setMessage("Choose a subject.");
    if (files.length === 0) return setMessage("Add at least one photo.");
    if (!title.trim()) return setMessage("Add a title.");
    if (section === "internal" && !examDate) return setMessage("Choose the exam date.");
    if (section === "external" && !year.trim()) return setMessage("Enter the academic year, like 2025-26.");

    setBusy(true);
    try {
      const pdf = await makePdf(files.map((f) => f.file));
      const path = `${subject}/${section}/${crypto.randomUUID()}.pdf`;

      const up = await supabase.storage
        .from("notes")
        .upload(path, pdf, { contentType: "application/pdf" });
      if (up.error) throw up.error;

      const ins = await supabase.from("documents").insert({
        subject_code: subject,
        section,
        title: title.trim(),
        exam_date: section === "internal" ? examDate : null,
        academic_year: section === "external" ? year.trim() : null,
        session: section === "external" ? session : null,
        file_path: path,
        uploaded_by: name.trim() || null,
      });
      if (ins.error) throw ins.error;

     setDone({ subject, section, title: title.trim() });
     setBusy(false);
    } catch (err) {
      console.error(err);
      setMessage("Upload failed. Check your connection and try again.");
      setBusy(false);
    }
  }
if (done) {
  const link = `${window.location.origin}/#/subject/${done.subject}/${done.section}`;
  const text = `New upload: ${done.title} (${done.subject}). Open it here: ${link}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return (
    <main className="app">
      <h1>Uploaded</h1>
      <p className="muted">Let the class know with one tap.</p>
      <a className="primary" href={wa} target="_blank" rel="noreferrer">
        Share to WhatsApp
      </a>
      <Link className="back wide" to={`/subject/${done.subject}`}>
        Back to subject
      </Link>
    </main>
  );
}
  return (
    <main className="app">
      <Link className="back" to="/" aria-label="Back">‹</Link>
      <h1>Add notes or paper</h1>

      <form className="form" onSubmit={submit}>
        <label>
          Subject
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Choose...</option>
            {subjects.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} · {s.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Section
          <select value={section} onChange={(e) => setSection(e.target.value)}>
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>

        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Unit 2 notes"
          />
        </label>

        {section === "internal" && (
          <label>
            Exam date
            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </label>
        )}

        {section === "external" && (
          <>
            <label>
              Academic year
              <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2025-26" />
            </label>
            <label>
              Session
              <select value={session} onChange={(e) => setSession(e.target.value)}>
                {SESSIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </>
        )}

        <label>
          Your name (optional)
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label>
          Photos
          <input type="file" accept="image/*" multiple onChange={addFiles} />
        </label>

        {files.length > 0 && (
          <ul className="thumbs">
            {files.map((f, i) => (
              <li key={f.url}>
                <img src={f.url} alt={`Page ${i + 1}`} />
                <span className="muted">Page {i + 1}</span>
                <button type="button" onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                <button type="button" onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                <button type="button" onClick={() => remove(i)} aria-label="Remove">✕</button>
              </li>
            ))}
          </ul>
        )}

        {message && <p className="error">{message}</p>}

        <button className="primary" disabled={busy}>
          {busy ? "Making PDF and uploading..." : "Make PDF and upload"}
        </button>
      </form>
    </main>
  );
}