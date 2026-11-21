import { Link, useParams } from "react-router-dom";
import { subjects } from "../data/subjects";

const sections = [
  { id: "notes", title: "Notes", hint: "By unit, newest first" },
  { id: "homework", title: "Today's homework", hint: "Past days move to history" },
  { id: "internal", title: "Internal papers", hint: "By date" },
  { id: "external", title: "External papers", hint: "By academic year and session" },
];

export default function Subject() {
  const { code } = useParams();
  const subject = subjects.find((s) => s.code === code);

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
        {sections.map((sec) => (
          <li key={sec.id}>
            <button className="row">
              <span>
                <strong>{sec.title}</strong>
                <br />
                <span className="muted">{sec.hint}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}