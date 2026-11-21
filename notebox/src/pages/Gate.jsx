import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Gate({ onUnlock }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { data, error: err } = await supabase.rpc("check_code", {
      c: code.trim(),
    });
    if (err) setError("Could not check the code. Check your connection.");
    else if (!data) setError("That code isn't right. Ask your class admin.");
    else {
      localStorage.setItem("classCode", code.trim());
      onUnlock();
    }
    setBusy(false);
  }

  return (
    <main className="app">
      <h1>Notebox</h1>
      <p className="muted">Enter your class code to continue.</p>
      <form className="form" onSubmit={submit}>
        <label>
          Class code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy || !code.trim()}>
          {busy ? "Checking..." : "Continue"}
        </button>
      </form>
    </main>
  );
}