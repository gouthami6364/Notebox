import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackLink({ to, label = "Back" }) {
  return (
    <Link className="back" to={to} aria-label={label}>
      <ArrowLeft size={30} strokeWidth={2.5} aria-hidden="true" />
    </Link>
  );
}