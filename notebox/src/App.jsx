import { useState } from "react";
import { subjects } from "./data/subjects";

export default function App() {
  const [query, setQuery] = useState("");

  const shown = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="app">
      <header className="top">
        <h1>Notebox</h1>
        <span className="muted">Sem 5 · Section A</span>
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
            <button className="row">
              <span>
                <strong>{s.name}</strong>
                <br />
                <span className="muted">{s.code}</span>
              </span>
            </button>
          </li>
        ))}
        {shown.length === 0 && <li className="empty">No subject found</li>}
      </ul>

      <button className="primary">+ Add notes or paper</button>
    </main>
  );
}