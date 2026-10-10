import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  TreePine, Radio, MapPin, Bell, Shield, Bird,
  Zap, ChevronDown, Menu, X, ArrowRight, Activity,
  Mic, BarChart3, AlertTriangle, CheckCircle
} from 'lucide-react'

// Subtle acoustic waveform bars for hero decoration
function HeroWaveform() {
  const bars = [4, 8, 14, 20, 32, 24, 16, 28, 12, 18, 32, 20, 8, 24, 14, 6, 20, 30, 16, 10, 28, 22, 8, 16, 32]
  return (
    <div className="flex items-end gap-[3px]" aria-hidden="true">
      {bars.map((h, i) => (
        <div
          key={i}
          className="waveform-bar opacity-40"
          style={{ height: h, animationDelay: `${(i * 0.06) % 1.2}s` }}
        />
      ))}
    </div>
  )
}

// Animated topo line
function TopoLines() {
  return (
    <svg viewBox="0 0 1000 200" className="absolute bottom-0 left-0 right-0 w-full opacity-10" aria-hidden="true">
      {[0, 1, 2, 3, 4].map(i => (
        <ellipse
          key={i}
          cx="500" cy={220 - i * 28} rx={420 - i * 40} ry={40 - i * 6}
          fill="none" stroke="rgba(139,92,246,1)" strokeWidth="0.8"
        />
      ))}
    </svg>
  )
}

// Demo product preview panel
function ProductPreview() {
  const demoEvents = [
    { kind: 'Threat', name: 'Gunshot', conf: 0.91, alert: true },
    { kind: 'Bird', name: 'Indian Cuckoo', conf: 0.82, alert: false },
    { kind: 'Bird', name: 'Jungle Babbler', conf: 0.74, alert: false },
  ]
  return (
    <div className="glass rounded-2xl border border-[rgba(190,160,255,0.15)] p-4 max-w-xs w-full shadow-2xl" style={{ background: 'rgba(16,13,23,0.85)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-text-secondary">Zone_1 · Live</span>
        </div>
        <span className="text-[10px] text-text-secondary font-mono">DEMO DATA</span>
      </div>
      <p className="text-xs text-text-secondary mb-2 uppercase tracking-wider font-medium">Detections</p>
      {demoEvents.map((ev, i) => (
        <div
          key={i}
          className={`flex items-center gap-2.5 py-2 ${i < demoEvents.length - 1 ? 'border-b border-[rgba(190,160,255,0.06)]' : ''}`}
        >
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
            ev.kind === 'Threat' ? 'bg-[rgba(255,77,94,0.15)]' : 'bg-[rgba(67,217,163,0.12)]'
          }`}>
            {ev.kind === 'Threat' ? <Zap size={11} className="text-threat" /> : <Bird size={11} className="text-success" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-main">{ev.name}</p>
            <div className="w-full h-1 rounded-full bg-white/10 mt-1">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${ev.conf * 100}%`,
                  background: ev.kind === 'Threat' ? '#FF4D5E' : '#43D9A3'
                }}
              />
            </div>
          </div>
          <span className="text-[10px] font-mono text-text-secondary">{Math.round(ev.conf * 100)}%</span>
          {ev.alert && <AlertTriangle size={11} className="text-threat shrink-0" />}
        </div>
      ))}
      <div className="mt-3 pt-3 border-t border-[rgba(190,160,255,0.08)] flex items-center gap-2">
        <MapPin size={11} className="text-violet-lavender" />
        <span className="text-[10px] text-text-secondary">28.7041° N, 77.1025° E</span>
        <CheckCircle size={10} className="text-success ml-auto" />
        <span className="text-[10px] text-success">Alert sent</span>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-obsidian text-text-main overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[rgba(8,7,13,0.92)] backdrop-blur-xl border-b border-[rgba(190,160,255,0.1)]'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Nest Tasuke Logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold tracking-wide text-text-main">Nest <span className="text-violet-lavender">Tasuke</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#capabilities" className="text-sm text-text-secondary hover:text-text-main transition-colors">Capabilities</a>
            <a href="#how-it-works" className="text-sm text-text-secondary hover:text-text-main transition-colors">How It Works</a>
            <a href="#preview" className="text-sm text-text-secondary hover:text-text-main transition-colors">Intelligence</a>
            <Link to="/login" className="text-sm text-text-secondary hover:text-text-main transition-colors">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm py-2">
              Open Command Center <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden btn-ghost p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[rgba(16,13,23,0.98)] border-t border-[rgba(190,160,255,0.1)] px-4 py-4 space-y-2 animate-fade-in">
            <a href="#capabilities" className="block nav-item" onClick={() => setMobileMenuOpen(false)}>Capabilities</a>
            <a href="#how-it-works" className="block nav-item" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <Link to="/login" className="block nav-item" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Link to="/register" className="btn-primary justify-center" onClick={() => setMobileMenuOpen(false)}>
              Open Command Center <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(124,58,237,0.06)] via-transparent to-obsidian" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-primary/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-obsidian to-transparent" />
        </div>

        {/* Topo overlay */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <TopoLines />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-primary/10 border border-violet-primary/20 text-violet-lavender text-xs font-medium mb-6">
              <Radio size={12} className="animate-pulse" />
              Acoustic Forest Intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-6">
              Listen to the forest.{' '}
              <span className="text-gradient">Detect what threatens it.</span>
            </h1>
            <p className="text-text-secondary text-lg leading-relaxed mb-8 max-w-xl">
              Nest Tasuke continuously monitors forest soundscapes, identifies acoustic signatures of illegal activity, and delivers actionable field intelligence to officers — in real time.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">
              <Link to="/register" className="btn-primary py-3 px-6 text-base">
                Enter Command Center <ArrowRight size={16} />
              </Link>
              <a href="#capabilities" className="btn-secondary py-3 px-6 text-base">
                Explore Capabilities <ChevronDown size={16} />
              </a>
            </div>
            <HeroWaveform />
            <p className="text-xs text-text-secondary mt-2 opacity-60">Acoustic waveform representation · illustrative</p>
          </div>

          {/* Product preview */}
          <div className="flex justify-center lg:justify-end animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <ProductPreview />
          </div>
        </div>

        {/* Scroll cue */}
        <a href="#capabilities" className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-text-secondary hover:text-text-main transition-colors animate-bounce">
          <ChevronDown size={20} />
        </a>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-xs text-violet-lavender font-medium tracking-widest uppercase mb-3">Core Capabilities</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-main">Intelligence at every frequency</h2>
          <p className="text-text-secondary mt-3 max-w-xl mx-auto">
            From gunshots to bird distress calls, Nest Tasuke decodes the acoustic landscape of the forest.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CAPABILITIES.map((cap, i) => (
            <div
              key={i}
              className="card hover:border-[rgba(190,160,255,0.25)] transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${cap.bg}`}>
                <cap.icon size={20} className={cap.iconColor} />
              </div>
              <h3 className="font-semibold text-text-main mb-2">{cap.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{cap.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-elevated/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs text-violet-lavender font-medium tracking-widest uppercase mb-3">Workflow</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-main">From recording to response</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
            {STEPS.map((step, i) => (
              <>
                <div key={step.title} className="flex flex-col items-center text-center animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${step.bg}`}>
                    <step.icon size={20} className={step.color} />
                  </div>
                  <p className="text-sm font-semibold text-text-main">{step.title}</p>
                  <p className="text-xs text-text-secondary mt-1">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div key={`arrow-${i}`} className="hidden sm:flex justify-center">
                    <ArrowRight size={16} className="text-[rgba(190,160,255,0.3)]" />
                  </div>
                )}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* Intelligence Preview */}
      <section id="preview" className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-xs text-violet-lavender font-medium tracking-widest uppercase mb-3">Intelligence Preview</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-main">A command center built for the field</h2>
          <p className="text-text-secondary mt-3 max-w-lg mx-auto text-sm">
            Illustrative demonstration. All data shown in the actual application comes from real ML inference.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PREVIEW_CARDS.map((card, i) => (
            <div key={i} className="card animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bg}`}>
                  <card.icon size={16} className={card.color} />
                </div>
                <p className="font-semibold text-text-main text-sm">{card.title}</p>
                <span className="ml-auto text-[10px] text-text-secondary border border-[rgba(190,160,255,0.15)] rounded-full px-2 py-0.5">DEMO</span>
              </div>
              {card.content}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-violet-glow pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-main mb-4">
            Deploy forest intelligence today.
          </h2>
          <p className="text-text-secondary mb-8">
            Set up takes minutes. Configure once, protect always.
          </p>
          <Link to="/register" className="btn-primary py-3 px-8 text-base inline-flex glow-violet">
            Create Officer Account <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(190,160,255,0.08)] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Nest Tasuke Logo" className="w-7 h-7 rounded-lg object-cover" />
            <span className="text-sm font-bold text-text-main">Nest Tasuke</span>
          </div>
          <div className="flex gap-6 text-xs text-text-secondary">
            <Link to="/login" className="hover:text-text-main transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-text-main transition-colors">Register</Link>
            <a href="#capabilities" className="hover:text-text-main transition-colors">Capabilities</a>
          </div>
          <p className="text-xs text-text-secondary">
            © {new Date().getFullYear()} Nest Tasuke · Forest Protection System
          </p>
        </div>
      </footer>
    </div>
  )
}

const CAPABILITIES = [
  {
    title: 'Acoustic Threat Detection',
    desc: 'Identifies gunshots, chainsaws, engines, and footsteps with high confidence using trained acoustic models.',
    icon: Zap,
    bg: 'bg-[rgba(255,77,94,0.12)]',
    iconColor: 'text-threat',
  },
  {
    title: 'Bird Call Analysis',
    desc: 'Recognizes bird species and detects distress calls that may indicate predatory activity or habitat disruption.',
    icon: Bird,
    bg: 'bg-[rgba(67,217,163,0.12)]',
    iconColor: 'text-success',
  },
  {
    title: 'Location-Aware Incidents',
    desc: 'GPS-tagged events with Google Maps integration. Know exactly where every detection happened.',
    icon: MapPin,
    bg: 'bg-[rgba(139,92,246,0.15)]',
    iconColor: 'text-violet-lavender',
  },
  {
    title: 'Instant Field Alerts',
    desc: 'Threat events trigger email alerts immediately. Officers on the ground receive actionable intelligence without delay.',
    icon: Bell,
    bg: 'bg-[rgba(245,185,66,0.12)]',
    iconColor: 'text-warning',
  },
]

const STEPS = [
  { title: 'Upload', desc: 'Drop a forest audio recording', icon: Mic, bg: 'bg-[rgba(139,92,246,0.15)]', color: 'text-violet-lavender' },
  { title: 'Analyze', desc: 'ML model processes the audio', icon: Activity, bg: 'bg-[rgba(67,217,163,0.12)]', color: 'text-success' },
  { title: 'Detect', desc: 'Threats and species identified', icon: Shield, bg: 'bg-[rgba(245,185,66,0.12)]', color: 'text-warning' },
  { title: 'Inspect', desc: 'Review event detail and location', icon: BarChart3, bg: 'bg-[rgba(139,92,246,0.12)]', color: 'text-violet-lavender' },
  { title: 'Respond', desc: 'Alert dispatched to officer', icon: Bell, bg: 'bg-[rgba(255,77,94,0.12)]', color: 'text-threat' },
]

const PREVIEW_CARDS = [
  {
    title: 'Event Feed',
    icon: Activity,
    bg: 'bg-[rgba(139,92,246,0.15)]',
    color: 'text-violet-lavender',
    content: (
      <div className="space-y-2">
        {[
          { name: 'Chainsaw', kind: 'Threat', conf: 94 },
          { name: 'Indian Peafowl', kind: 'Bird', conf: 87 },
          { name: 'Gunshot', kind: 'Threat', conf: 91 },
        ].map((e, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className={`w-1.5 h-1.5 rounded-full ${e.kind === 'Threat' ? 'bg-threat' : 'bg-success'}`} />
            <span className="text-text-main flex-1">{e.name}</span>
            <span className={`font-mono ${e.kind === 'Threat' ? 'text-threat' : 'text-success'}`}>{e.conf}%</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Alert Status',
    icon: Bell,
    bg: 'bg-[rgba(255,77,94,0.12)]',
    color: 'text-threat',
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <AlertTriangle size={12} className="text-threat" />
          <span className="text-text-main flex-1">Threat: chainsaw</span>
          <span className="text-success text-[10px]">sent</span>
        </div>
        <div className="h-1 bg-elevated rounded-full"><div className="h-full w-4/5 rounded-full bg-threat" /></div>
        <p className="text-[10px] text-text-secondary">Email dispatched · Zone_1 · 2 min ago</p>
      </div>
    ),
  },
  {
    title: 'Location Intel',
    icon: MapPin,
    bg: 'bg-[rgba(67,217,163,0.12)]',
    color: 'text-success',
    content: (
      <div className="space-y-2">
        <div className="bg-elevated rounded-lg p-2 text-[11px] font-mono text-text-secondary">
          28.7041° N, 77.1025° E<br />
          ±12m accuracy · GPS
        </div>
        <div className="flex items-center gap-1 text-xs text-violet-lavender">
          <MapPin size={11} />
          <span>Google Maps link available</span>
        </div>
      </div>
    ),
  },
]
