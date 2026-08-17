import { proxyPayloadRequest, shouldProxyPayloadApi } from "@/lib/payload-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug?: string[] }> };

async function dispatch(request: Request, context: RouteContext, method: "GET" | "POST" | "DELETE" | "PATCH" | "PUT" | "OPTIONS") {
  if (shouldProxyPayloadApi()) {
    return proxyPayloadRequest(request);
  }

  const [{ default: config }, routes] = await Promise.all([
    import("@payload-config"),
    import("@payloadcms/next/routes"),
  ]);
  const handler = {
    GET: routes.REST_GET,
    POST: routes.REST_POST,
    DELETE: routes.REST_DELETE,
    PATCH: routes.REST_PATCH,
    PUT: routes.REST_PUT,
    OPTIONS: routes.REST_OPTIONS,
  }[method](config);
  return handler(request, context);
}

export const GET = (request: Request, context: RouteContext) => dispatch(request, context, "GET");
export const POST = (request: Request, context: RouteContext) => dispatch(request, context, "POST");
export const DELETE = (request: Request, context: RouteContext) => dispatch(request, context, "DELETE");
export const PATCH = (request: Request, context: RouteContext) => dispatch(request, context, "PATCH");
export const PUT = (request: Request, context: RouteContext) => dispatch(request, context, "PUT");
export const OPTIONS = (request: Request, context: RouteContext) => dispatch(request, context, "OPTIONS");
