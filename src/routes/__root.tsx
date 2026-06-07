import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { AppLayout } from "@/components/AppLayout";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 max-w-md text-center">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="mt-3 text-muted-foreground">This page is not in the field.</p>
        <Link to="/" className="mt-5 inline-block rounded-xl gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Smart Agriculture IoT Dashboard" },
      { name: "description", content: "Real-time crop monitoring & automatic irrigation dashboard powered by ESP32 + Firebase." },
      { property: "og:title", content: "Smart Agriculture IoT Dashboard" },
      { name: "twitter:title", content: "Smart Agriculture IoT Dashboard" },
      { property: "og:description", content: "Real-time crop monitoring & automatic irrigation dashboard powered by ESP32 + Firebase." },
      { name: "twitter:description", content: "Real-time crop monitoring & automatic irrigation dashboard powered by ESP32 + Firebase." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/293d873c-73b1-4c33-aa90-2902fe3350c6" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/293d873c-73b1-4c33-aa90-2902fe3350c6" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
