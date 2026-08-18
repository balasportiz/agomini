import { parseChangePasswordBody } from "@/lib/change-password"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const parsed = parseChangePasswordBody(await request.json().catch(() => null))
    if ("error" in parsed) {
      return Response.json({ errors: [{ message: parsed.error }] }, { status: 400 })
    }

    const { getPayload } = await import("payload")
    const { default: config } = await import("@payload-config")
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })
    if (!user || typeof user.email !== "string") {
      return Response.json({ errors: [{ message: "Sign in to change your password." }] }, { status: 401 })
    }

    try {
      await payload.login({
        collection: "users",
        data: { email: user.email, password: parsed.currentPassword },
      })
    } catch {
      return Response.json({ errors: [{ message: "Current password is incorrect." }] }, { status: 401 })
    }

    await payload.update({
      collection: "users",
      id: user.id,
      data: { password: parsed.newPassword },
      overrideAccess: true,
    })

    return Response.json({ ok: true })
  } catch {
    return Response.json({ errors: [{ message: "Could not update the password. Please try again." }] }, { status: 500 })
  }
}
