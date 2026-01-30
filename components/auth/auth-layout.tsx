import type React from "react"
import { Church } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-center py-8 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Church className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">Comunify</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md space-y-6">
          {/* Title Section */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">{title}</h1>
            <p className="text-sm text-muted-foreground text-pretty">{subtitle}</p>
          </div>

          {/* Form Content */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">{children}</div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center">
        <p className="text-xs text-muted-foreground">© 2026 Comunify. All rights reserved.</p>
      </footer>
    </div>
  )
}
