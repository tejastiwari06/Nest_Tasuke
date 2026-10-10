import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TreePine, ArrowRight, Loader2 } from 'lucide-react'
import { register, verifyEmail } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from '../../components/ui/Toast'

type Step = 'form' | 'otp'

export default function RegisterPage() {
  const { refresh } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [cooldown, setCooldown] = useState(0)
  const [form, setForm] = useState({
    full_name: '',
    designation: '',
    forest_division: '',
    forest_range: '',
    phone: '',
  })

  const updateForm = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleRegister = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setLoading(true)
    const { data, error } = await register({ email, ...form, phone: form.phone || undefined })
    setLoading(false)
    if (error) {
      toast.error(error)
      return
    }
    setStep('otp')
    toast.success('Verification code sent to your email.')
    if (data?.dev_otp) {
      toast.info(`DEV MODE — OTP: ${data.dev_otp}`)
    }
  }

  const handleOtp = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const code = otp.join('')
    if (code.length < 6) return
    setLoading(true)
    const { data, error } = await verifyEmail(email, code)
    setLoading(false)
    if (error) {
      toast.error(error)
      setOtp(['', '', '', '', '', ''])
      return
    }
    await refresh()
    toast.success('Email verified. Welcome to Nest Tasuke.')
    navigate('/app/dashboard')
  }

  const handleOtpInput = (i: number, val: string) => {
    const digits = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[i] = digits
    setOtp(next)
    if (digits && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus()
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setLoading(true)
    const { data, error } = await register({ email, ...form, phone: form.phone || undefined })
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
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.png" alt="Nest Tasuke Logo" className="w-10 h-10 rounded-xl shadow-lg object-cover" />
          <div>
            <p className="font-bold text-text-main tracking-wide">Nest Tasuke</p>
            <p className="text-[10px] text-text-secondary tracking-widest uppercase">Forest Intelligence</p>
          </div>
        </div>

        <div className="glass-elevated rounded-2xl p-6 shadow-2xl">
          {step === 'form' ? (
            <>
              <h1 className="text-xl font-bold text-text-main mb-1">Create Account</h1>
              <p className="text-text-secondary text-sm mb-6">Register as a forest officer</p>

              <form onSubmit={handleRegister} className="space-y-4" id="register-form">
                <div>
                  <label htmlFor="email" className="label">Email address</label>
                  <input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="officer@forest.gov.in" />
                </div>
                <div>
                  <label htmlFor="full_name" className="label">Full Name</label>
                  <input id="full_name" type="text" required value={form.full_name} onChange={updateForm('full_name')} className="input-field" placeholder="Rajesh Kumar" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="designation" className="label">Designation</label>
                    <input id="designation" type="text" required value={form.designation} onChange={updateForm('designation')} className="input-field" placeholder="Range Officer" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="label">Phone (optional)</label>
                    <input id="phone" type="tel" value={form.phone} onChange={updateForm('phone')} className="input-field" placeholder="+91 98765…" />
                  </div>
                </div>
                <div>
                  <label htmlFor="forest_division" className="label">Forest Division</label>
                  <input id="forest_division" type="text" required value={form.forest_division} onChange={updateForm('forest_division')} className="input-field" placeholder="North Division" />
                </div>
                <div>
                  <label htmlFor="forest_range" className="label">Forest Range</label>
                  <input id="forest_range" type="text" required value={form.forest_range} onChange={updateForm('forest_range')} className="input-field" placeholder="Range 1" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {loading ? 'Sending code…' : 'Continue with email'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-text-main mb-1">Verify Email</h1>
              <p className="text-text-secondary text-sm mb-6">
                Enter the 6-digit code sent to <span className="text-text-main">{email}</span>
              </p>

              <form onSubmit={handleOtp} id="otp-form" className="space-y-6">
                <div className="flex gap-2 justify-center" role="group" aria-label="OTP input">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
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
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>
              </form>

              <div className="mt-4 text-center">
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
          Already have an account?{' '}
          <Link to="/login" className="text-violet-lavender hover:text-violet-bright transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
