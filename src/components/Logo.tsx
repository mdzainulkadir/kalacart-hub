import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export function PotWithHands({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 56"
      role="img"
      aria-label="A clay pot cupped by two hands"
      className={cn("h-10 w-11 shrink-0", className)}
    >
      {/* left hand */}
      <path
        d="M6 26c-2.4 1.4-3.4 4.4-2 6.9l6.6 11.6c1.6 2.9 4.6 4.7 7.9 4.7h3.1c-4.9-3.1-8.6-8-10.3-13.7L9.6 27c-.6-2-2-2-3.6-1z"
        fill="var(--skin)"
        stroke="var(--foreground)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* right hand */}
      <path
        d="M58 26c2.4 1.4 3.4 4.4 2 6.9l-6.6 11.6c-1.6 2.9-4.6 4.7-7.9 4.7h-3.1c4.9-3.1 8.6-8 10.3-13.7L54.4 27c.6-2 2-2 3.6-1z"
        fill="var(--skin)"
        stroke="var(--foreground)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* pot belly */}
      <path
        d="M32 13c-11 0-19 7.6-19 17.6C13 40.8 21.4 49 32 49s19-8.2 19-18.4C51 20.6 43 13 32 13z"
        fill="var(--clay)"
        stroke="var(--foreground)"
        strokeWidth="2.2"
      />
      {/* pot neck + rim */}
      <path
        d="M24 14.5c0-3 3.6-5 8-5s8 2 8 5"
        fill="none"
        stroke="var(--foreground)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <ellipse
        cx="32"
        cy="9"
        rx="10.5"
        ry="3.6"
        fill="var(--gold)"
        stroke="var(--foreground)"
        strokeWidth="2.2"
      />
      <path
        d="M20 30h24"
        stroke="var(--gold)"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

export function Logo({ className, textClass }: { className?: string; textClass?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)}>
      <PotWithHands />
      <span className={cn("font-serif text-2xl font-bold tracking-tight", textClass)}>
        <span className="text-primary">Kala</span>
        <span className="text-foreground">Cart</span>
      </span>
    </Link>
  );
}
