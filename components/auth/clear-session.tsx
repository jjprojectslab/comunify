"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function ClearSessionOnMount() {
  useEffect(() => {
    // Check if there's an invalid session and clear it
    const clearInvalidSession = async () => {
      try {
        const supabase = createClient()
        
        // Check if there's a session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // Try to validate the session by getting the user
          const { error } = await supabase.auth.getUser()
          
          if (error) {
            // Session is invalid, clear it
            await supabase.auth.signOut({ scope: 'local' })
          }
        }
      } catch {
        // On error, try to clear session
        try {
          const supabase = createClient()
          await supabase.auth.signOut({ scope: 'local' })
        } catch {
          // Ignore
        }
      }
    }
    
    clearInvalidSession()
  }, [])

  return null
}
