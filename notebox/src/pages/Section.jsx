import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import { supabase } from "../lib/supabase";
import BackLink from "../components/BackLink";

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

export default function Section() {
  const { code, section } = useParams();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("documents")
      .select("*")
      .eq("subject_code", code)
      .eq("section", section)
      .is("deleted_at", null)
      .then(({ data, error }) => {
        if (error) setError("Could not load files.");
        else setDocs(sortDocs(data || []));
        setLoading(false);
      });
  }, [code, section]);

  function urlFor(path) {
    return supabase.storage.from("notes").getPublicUrl(path).data.publicUrl;
  }

  return (
    <main className="app">
      <BackLink to={`/subject/${code}`} />
      <div>
        <h1>{TITLES[section] || "Files"}</h1>
        <div className="muted">{code}</div>
      </div>

      <ul className="list">
        {docs.map((d) => (
          <li key={d.id} className="doc-item">
            <a
              className="row between"
              href={urlFor(d.file_path)}
              target="_blank"
              rel="noreferrer"
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
            <Link
              className="edit-btn"
              to={`/edit/${d.id}`}
              aria-label={`Edit ${d.title}`}
            >
              <Pencil size={18} aria-hidden="true" />
            </Link>
          </li>
        ))}
        {loading && <li className="empty">Loading...</li>}
        {error && <li className="empty">{error}</li>}
        {!loading && !error && docs.length === 0 && (
          <li className="empty">Nothing here yet.</li>
        )}
      </ul>
    </main>
  );
}
