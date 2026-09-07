import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter } from "lucide-react";

import { Logo } from "@/components/Logo";
import { BECOME_SELLER_URL } from "@/lib/kalacart";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            KalaCart connects rural Indian artisans directly with the people who love their work —
            no middlemen, no markups, no lost stories. Every rupee you spend reaches the hands that
            made your piece.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="font-serif text-base font-semibold">Explore</h3>
          <nav className="flex flex-col gap-2 text-muted-foreground">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <Link to="/" hash="categories" className="hover:text-primary">
              Categories
            </Link>
            <a href={BECOME_SELLER_URL} target="_blank" rel="noreferrer" className="hover:text-primary">
              Become a Seller
            </a>
            <Link to="/" hash="contact" className="hover:text-primary">
              Contact
            </Link>
            <Link to="/dashboard" className="hover:text-primary">
              Seller Dashboard
            </Link>
          </nav>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="font-serif text-base font-semibold">Follow the craft</h3>
          <div className="flex gap-3">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              <Instagram className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
              <Facebook className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
              <Twitter className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
            </a>
          </div>
          <p className="pt-4 font-serif text-base italic text-primary">
            Handmade in India. Bought straight from the maker.
          </p>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} KalaCart · 100% direct-to-artisan
      </div>
    </footer>
  );
}
