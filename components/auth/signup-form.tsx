"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, User, ChevronRight, ChevronLeft, Search, MapPin, Check, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { signUp, searchOrganizations, getOrganizationLocations, getAllOrganizations } from "@/app/actions/auth"

type Step = 1 | 2 | 3

interface Organization {
  id: string
  name: string
  slug: string
}

interface Location {
  id: string
  name: string
  is_main_campus: boolean
  city?: string
  address?: string
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
  organizationId: string | null
  locationId: string | null
}

export function SignupForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    organizationId: null,
    locationId: null,
  })

  // Load initial organizations
  useEffect(() => {
    async function loadOrganizations() {
      const orgs = await getAllOrganizations()
      setOrganizations(orgs)
    }
    loadOrganizations()
  }, [])

  // Search organizations with debounce
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      const orgs = await getAllOrganizations()
      setOrganizations(orgs)
      return
    }
    
    setIsSearching(true)
    const results = await searchOrganizations(query)
    setOrganizations(results)
    setIsSearching(false)
  }, [])

  // Load locations when organization is selected
  useEffect(() => {
    async function loadLocations() {
      if (formData.organizationId) {
        setIsLoadingLocations(true)
        const locs = await getOrganizationLocations(formData.organizationId)
        setLocations(locs)
        setIsLoadingLocations(false)
        
        // Auto-select if only one location (main campus)
        if (locs.length === 1) {
          setFormData(prev => ({ ...prev, locationId: locs[0].id }))
        }
      } else {
        setLocations([])
      }
    }
    loadLocations()
  }, [formData.organizationId])

  const handleNext = () => {
    setError(null)
    if (step < 3) setStep((step + 1) as Step)
  }

  const handleBack = () => {
    setError(null)
    if (step > 1) setStep((step - 1) as Step)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (step === 3) {
      setIsLoading(true)
      
      const result = await signUp({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        organizationId: formData.organizationId,
        locationId: formData.locationId,
      })

      setIsLoading(false)

      if (!result.success) {
        setError(result.error || "An error occurred during signup")
        return
      }

      setSuccessMessage(result.message || "Account created successfully!")
      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } else {
      handleNext()
    }
  }

  const isStep1Valid = formData.firstName && formData.lastName && formData.email && formData.password && formData.password.length >= 8
  const isStep2Valid = !!formData.organizationId
  const isStep3Valid = !!formData.locationId

  if (successMessage) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="font-semibold text-lg text-foreground">Account Created!</h3>
        <p className="text-sm text-muted-foreground">{successMessage}</p>
        <p className="text-xs text-muted-foreground">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              s === step ? "w-8 bg-primary" : s < step ? "w-2 bg-primary" : "w-2 bg-border",
            )}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: User Details */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder="John"
                    className="pl-10 h-11"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  className="h-11"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10 h-11"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="pl-10 pr-10 h-11"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className={cn(
                "text-xs",
                formData.password.length > 0 && formData.password.length < 8 
                  ? "text-destructive" 
                  : "text-muted-foreground"
              )}>
                Must be at least 8 characters
              </p>
            </div>

            <Button type="submit" className="w-full h-11" disabled={!isStep1Valid}>
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <Button variant="outline" type="button" className="w-full h-11 bg-transparent">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </div>
        )}

        {/* Step 2: Find Church */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-1 pb-2">
              <h3 className="font-medium text-foreground">Find your church</h3>
              <p className="text-xs text-muted-foreground">Search and select your church from the list</p>
            </div>

            {/* Search Field */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search churches..."
                className="pl-10 h-11"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
              )}
            </div>

            {/* Organizations List */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {organizations.length === 0 && !isSearching && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No churches found. Please contact your church administrator.
                </p>
              )}
              {organizations.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      organizationId: org.id,
                      locationId: null,
                    })
                  }
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                    formData.organizationId === org.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50",
                  )}
                >
                  <span className="font-medium text-sm text-foreground">{org.name}</span>
                  {formData.organizationId === org.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>

            {/* Info message */}
            <p className="text-xs text-muted-foreground text-center">
              If your church is not listed, please contact your church administrator to register it.
            </p>

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1 h-11 bg-transparent">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-11" 
                disabled={!formData.organizationId || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Select Location */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-1 pb-2">
              <h3 className="font-medium text-foreground">Select your home campus</h3>
              <p className="text-xs text-muted-foreground">Choose the location you'll primarily attend</p>
            </div>

            {/* Locations List */}
            <div className="space-y-2">
              {isLoadingLocations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : locations.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No locations found for this church.
                </p>
              ) : (
                locations.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, locationId: location.id })}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-lg border transition-all",
                      formData.locationId === location.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          formData.locationId === location.id ? "bg-primary/10" : "bg-muted",
                        )}
                      >
                        <MapPin
                          className={cn(
                            "h-5 w-5",
                            formData.locationId === location.id ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm text-foreground">{location.name}</p>
                        {location.is_main_campus && <span className="text-xs text-primary">Main Campus</span>}
                        {location.city && !location.is_main_campus && (
                          <span className="text-xs text-muted-foreground">{location.city}</span>
                        )}
                      </div>
                    </div>
                    {formData.locationId === location.id && <Check className="h-5 w-5 text-primary" />}
                  </button>
                ))
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1 h-11 bg-transparent">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="submit" className="flex-1 h-11" disabled={!isStep3Valid || isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </div>
                ) : (
                  "Create account"
                )}
              </Button>
            </div>
          </div>
        )}
      </form>

      {/* Sign In Link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
