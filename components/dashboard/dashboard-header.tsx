"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { signOut } from "@/app/actions/auth"
import { useI18n } from "@/lib/i18n/context"
import { 
  Church, 
  LogOut, 
  Menu, 
  User, 
  Settings, 
  Globe,
  ChevronDown,
  HelpCircle
} from "lucide-react"

interface DashboardHeaderProps {
  userName: string
  userRole: string
}

export function DashboardHeader({ userName, userRole }: DashboardHeaderProps) {
  const { t, language, setLanguage } = useI18n()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const roleLabel = userRole ? (t.roles[userRole as keyof typeof t.roles] || userRole) : t.roles.MEMBER

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      // If signOut fails, redirect manually
      router.push("/")
    }
  }

  const navigateTo = (path: string) => {
    setIsMenuOpen(false)
    router.push(path)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Church className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground hidden sm:inline">Comunify</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="uppercase">{language}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage("es")}>
                  <span className={language === "es" ? "font-medium" : ""}>Español</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")}>
                  <span className={language === "en" ? "font-medium" : ""}>English</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs text-muted-foreground">{roleLabel}</p>
                  </div>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground font-normal">{roleLabel}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigateTo("/dashboard/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  {t.header.profile}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateTo("/dashboard/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t.header.settings}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateTo("/dashboard/help")}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  {t.header.help}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t.common.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                      <Church className="h-4 w-4 text-primary-foreground" />
                    </div>
                    Comunify
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{userName}</p>
                      <p className="text-xs text-muted-foreground">{roleLabel}</p>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <nav className="flex flex-col gap-1">
                    <Button 
                      variant="ghost" 
                      className="justify-start gap-3 h-11"
                      onClick={() => navigateTo("/dashboard/profile")}
                    >
                      <User className="h-4 w-4" />
                      {t.header.profile}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start gap-3 h-11"
                      onClick={() => navigateTo("/dashboard/settings")}
                    >
                      <Settings className="h-4 w-4" />
                      {t.header.settings}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start gap-3 h-11"
                      onClick={() => navigateTo("/dashboard/help")}
                    >
                      <HelpCircle className="h-4 w-4" />
                      {t.header.help}
                    </Button>
                  </nav>

                  {/* Language */}
                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground mb-2 px-3">{t.common.language}</p>
                    <div className="flex gap-2 px-3">
                      <Button
                        variant={language === "es" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLanguage("es")}
                        className={language !== "es" ? "bg-transparent" : ""}
                      >
                        Español
                      </Button>
                      <Button
                        variant={language === "en" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLanguage("en")}
                        className={language !== "en" ? "bg-transparent" : ""}
                      >
                        English
                      </Button>
                    </div>
                  </div>

                  {/* Sign Out */}
                  <div className="border-t pt-4 mt-auto">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      {t.common.signOut}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
