import { AuthLayout } from "@/components/auth/auth-layout"
import { LoginForm } from "@/components/auth/login-form"
import { ClearSessionOnMount } from "@/components/auth/clear-session"

export default function LoginPage() {
  return (
    <>
      <ClearSessionOnMount />
      <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue managing your church">
        <LoginForm />
      </AuthLayout>
    </>
  )
}
