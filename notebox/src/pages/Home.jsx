import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ThemeToggle from "../components/ThemeToggle";
import Brand from "../components/Brand";
import { getAllDocs } from "../lib/docs";
import { enablePushNotifications } from "../lib/push";

export default function Home() {
  const [query, setQuery] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllDocs(); 
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
  useEffect(() => {
  let cancelled = false;

  async function checkExistingSubscription() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!cancelled && subscription) {
        setPushEnabled(true);
        setPushMessage("Notifications are on for new uploads.");
      }
    } catch (err) {
      console.error("Could not check notification subscription:", err);
    }
  }

  checkExistingSubscription();

  return () => {
    cancelled = true;
  };
}, []);
  async function turnOnNotifications() {
  setPushBusy(true);
  setPushMessage("");

  try {
    await enablePushNotifications();
    setPushEnabled(true);
    setPushMessage("Notifications are on for new uploads.");
  } catch (err) {
    setPushMessage(err.message || "Could not enable notifications. Please try again.");
  } finally {
    setPushBusy(false);
  }
}

  const shown = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.code.toLowerCase().includes(query.toLowerCase())
  );
  const [pushBusy, setPushBusy] = useState(false);
const [pushEnabled, setPushEnabled] = useState(false);
const [pushMessage, setPushMessage] = useState("");

const isIos =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isInstalledIos =
  window.navigator.standalone === true ||
  window.matchMedia("(display-mode: standalone)").matches;

  return (
    <main className="app">
    <header className="top">
  <Brand />
  <ThemeToggle />
</header>
<div className="muted">Sem 5 · Section A</div>

      <input
        className="search"
        aria-label="Search subjects"
        placeholder="Search subject or code"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

<section className="push-card" aria-label="Upload notifications">
  <div>
    <strong>New upload alerts</strong>
    <p className="muted">
      {isIos && !isInstalledIos
        ? "On iPhone, first install Notebox: open it in Safari, tap Share, then Add to Home Screen. Open the installed app and turn notifications on here."
        : "Get a notification when a new document is added."}
    </p>
  </div>

  <button
    className="push-button"
    type="button"
    onClick={turnOnNotifications}
    disabled={
      pushBusy ||
      pushEnabled ||
      (isIos && !isInstalledIos) ||
      !("Notification" in window)
    }
  >
    {pushBusy
      ? "Enabling…"
      : pushEnabled
        ? "Notifications on"
        : "Turn on notifications"}
  </button>

  {pushMessage && (
    <p className="muted push-status" role="status">
      {pushMessage}
    </p>
  )}
</section>
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