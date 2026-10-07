import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth"];

/** Página simple cuando falta configurar Supabase, en lugar de un error 500 mudo. */
function configError(detail: string) {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Falta configuración</title>` +
      `<body style="font-family:system-ui;max-width:32rem;margin:4rem auto;padding:0 1rem;line-height:1.5">` +
      `<h1 style="font-size:1.25rem">Falta configurar Supabase</h1><p>${detail}</p>` +
      `<p>Revisá en Vercel: Settings &gt; Environment Variables (entorno Production) y volvé a hacer Deploy.</p></body>`,
    { status: 500, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function proxy(request: NextRequest) {
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"].filter((k) => !process.env[k]?.trim());
  if (missing.length) return configError(`No están cargadas: <b>${missing.join(", ")}</b>.`);

  let response = NextResponse.next({ request });
  try {
    return await withSession(request, (r) => (response = r), () => response);
  } catch (e) {
    console.error("proxy", e);
    return configError(`Supabase respondió: <code>${String((e as Error).message ?? e).replace(/</g, "&lt;").slice(0, 200)}</code>`);
  }
}

async function withSession(
  request: NextRequest,
  setResponse: (r: NextResponse) => void,
  getResponse: () => NextResponse,
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          const response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
          setResponse(response);
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const isPublic = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!data?.claims && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return getResponse();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.*|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
