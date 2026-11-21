import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Gate from "./pages/Gate";
import Home from "./pages/Home";
import Subject from "./pages/subject";
import Section from "./pages/Section";
import Upload from "./pages/Upload";
import Edit from "./pages/Edit";

export default function App() {
  const [status, setStatus] = useState("checking"); // checking | locked | open

  async function verify() {
    const code = localStorage.getItem("classCode");
    if (!code) return setStatus("locked");
    const { data } = await supabase.rpc("check_code", { c: code });
    if (data) setStatus("open");
    else {
      localStorage.removeItem("classCode");
      setStatus("locked");
    }
  }

  useEffect(() => {
    verify();
  }, []);

  if (status === "checking") {
    return <main className="app"><p className="muted">Loading...</p></main>;
  }
  if (status === "locked") {
    return <Gate onUnlock={() => setStatus("open")} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/subject/:code" element={<Subject />} />
      <Route path="/subject/:code/:section" element={<Section />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/edit/:id" element={<Edit />} />
    </Routes>
  );
}