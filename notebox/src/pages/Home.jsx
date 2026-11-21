import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ThemeToggle from "../components/ThemeToggle";
export default function Home() {
  const [query, setQuery] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("subjects")
      .select("code, name")
      .order("code")
      .then(({ data, error }) => {
        if (error) setError("Could not load subjects.");
        else setSubjects(data);
        setLoading(false);
      });
  }, []);

  const shown = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="app">
     <header className="top">
  <h1>Notebox</h1>
  <div className="top-right">
    <span className="muted">Sem 5 · Section A</span>
    <ThemeToggle />
  </div>
</header>

      <input
        className="search"
        aria-label="Search subjects"
        placeholder="Search subject or code"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <ul className="list">
        {shown.map((s) => (
          <li key={s.code}>
            <Link className="row" to={`/subject/${s.code}`}>
              <span>
                <strong>{s.name}</strong>
                <br />
                <span className="muted">{s.code}</span>
              </span>
            </Link>
          </li>
        ))}
        {loading && <li className="empty">Loading...</li>}
        {error && <li className="empty">{error}</li>}
        {!loading && !error && shown.length === 0 && (
          <li className="empty">No subject found</li>
        )}
      </ul>

      <Link className="primary" to="/upload">+ Add notes or paper</Link>
    </main>
  );
}