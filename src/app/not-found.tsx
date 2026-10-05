import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap center-msg">
      <div>
        <h1 style={{ fontSize: 32 }}>We couldn&apos;t find that page</h1>
        <p className="muted">The link may be incomplete or out of date.</p>
        <Link className="btn ghost" href="/">Go to Wish Tale</Link>
      </div>
    </div>
  );
}
