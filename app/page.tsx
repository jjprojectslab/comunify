"use client"

import Link from "next/link"
import { Church, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"

export default function HomePage() {
  const { t } = useI18n()

  const features = [
    {
      title: t.landing.feature1Title,
      description: t.landing.feature1Desc,
    },
    {
      title: t.landing.feature2Title,
      description: t.landing.feature2Desc,
    },
    {
      title: t.landing.feature3Title,
      description: t.landing.feature3Desc,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between py-4 px-4 md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Church className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">Comunify</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              {t.landing.signIn}
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">{t.landing.getStarted}</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-2xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {t.landing.tagline}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance">
            {t.landing.heroTitle} <span className="text-primary">{t.landing.heroHighlight}</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
            {t.landing.heroDescription}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 text-base">
                {t.landing.startFree}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base bg-transparent">
                {t.landing.signInAccount}
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors"
            >
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 text-center border-t border-border">
        <p className="text-sm text-muted-foreground">© 2026 Comunify. {t.landing.footer}</p>
      </footer>
    </div>
  )
}
