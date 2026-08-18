import { proxyBackendRequest } from "@/lib/upstream";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyBackendRequest(request, "/api/health");
}
