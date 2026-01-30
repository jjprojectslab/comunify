import React from "react"
import { SessionHandler } from "@/components/auth/session-handler"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SessionHandler>{children}</SessionHandler>
}
