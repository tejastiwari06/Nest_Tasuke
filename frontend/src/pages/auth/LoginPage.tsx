import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TreePine, ArrowRight, Loader2 } from 'lucide-react'
import { login, loginVerify } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from '../../components/ui/Toast'

type Step = 'email' | 'otp'

export default function LoginPage() {
  const { refresh } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [cooldown, setCooldown] = useState(0)

  const handleSendCode = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setLoading(true)
    const { data, error } = await login(email)
    setLoading(false)
    if (error) {
      toast.error(error)
      return
    }
    setStep('otp')
    toast.success('Login code sent — check your email.')
    if (data?.dev_otp) {
      toast.info(`DEV MODE — OTP: ${data.dev_otp}`)
    }
  }

  const handleVerify = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const code = otp.join('')
    if (code.length < 6) return
    setLoading(true)
    const { error } = await loginVerify(email, code)
    setLoading(false)
    if (error) {
      toast.error(error)
      setOtp(['', '', '', '', '', ''])
      return
    }
    await refresh()
    toast.success('Signed in successfully.')
    navigate('/app/dashboard')
  }

  const handleOtpInput = (i: number, val: string) => {
    const digits = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[i] = digits
    setOtp(next)
    if (digits && i < 5) {
      document.getElementById(`otp-l-${i + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      document.getElementById(`otp-l-${i - 1}`)?.focus()
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setLoading(true)
    const { data, error } = await login(email)
    setLoading(false)
    if (!error) {
      toast.success('New code sent')
      if (data?.dev_otp) toast.info(`DEV MODE — OTP: ${data.dev_otp}`)
      setCooldown(60)
      const t = setInterval(() => setCooldown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 }), 1000)
    } else {
      toast.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.png" alt="Nest Tasuke Logo" className="w-10 h-10 rounded-xl shadow-lg object-cover" />
          <div>
            <p className="font-bold text-text-main tracking-wide">Nest Tasuke</p>
            <p className="text-[10px] text-text-secondary tracking-widest uppercase">Forest Intelligence</p>
          </div>
        </div>

        <div className="glass-elevated rounded-2xl p-6 shadow-2xl">
          {step === 'email' ? (
            <>
              <h1 className="text-xl font-bold text-text-main mb-1">Sign In</h1>
              <p className="text-text-secondary text-sm mb-6">Enter your email to receive a login code</p>
              <form onSubmit={handleSendCode} id="login-form" className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="label">Email address</label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="officer@forest.gov.in"
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {loading ? 'Sending code…' : 'Send login code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-text-main mb-1">Enter Code</h1>
              <p className="text-text-secondary text-sm mb-6">
                Code sent to <span className="text-text-main">{email}</span>
              </p>
              <form onSubmit={handleVerify} id="login-otp-form" className="space-y-6">
                <div className="flex gap-2 justify-center" role="group" aria-label="OTP input">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-l-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="otp-input"
                      autoFocus={i === 0}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>
                <button type="submit" disabled={loading || otp.join('').length < 6} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
              <div className="flex items-center justify-between mt-4">
                <button onClick={() => setStep('email')} className="text-sm text-text-secondary hover:text-text-main">← Change email</button>
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  className="text-sm text-violet-lavender hover:text-violet-bright disabled:text-text-secondary disabled:cursor-not-allowed transition-colors"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          New officer?{' '}
          <Link to="/register" className="text-violet-lavender hover:text-violet-bright transition-colors">Create account</Link>
        </p>
      </div>
    </div>
  )
}
