import { TOKEN_VALID } from "@/lib/jugador";

/** Manifest propi perquè, si el jugador l'afegeix a la pantalla d'inici, s'obri el seu enllaç. */
export async function GET(_: Request, { params }: RouteContext<"/j/[token]/manifest.webmanifest">) {
  const { token } = await params;
  if (!TOKEN_VALID.test(token)) return new Response("", { status: 404 });
  return Response.json(
    {
      name: "CE Europa · El meu wellness",
      short_name: "Wellness",
      start_url: `/j/${token}`,
      scope: `/j/${token}`,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#022e91",
      lang: "ca",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-store" } },
  );
}
