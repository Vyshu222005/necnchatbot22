import { Link } from "@tanstack/react-router";
import logo from "@/assets/necn-logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <img src={logo} alt="NECN" width={32} height={32} className="rounded-full" />
            <span className="font-bold">NECN College</span>
          </div>
          <p className="text-sm text-muted-foreground">Empowering students with quality education and 24/7 AI-powered guidance.</p>
        </div>
        <div>
          <div className="font-semibold mb-3 text-sm">Quick Links</div>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li><Link to="/chatbot" className="hover:text-foreground">AI Chatbot</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3 text-sm">Contact</div>
          <p className="text-sm text-muted-foreground">NECN College, Main Road<br />Hyderabad, Telangana - 500001<br />admissions@necn.edu.in</p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} NECN College. All rights reserved.
      </div>
    </footer>
  );
}
