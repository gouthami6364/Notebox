import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BookOpen,
  PenLine,
  FileText,
  CalendarCheck,
  GraduationCap,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import BackLink from "../components/BackLink";
import { getAllDocs } from "../lib/docs";

const SECTIONS = [
  { id: "notes", title: "Notes", hint: "Newest first", Icon: BookOpen },
  { id: "homework", title: "Today's homework", hint: "Newest first", Icon: PenLine },
  { id: "assignment", title: "Assignments", hint: "Newest first", Icon: FileText },
  { id: "internal", title: "Internal papers", hint: "Newest first", Icon: CalendarCheck },
  { id: "external", title: "External papers", hint: "Newest first", Icon: GraduationCap },
];

export default function Subject() {
  const { code } = useParams();
  const [subject, setSubject] = useState(null);
  const [counts, setCounts] = useState(null); // null means "unknown"
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setFailed(false);
      setSubject(null);
      setCounts(null);

      // Same query as the Home page, so the offline copy is reused
      const list = await supabase
        .from("subjects")
        .select("code, name")
        .order("code");

      if (!alive) return;

      if (list.error) {
        setFailed(true);
        setLoading(false);
        return;
      }
      setSubject((list.data || []).find((s) => s.code === code) || null);
      setLoading(false);

      // Counts come from the saved list of all files
      const { docs } = await getAllDocs();
      if (!alive || !docs) return;
      const c = {};
      docs
        .filter((d) => d.subject_code === code)
        .forEach((row) => {
          c[row.section] = (c[row.section] || 0) + 1;
        });
      setCounts(c);
    }
    load();
    return () => {
      alive = false;
    };
  }, [code]);

  if (loading) {
    return (
      <main className="app">
        <BackLink to="/" />
        <p className="muted">Loading...</p>
      </main>
    );
  }

  if (failed) {
    return (
      <main className="app">
        <BackLink to="/" />
        <p>Couldn't load this subject.</p>
        <p className="muted">
          If you're offline, open the app on the home screen once with internet
          so your subjects are saved on this phone.
        </p>
      </main>
    );
  }

  if (!subject) {
    return (
      <main className="app">
        <BackLink to="/" />
        <p>Subject not found.</p>
      </main>
    );
  }

  return (
    <main className="app">
      <BackLink to="/" />

      <div>
        <h1>{subject.name}</h1>
        <div className="muted">{subject.code}</div>
      </div>

      <ul className="list">
        {SECTIONS.map((sec) => (
          <li key={sec.id}>
            <Link className="row between" to={`/subject/${code}/${sec.id}`}>
              <span className="with-icon">
                <span className="ico" aria-hidden="true">
                  <sec.Icon size={22} />
                </span>
                <span>
                  <strong>{sec.title}</strong>
                  <br />
                  <span className="muted">{sec.hint}</span>
                </span>
              </span>
              <span className="muted">
                {counts === null ? "" : counts[sec.id] || 0}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link className="primary" to="/upload">+ Add to this subject</Link>
    </main>
  );
}