import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Subject from "./pages/subject";
import Upload from "./pages/Upload";
import Section from "./pages/Section";

export default function App() {
  return (
    <Routes>
      <Route path="/subject/:code/:section" element={<Section />} />
      <Route path="/" element={<Home />} />
      <Route path="/subject/:code" element={<Subject />} />
      <Route path="/upload" element={<Upload />} />
    </Routes>
  );
}