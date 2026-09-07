import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { fallbackImage, formatINR, type Product } from "@/lib/kalacart";
import { listDashboardProducts, publishProduct, updateProduct } from "@/lib/kalacart.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Seller Dashboard | KalaCart" },
      {
        name: "description",
        content:
          "Review artisan listings, publish drafts created from WhatsApp photos, and track orders per product.",
      },
      { property: "og:title", content: "Seller Dashboard | KalaCart" },
      { property: "og:description", content: "Manage artisan listings and track orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type Row = Product & { order_count: number };

function Dashboard() {
  const queryClient = useQueryClient();
  const fetchRows = useServerFn(listDashboardProducts);
  const publish = useServerFn(publishProduct);
  const update = useServerFn(updateProduct);
  const [editing, setEditing] = useState<Row | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-products"],
    queryFn: async () => (await fetchRows()) as unknown as Row[],
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => publish({ data: { id } }),
    onSuccess: () => {
      toast.success("Listing published — it's live in the shop now.");
      void queryClient.invalidateQueries({ queryKey: ["dashboard-products"] });
      void queryClient.invalidateQueries({ queryKey: ["products", "published"] });
    },
    onError: () => toast.error("Couldn't publish that listing. Please try again."),
  });

  const rows = data ?? [];

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">Seller dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every listing on KalaCart, including drafts created from WhatsApp photos.
        </p>

        {isError ? (
          <div className="mt-10 rounded-xl border border-border bg-card p-12 text-center">
            <p className="font-serif text-lg font-semibold">We couldn't load your listings</p>
            <Button onClick={() => void refetch()} className="mt-5 rounded-full px-8">
              {isFetching ? "Retrying…" : "Try again"}
            </Button>
          </div>
        ) : isLoading ? (
          <div className="mt-8 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-14 text-center">
            <p className="font-serif text-xl font-semibold">No listings yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Artisans send a photo on WhatsApp and their draft listing appears right here.
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-border bg-secondary text-left">
                <tr>
                  <th className="p-4 font-semibold">Product</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Price</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Orders</th>
                  <th className="p-4 font-semibold">Created</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={row.image_url || fallbackImage(row)}
                          alt={row.title}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium">{row.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.seller_name} · {row.seller_location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{row.category}</td>
                    <td className="p-4 font-medium">{formatINR(Number(row.price))}</td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          row.status === "published"
                            ? "bg-primary text-primary-foreground"
                            : "bg-gold text-gold-foreground",
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4">{row.order_count}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-4">
                      {row.status === "draft" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="rounded-full"
                            disabled={publishMutation.isPending}
                            onClick={() => publishMutation.mutate(row.id)}
                          >
                            Publish
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setEditing(row)}
                          >
                            Edit
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Live</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EditDialog
        row={editing}
        onClose={() => setEditing(null)}
        onSave={async (values) => {
          try {
            await update({ data: values });
            toast.success("Listing updated");
            setEditing(null);
            void queryClient.invalidateQueries({ queryKey: ["dashboard-products"] });
          } catch (error) {
            console.error(error);
            toast.error("Couldn't save those changes. Please try again.");
          }
        }}
      />
    </PageShell>
  );
}

type EditValues = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  seller_name: string;
  seller_location: string;
  materials: string[];
  size_options: string[];
};

function EditDialog({
  row,
  onClose,
  onSave,
}: {
  row: Row | null;
  onClose: () => void;
  onSave: (values: EditValues) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  if (!row) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Edit listing</DialogTitle>
        </DialogHeader>

        <form
          id="edit-listing"
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            setSaving(true);
            await onSave({
              id: row.id,
              title: String(fd.get("title") ?? "").trim(),
              description: String(fd.get("description") ?? "").trim(),
              category: String(fd.get("category") ?? "").trim(),
              price: Number(fd.get("price")),
              seller_name: String(fd.get("seller_name") ?? "").trim(),
              seller_location: String(fd.get("seller_location") ?? "").trim(),
              materials: String(fd.get("materials") ?? "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              size_options: String(fd.get("size_options") ?? "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            });
            setSaving(false);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={row.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} defaultValue={row.description} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" defaultValue={row.category} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input id="price" name="price" type="number" defaultValue={Number(row.price)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller_name">Artisan name</Label>
              <Input id="seller_name" name="seller_name" defaultValue={row.seller_name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller_location">Location</Label>
              <Input id="seller_location" name="seller_location" defaultValue={row.seller_location} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="materials">Materials (comma separated)</Label>
            <Input id="materials" name="materials" defaultValue={row.materials.join(", ")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size_options">Sizes (comma separated)</Label>
            <Input id="size_options" name="size_options" defaultValue={row.size_options.join(", ")} />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-listing" className="rounded-full" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
