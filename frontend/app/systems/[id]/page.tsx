import { redirect } from "next/navigation"

export default function SystemPage({ params }: { params: { id: string } }) {
  redirect(`/systems/${params.id}/architecture`)
}
