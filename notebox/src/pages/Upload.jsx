import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { makePdf } from "../lib/makePdf";
import { compressPdf } from "../lib/compressPdf";
import BackLink from "../components/BackLink";

const SECTIONS = [
  { id: "notes", label: "Notes" },
  { id: "homework", label: "Today's homework" },
  { id: "internal", label: "Internal paper" },
  { id: "external", label: "External paper" },
  { id: "assignment", label: "Assignment" },
];
const ALLOWED = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"];
const MAX_MB = 15;
const RAW_MAX_MB = 150;

function extOf(name) {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

export default function Upload() {
  const [subjects, setSubjects] = useState([]);
  const [mode, setMode] = useState("photos"); // photos | file
  const [params] = useSearchParams();
const presetSubject = params.get("subject") || "";
const presetSection = params.get("section") || "";
const [subject, setSubject] = useState(presetSubject);
const [section, setSection] = useState(
  SECTIONS.some((s) => s.id === presetSection) ? presetSection : "notes"
);
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [files, setFiles] = useState([]);
  const [docFile, setDocFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [shrinking, setShrinking] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(null);

  useEffect(() => {
    supabase
      .from("subjects")
      .select("code, name")
      .order("code")
      .then(({ data }) => {
  const list = data || [];
  setSubjects(list);
  setSubject((old) => (list.some((s) => s.code === old) ? old : ""));
});
const locked =
  Boolean(presetSubject) &&
  SECTIONS.some((s) => s.id === presetSection) &&
  (subjects.length === 0 || subjects.some((s) => s.code === presetSubject));
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
    const isPdf = extOf(f.name) === "pdf";
    const limit = isPdf ? RAW_MAX_MB : MAX_MB;
    if (f.size > limit * 1024 * 1024) {
      setMessage(`That file is over ${limit} MB. Try a smaller one.`);
      return;
    }
    setMessage("");
    setDocFile(f);
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function shrink() {
    setMessage("");
    setShrinking(true);
    try {
      const out = await compressPdf(docFile, (i, n) =>
        setProgress(`Page ${i} of ${n}`)
      );
      if (out.size >= docFile.size) {
        setMessage("This PDF can't be made smaller.");
      } else {
        setDocFile(new File([out], docFile.name, { type: "application/pdf" }));
      }
    } catch (err) {
      console.error(err);
      setMessage(`Could not shrink: ${err?.message || err}`);
    }
    setShrinking(false);
    setProgress("");
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
    if (mode === "file" && docFile.size > MAX_MB * 1024 * 1024)
      return setMessage(`Shrink the PDF below ${MAX_MB} MB first.`);
    if (!title.trim()) return setMessage("Add a title.");

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
       <Link className="back wide" to={`/subject/${done.subject}/${done.section}`}>
  Back to files
</Link>
      </main>
    );
  }

  return (
    <main className="app">
    <BackLink
  to={
    locked
      ? `/subject/${subject}/${section}`
      : subject
      ? `/subject/${subject}`
      : "/"
  }
/>
   <h1>{locked ? "Add photos" : "Add notes or paper"}</h1>

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
        {locked ? (
  <p className="context">
    Adding to{" "}
    <strong>
      {subjects.find((s) => s.code === subject)?.name || subject}
    </strong>{" "}
    · {SECTIONS.find((s) => s.id === section)?.label}
  </p>
) : (
  <>
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
  </>
)}
        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              section === "internal" ? "IA 1, 14 Mar 2025"
              : section === "external" ? "2025-26 Dec-Jan"
              : "Unit 2 notes"
            }
          />
        </label>

        <label>
          Your name (optional)
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        {mode === "photos" && (
          <>
            <div className="photo-actions">
  <label className="seg-btn pick">
    Take photo
    <input
      className="sr-file"
      type="file"
      accept="image/*"
      capture="environment"
      onChange={addFiles}
    />
  </label>
  <label className="seg-btn pick">
    Choose from gallery
    <input
      className="sr-file"
      type="file"
      accept="image/*"
      multiple
      onChange={addFiles}
    />
  </label>
</div>
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
              File (PDF, Word, PowerPoint, Excel or text, up to {RAW_MAX_MB} MB for PDFs, {MAX_MB} MB for other files)
              <input
                type="file"
                accept={ALLOWED.map((e) => "." + e).join(",")}
                onChange={pickDoc}
              />
            </label>
            {docFile && (
              <>
                <p className="muted">
                  Selected: {docFile.name} ({(docFile.size / 1024 / 1024).toFixed(1)} MB)
                </p>
                {extOf(docFile.name) === "pdf" && docFile.size > 5 * 1024 * 1024 && (
                  <button type="button" className="seg-btn" onClick={shrink} disabled={shrinking}>
                    {shrinking ? `Shrinking... ${progress}` : "Shrink this PDF"}
                  </button>
                )}
              </>
            )}
          </>
        )}

        {message && <p className="error">{message}</p>}

        <button className="primary" disabled={busy || shrinking}>
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
