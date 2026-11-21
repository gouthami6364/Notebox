import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Subject from "./pages/subject";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/subject/:code" element={<Subject />} />
    </Routes>
  );
}