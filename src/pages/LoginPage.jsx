import { AuthForm } from '@/components/auth/AuthForm'

export function LoginPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center bg-[#080A0F] px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.17),transparent_45%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.12),transparent_45%)]" />
      <section className="relative z-10 w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-black tracking-[0.16em] text-[#7DD3FC] uppercase italic">
          Solo Levelling System
        </h1>
        <AuthForm />
      </section>
    </main>
  )
}