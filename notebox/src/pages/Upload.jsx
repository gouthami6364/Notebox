import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { makePdf } from "../lib/makePdf";

const SECTIONS = [
  { id: "notes", label: "Notes" },
  { id: "homework", label: "Today's homework" },
  { id: "internal", label: "Internal paper" },
  { id: "external", label: "External paper" },
  { id: "assignment", label: "Assignment" },
];
const SESSIONS = ["Dec-Jan", "Jun-Jul"];
const ALLOWED = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"];
const MAX_MB = 20;

function extOf(name) {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

export default function Upload() {
  const [subjects, setSubjects] = useState([]);
  const [mode, setMode] = useState("photos"); // photos | file
  const [subject, setSubject] = useState("");
  const [section, setSection] = useState("notes");
  const [title, setTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [year, setYear] = useState("");
  const [session, setSession] = useState(SESSIONS[0]);
  const [name, setName] = useState("");
  const [files, setFiles] = useState([]);
  const [docFile, setDocFile] = useState(null);
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

  function pickDoc(e) {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (!ALLOWED.includes(extOf(f.name))) {
      setMessage("Use a PDF, Word, PowerPoint, Excel or text file.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setMessage(`That file is over ${MAX_MB} MB. Try a smaller one.`);
      return;
    }
    setMessage("");
    setDocFile(f);
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ""));
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
    if (mode === "photos" && files.length === 0)
      return setMessage("Add at least one photo.");
    if (mode === "file" && !docFile) return setMessage("Choose a file.");
    if (!title.trim()) return setMessage("Add a title.");
    if (section === "internal" && !examDate)
      return setMessage("Choose the exam date.");
    if (section === "external" && !year.trim())
      return setMessage("Enter the academic year, like 2025-26.");

    setBusy(true);
    try {
      let body, ext, contentType;
      if (mode === "photos") {
        body = await makePdf(files.map((f) => f.file));
        ext = "pdf";
        contentType = "application/pdf";
      } else {
        body = docFile;
        ext = extOf(docFile.name);
        contentType = docFile.type || "application/octet-stream";
      }

      const path = `${subject}/${section}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage
        .from("notes")
        .upload(path, body, { contentType });
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

      <div className="seg" role="group" aria-label="What are you adding?">
        <button
          type="button"
          className={mode === "photos" ? "on" : ""}
          aria-pressed={mode === "photos"}
          onClick={() => setMode("photos")}
        >
          Photos
        </button>
        <button
          type="button"
          className={mode === "file" ? "on" : ""}
          aria-pressed={mode === "file"}
          onClick={() => setMode("file")}
        >
          File
        </button>
      </div>

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

        {mode === "photos" && (
          <>
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
          </>
        )}

        {mode === "file" && (
          <>
            <label>
              File (PDF, Word, PowerPoint, Excel or text, up to {MAX_MB} MB)
              <input
                type="file"
                accept={ALLOWED.map((e) => "." + e).join(",")}
                onChange={pickDoc}
              />
            </label>
            {docFile && (
              <p className="muted">
                Selected: {docFile.name} ({(docFile.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            )}
          </>
        )}

        {message && <p className="error">{message}</p>}

        <button className="primary" disabled={busy}>
          {busy
            ? "Uploading..."
            : mode === "photos"
            ? "Make PDF and upload"
            : "Upload file"}
        </button>
      </form>
    </main>
  );
}