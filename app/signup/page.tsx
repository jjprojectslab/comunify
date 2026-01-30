import { AuthLayout } from "@/components/auth/auth-layout"
import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  return (
    <AuthLayout title="Create your account" subtitle="Join your church community and start connecting">
      <SignupForm />
    </AuthLayout>
  )
}
