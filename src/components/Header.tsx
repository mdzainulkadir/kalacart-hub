import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Menu, Search, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { BECOME_SELLER_URL } from "@/lib/kalacart";

export function Header() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { q?: string };
  const [term, setTerm] = useState(search.q ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useCart();

  useEffect(() => {
    setTerm(search.q ?? "");
  }, [search.q]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    void navigate({ to: "/", search: { q: term || undefined }, hash: "shop" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <form onSubmit={submit} className="relative ml-auto hidden max-w-sm flex-1 md:block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              void navigate({
                to: "/",
                search: { q: e.target.value || undefined },
                replace: true,
              });
            }}
            placeholder="Search crafts, categories…"
            aria-label="Search products"
            className="rounded-full bg-card pl-9"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button asChild variant="default" className="hidden rounded-full sm:inline-flex">
            <a href={BECOME_SELLER_URL} target="_blank" rel="noreferrer">
              Become a Seller
            </a>
          </Button>

          <Button asChild variant="ghost" size="icon" className="relative rounded-full">
            <Link to="/cart" aria-label={`Cart with ${count} items`}>
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background p-6">
              <SheetTitle className="font-serif text-xl">Menu</SheetTitle>
              <form onSubmit={submit} className="mt-6">
                <Input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Search crafts…"
                  aria-label="Search products"
                  className="rounded-full bg-card"
                />
              </form>
              <nav className="mt-6 flex flex-col gap-3 text-sm">
                <Link to="/" hash="shop" onClick={() => setMenuOpen(false)}>
                  Shop all crafts
                </Link>
                <Link to="/" hash="contact" onClick={() => setMenuOpen(false)}>
                  Contact
                </Link>
                <Link to="/cart" onClick={() => setMenuOpen(false)}>
                  Cart ({count})
                </Link>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                  Seller dashboard
                </Link>
              </nav>
              <Button asChild className="mt-6 w-full rounded-full">
                <a href={BECOME_SELLER_URL} target="_blank" rel="noreferrer">
                  Become a Seller
                </a>
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
