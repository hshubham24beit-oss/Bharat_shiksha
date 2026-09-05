import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
        await register(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold text-white font-display">
              Bharat<span className="text-saffron-400">Shikshak</span>
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black font-display text-white leading-tight mb-4">
            Learn like you're
            <br />
            <span className="text-gradient-warm">talking to a mentor</span>
          </h2>
          <p className="text-sm text-white/40 max-w-sm leading-relaxed">
            An AI teacher that adapts to your pace, catches your misconceptions, and builds real understanding — not just rote answers.
          </p>
        </div>

        <div className="relative space-y-4">
          {[
            "Socratic dialogue that adapts to you",
            "11 Indian languages supported",
            "Quiz, notes, flashcards — all personalized",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-saffron-500/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-saffron-400" />
              </div>
              <span className="text-xs text-white/50">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#faf9f7]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-extrabold text-ink-900 font-display">
                Bharat<span className="text-saffron-600">Shikshak</span>
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-black font-display text-ink-900 mb-1">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-ink-400">
              {mode === "login" ? "Sign in to continue your streak" : "Start your learning journey"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" && (
              <div>
                <label className="text-[11px] font-bold text-ink-500 mb-1.5 block uppercase tracking-wider">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-ink-200 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100 transition-all" />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-ink-500 mb-1.5 block uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-ink-200 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100 transition-all" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-ink-500 mb-1.5 block uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-ink-200 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white font-bold text-sm shadow-lg shadow-saffron-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : mode === "login" ? (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Create account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-sm text-ink-400 hover:text-saffron-600 font-medium transition-colors">
              {mode === "login" ? (
                <>New here? <span className="font-bold text-ink-600">Create an account</span></>
              ) : (
                <>Already have an account? <span className="font-bold text-ink-600">Sign in</span></>
              )}
            </button>
          </div>

          <p className="text-center text-[10px] text-ink-300 mt-8">
            Bharat Academix Hackathon 2026 · Powered by Gemini AI
          </p>
        </div>
      </div>
    </div>
  );
}
