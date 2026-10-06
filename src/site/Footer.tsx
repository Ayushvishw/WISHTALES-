import Link from "next/link";
import { Logo } from "./Header";

export function Footer() {
  return (
    <footer className="ftr">
      <div className="ftr-glow" aria-hidden="true" />
      <div className="ftr-in">
        <div className="ftr-brand">
          <Logo />
          <p>Interactive surprises for the moments that matter. Made with love in India.</p>
        </div>
        <div className="ftr-cols">
          <div>
            <h4>Occasions</h4>
            <Link href="/birthday">Birthday</Link>
            <Link href="/anniversary">Anniversary</Link>
            <Link href="/proposal">Love &amp; Proposal</Link>
            <Link href="/wedding">Wedding</Link>
          </div>
          <div>
            <h4>Wish Tale</h4>
            <Link href="/#how">How it works</Link>
            <Link href="/birthday">All templates</Link>
            <Link href="/#faq">Questions</Link>
          </div>
        </div>
      </div>
      <p className="ftr-big" aria-hidden="true">Wish Tale</p>
      <p className="ftr-legal">© {new Date().getFullYear()} Wish Tale. Every surprise is private to the people you share it with.</p>
    </footer>
  );
}
