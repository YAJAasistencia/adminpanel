"use client";

export type BrandHeadOptions = {
  title?: string;
  logoUrl?: string;
  appName?: string;
  cacheSeed?: string | number;
};

function withCacheBust(url: string, seed: string | number) {
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(String(seed))}`;
}

function upsertLink(rel: string, href: string, attrs?: Record<string, string>) {
  let link = document.querySelector(`link[rel=\"${rel}\"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      link?.setAttribute(key, value);
    });
  }
}

export function syncBrandHead({ title, logoUrl, appName, cacheSeed }: BrandHeadOptions) {
  if (typeof document === "undefined") return () => {};

  if (title) {
    document.title = title;
  }

  if (!logoUrl) {
    return () => {};
  }

  const seed = cacheSeed ?? Date.now();
  const iconHref = withCacheBust(logoUrl, seed);

  upsertLink("icon", iconHref, { type: "image/png" });
  upsertLink("shortcut icon", iconHref, { type: "image/png" });
  upsertLink("apple-touch-icon", iconHref, { type: "image/png", sizes: "180x180" });

  const manifest = {
    name: appName || "YAJA Asistencia",
    short_name: (appName || "YAJA").slice(0, 12),
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0F172A",
    icons: [
      { src: iconHref, sizes: "192x192", type: "image/png" },
      { src: iconHref, sizes: "512x512", type: "image/png" },
      { src: iconHref, sizes: "512x512", type: "image/png", purpose: "maskable any" },
    ],
  };

  const manifestBlob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
  const manifestUrl = URL.createObjectURL(manifestBlob);
  upsertLink("manifest", manifestUrl);

  return () => {
    URL.revokeObjectURL(manifestUrl);
  };
}
