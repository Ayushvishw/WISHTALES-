"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/#occasions", label: "Occasions" },
  { href: "/birthday", label: "Templates" },
  { href: "/#how", label: "How it works" },
  { href: "/#faq", label: "Questions" },
];

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Wish Tale home">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffc861" />
            <stop offset=".55" stopColor="#ff6b9a" />
            <stop offset="1" stopColor="#8b7bff" />
          </linearGradient>
        </defs>
        <path className="logo-star" d="M16 2c1.1 8.3 5.7 12.9 14 14-8.3 1.1-12.9 5.7-14 14-1.1-8.3-5.7-12.9-14-14 8.3-1.1 12.9-5.7 14-14z" fill="url(#lg)" />
        <circle className="logo-dot" cx="26" cy="6" r="2.2" fill="#ffc861" />
      </svg>
      <b>Wish<i>Tale</i></b>
    </Link>
  );
}

/** Site header: clear over the hero, frosted glass once the page scrolls. */
export function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <header className={`hdr${solid || open ? " solid" : ""}`}>
      <div className="hdr-in">
        <Logo />
        <nav className="hdr-nav" aria-label="Main">
          {NAV.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
        </nav>
        <Link href="/birthday" className="hdr-cta">Create a surprise</Link>
        <button className={`hdr-burger${open ? " on" : ""}`} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <i /><i />
        </button>
      </div>
      {open && (
        <nav className="hdr-sheet" aria-label="Main">
          {NAV.map((n, i) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} style={{ animationDelay: `${i * 60}ms` }}>{n.label}</Link>
          ))}
          <Link href="/birthday" className="mbtn" onClick={() => setOpen(false)}><span>Create a surprise</span></Link>
        </nav>
      )}
    </header>
  );
}
