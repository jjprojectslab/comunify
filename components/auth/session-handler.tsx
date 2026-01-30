"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function SessionHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    // Check session validity on mount
    const checkSession = async () => {
      try {
        const { error } = await supabase.auth.getUser()
        if (error) {
          // Session is invalid, clear and redirect
          await supabase.auth.signOut({ scope: 'local' })
          router.replace("/login")
          return
        }
        setIsChecking(false)
      } catch {
        // On any error, redirect to login
        await supabase.auth.signOut({ scope: 'local' })
        router.replace("/login")
      }
    }
    
    checkSession()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Show nothing while checking to prevent flash
  if (isChecking) {
    return null
  }

  return <>{children}</>
}
