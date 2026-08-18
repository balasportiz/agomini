import { proxyBackendRequest } from "@/lib/upstream";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyBackendRequest(request, `/api/photos/${encodeURIComponent(id)}/source`);
}
