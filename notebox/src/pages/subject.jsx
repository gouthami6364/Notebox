import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const SECTIONS = [
  { id: "notes", title: "Notes", hint: "Newest first" },
  { id: "homework", title: "Today's homework", hint: "Newest first" },
  { id: "internal", title: "Internal papers", hint: "By date" },
  { id: "external", title: "External papers", hint: "By academic year and session" },
];

export default function Subject() {
  const { code } = useParams();
  const [subject, setSubject] = useState(null);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const s = await supabase
        .from("subjects")
        .select("code, name")
        .eq("code", code)
        .maybeSingle();
      setSubject(s.data);

      const d = await supabase
        .from("documents")
        .select("section")
        .eq("subject_code", code);
      const c = {};
      (d.data || []).forEach((row) => {
        c[row.section] = (c[row.section] || 0) + 1;
      });
      setCounts(c);
      setLoading(false);
    }
    load();
  }, [code]);

  if (loading) {
    return (
      <main className="app">
        <Link className="back" to="/" aria-label="Back">‹</Link>
        <p className="muted">Loading...</p>
      </main>
    );
  }

  if (!subject) {
    return (
      <main className="app">
        <Link className="back" to="/" aria-label="Back">‹</Link>
        <p>Subject not found.</p>
      </main>
    );
  }

  return (
    <main className="app">
      <Link className="back" to="/" aria-label="Back">‹</Link>

      <div>
        <h1>{subject.name}</h1>
        <div className="muted">{subject.code}</div>
      </div>

      <ul className="list">
        {SECTIONS.map((sec) => (
          <li key={sec.id}>
            <Link className="row between" to={`/subject/${code}/${sec.id}`}>
              <span>
                <strong>{sec.title}</strong>
                <br />
                <span className="muted">{sec.hint}</span>
              </span>
              <span className="muted">{counts[sec.id] || 0}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link className="primary" to="/upload">+ Add to this subject</Link>
    </main>
  );
}