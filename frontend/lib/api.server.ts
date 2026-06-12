// Server-only module: uses the Docker internal network URL.
// The browser-facing NEXT_PUBLIC_API_URL (localhost:8000) does not resolve
// from inside the Next.js container. The backend service is reachable via
// its Docker Compose service name instead.

import type { SystemOut } from "./types"
import { ApiError } from "./errors"

export { ApiError }

const SERVER_BASE =
  process.env.INTERNAL_API_URL ?? "http://backend:8000"

export async function getSystemServer(id: string): Promise<SystemOut> {
  const res = await fetch(`${SERVER_BASE}/api/systems/${id}`, {
    cache: "no-store",
  })
  if (!res.ok) {
    throw new ApiError(res.status, `API ${res.status}`)
  }
  return res.json() as Promise<SystemOut>
}
