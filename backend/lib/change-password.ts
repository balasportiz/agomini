export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
}

export function parseChangePasswordBody(input: unknown): ChangePasswordInput | { error: string } {
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {}
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : typeof body.oldPassword === "string" ? body.oldPassword : ""
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : ""

  if (!currentPassword.trim() || !newPassword.trim()) {
    return { error: "Enter your current password and a new password." }
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." }
  }
  if (currentPassword === newPassword) {
    return { error: "New password must be different from the current password." }
  }
  return { currentPassword, newPassword }
}
