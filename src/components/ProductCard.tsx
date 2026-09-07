import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { fallbackImage, formatINR, ratingFor, type Product } from "@/lib/kalacart";
import { cn } from "@/lib/utils";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const { rating, reviews } = ratingFor(product.id);

  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className={cn(
        "card-lift group block overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={product.image_url || fallbackImage(product)}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 font-serif text-base font-semibold leading-snug">
          {product.title}
        </h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="truncate">
            {product.seller_name} · {product.seller_location}
          </span>
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="font-serif text-lg font-bold text-primary">
            {formatINR(product.price)}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden="true" />
            {rating.toFixed(1)} ({reviews})
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}
