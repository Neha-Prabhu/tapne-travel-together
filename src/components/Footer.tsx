import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t bg-card">
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:justify-between">
      <div className="font-semibold text-foreground">Tapne</div>
      <div className="flex gap-6">
        <Link to="/trips" className="transition hover:text-foreground">Explore</Link>
        <Link to="/experiences" className="transition hover:text-foreground">Experiences</Link>
        <Link to="/create-trip" className="transition hover:text-foreground">Create Trip</Link>
        <Link to="/login" className="transition hover:text-foreground">Login</Link>
      </div>
      <div>© 2026 Tapne. All rights reserved.</div>
    </div>
  </footer>
);

export default Footer;
