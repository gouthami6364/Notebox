export default function Brand({ size = 40 }) {
  return (
    <div className="brand">
      <img
        src="/icon-192.png"
        alt=""
        width={size}
        height={size}
        className="brand-icon"
      />
      <span className="brand-name">Notebox</span>
    </div>
  );
}