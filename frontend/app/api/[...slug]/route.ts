import { proxyPayloadRequest } from "@/lib/payload-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug?: string[] }> };

export const GET = (request: Request, _context: RouteContext) => proxyPayloadRequest(request);
export const POST = (request: Request, _context: RouteContext) => proxyPayloadRequest(request);
export const DELETE = (request: Request, _context: RouteContext) => proxyPayloadRequest(request);
export const PATCH = (request: Request, _context: RouteContext) => proxyPayloadRequest(request);
export const PUT = (request: Request, _context: RouteContext) => proxyPayloadRequest(request);
export const OPTIONS = (request: Request, _context: RouteContext) => proxyPayloadRequest(request);
