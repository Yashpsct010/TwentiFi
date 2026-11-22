import { useState, useEffect } from 'react';
import { 
  Download, 
  Mic, 
  Clock, 
  Sparkles, 
  Calendar, 
  ShieldCheck, 
  Cpu, 
  Flame, 
  ExternalLink, 
  ChevronDown,
  KeyRound,
  Terminal,
  ArrowUpRight,
  CheckCircle2,
  Lock,
  Zap
} from 'lucide-react';
import logoHorizontal from '../../assets/images/logo-secondary-horizontal.png';

// Direct latest APK download URL (bypasses double redirect)
const DIRECT_APK_URL = "https://github.com/Yashpsct010/TwentiFi/releases/download/latest/twentifi.apk";
const GITHUB_RELEASE_PAGE = "https://github.com/Yashpsct010/TwentiFi/releases/latest";
const GITHUB_REPO = "https://github.com/Yashpsct010/TwentiFi";
const AI_STUDIO_URL = "https://aistudio.google.com/app/apikey";

export default function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show navbar only after user starts scrolling down
      if (window.scrollY > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f4f1eb] font-body selection:bg-primary/20 selection:text-primary">

      {/* ========================================================================= */}
      {/* FLOATING NAVBAR: Appears ONLY when user starts scrolling                  */}
      {/* ========================================================================= */}
      <header 
        className={`fixed top-0 inset-x-0 z-50 px-6 md:px-12 py-3.5 flex justify-between items-center bg-[#0d0d0d]/90 backdrop-blur-md border-b border-white/10 transition-all duration-300 ${
          scrolled 
            ? 'opacity-100 translate-y-0 pointer-events-auto shadow-xl shadow-black/60' 
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4">
          <a href="#" className="flex items-center gap-3 group">
            <img 
              src={logoHorizontal} 
              alt="TwentiFi" 
              className="h-7 md:h-8 w-auto brightness-0 invert opacity-95 group-hover:opacity-100 transition-opacity" 
            />
          </a>
          <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono text-[10px] tracking-wider text-[#d4c3b3]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>v1.0.0 RELEASE</span>
          </div>
        </div>

        <nav className="flex items-center gap-4 md:gap-8 font-mono text-xs tracking-wider">
          <button 
            onClick={() => scrollToSection('manifesto')}
            className="hidden md:inline-block text-[#9c9890] hover:text-[#f4f1eb] transition-colors uppercase cursor-pointer"
          >
            Overview
          </button>
          <button 
            onClick={() => scrollToSection('architecture')}
            className="hidden md:inline-block text-[#9c9890] hover:text-[#f4f1eb] transition-colors uppercase cursor-pointer"
          >
            Architecture
          </button>
          <button 
            onClick={() => scrollToSection('gemini-engine')}
            className="hidden md:inline-block text-[#9c9890] hover:text-[#f4f1eb] transition-colors uppercase cursor-pointer"
          >
            Gemini Engine
          </button>
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-[#9c9890] hover:text-[#f4f1eb] transition-colors uppercase"
          >
            <span>GitHub</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
          <a
            href={DIRECT_APK_URL}
            download="twentifi.apk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#d4c3b3] text-[#0d0d0d] font-semibold rounded hover:bg-[#e8dccc] active:scale-95 transition-all text-xs tracking-wide cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GET APK</span>
          </a>
        </nav>
      </header>

      {/* ========================================================================= */}
      {/* SECTION 1: FULLSCREEN SHOWCASE VIDEO (100vh)                              */}
      {/* Clean video playing in loop, no overlays, no audio, full viewport         */}
      {/* ========================================================================= */}
      <section className="relative w-full h-screen min-h-[600px] flex flex-col justify-end items-center overflow-hidden bg-black">
        {/* Unobstructed Looping Video */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <video
            src="/showcase.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle bottom fade into the next section */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0d0d0d] to-transparent pointer-events-none" />
        </div>

        {/* Minimal Scroll Down Prompt */}
        <div className="relative z-10 pb-8 flex flex-col items-center">
          <button 
            onClick={() => scrollToSection('manifesto')} 
            className="flex flex-col items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-[#f4f1eb] hover:bg-black/80 hover:border-[#d4c3b3]/50 transition-all group cursor-pointer"
          >
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#9c9890] group-hover:text-[#d4c3b3]">
              Scroll to explore
            </span>
            <ChevronDown className="w-4 h-4 animate-bounce text-[#d4c3b3]" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: HERO CONTENT & VALUE PROPOSITION (Appears after the video)     */}
      {/* ========================================================================= */}
      <section id="manifesto" className="py-24 md:py-36 px-6 md:px-12 bg-[#0d0d0d] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16 pb-12 border-b border-white/10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#d4c3b3]/10 border border-[#d4c3b3]/25 font-mono text-[11px] text-[#d4c3b3] tracking-widest uppercase mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>THE ULTRADIAN COGNITIVE LEDGER</span>
              </div>
              <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-[#f4f1eb] leading-[1.08] mb-6">
                AI life-logging in <br />
                <span className="italic font-normal text-[#d4c3b3]">twenty-minute</span> pulses.
              </h1>
              <p className="text-base sm:text-lg text-[#9c9890] font-body leading-relaxed max-w-2xl">
                Autonomous check-ins, fluid voice reflection, and cascading day-burn dockets powered by Google Gemini 3.1 Flash Lite. Precision productivity without the SaaS fatigue.
              </p>
            </div>

            <div className="flex flex-col items-start lg:items-end gap-4 shrink-0">
              <a
                href={DIRECT_APK_URL}
                download="twentifi.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#d4c3b3] text-[#0d0d0d] font-semibold text-sm rounded hover:bg-[#e8dccc] shadow-xl shadow-black/50 transition-all font-mono tracking-wide cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD APK (v1.0.0)</span>
              </a>

              <div className="flex items-center gap-3 text-xs text-[#9c9890] font-mono">
                <span>Android 10+</span>
                <span>•</span>
                <span>~97 MB Signed APK</span>
                <span>•</span>
                <a 
                  href={GITHUB_RELEASE_PAGE} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline hover:text-[#d4c3b3]"
                >
                  GitHub Releases
                </a>
              </div>
            </div>
          </div>

          {/* Quick Telemetry Highlights Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 rounded bg-[#141414] border border-white/10 flex items-center gap-3">
              <Clock className="w-4 h-4 text-[#d4c3b3] shrink-0" />
              <div>
                <div className="text-[10px] text-[#9c9890]">CYCLE</div>
                <div className="text-[#f4f1eb] font-semibold">20-Min Cadence</div>
              </div>
            </div>

            <div className="p-4 rounded bg-[#141414] border border-white/10 flex items-center gap-3">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] text-[#9c9890]">MODEL</div>
                <div className="text-[#f4f1eb] font-semibold">Gemini 3.1 Flash Lite</div>
              </div>
            </div>

            <div className="p-4 rounded bg-[#141414] border border-white/10 flex items-center gap-3">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-[#9c9890]">STORAGE</div>
                <div className="text-[#f4f1eb] font-semibold">100% Local SQLite</div>
              </div>
            </div>

            <div className="p-4 rounded bg-[#141414] border border-white/10 flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-[#d4c3b3] shrink-0" />
              <div>
                <div className="text-[10px] text-[#9c9890]">LICENSE</div>
                <div className="text-[#f4f1eb] font-semibold">Open Source MIT</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: SYSTEM ARCHITECTURE & CADENCE                                   */}
      {/* ========================================================================= */}
      <section id="architecture" className="py-24 md:py-36 px-6 md:px-12 border-t border-white/10 bg-[#0d0d0d] relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-white/10 gap-6">
            <div>
              <div className="font-mono text-[11px] tracking-[0.2em] text-[#d4c3b3] uppercase mb-2">
                [ 01 // ARCHITECTURAL CADENCE ]
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-light text-[#f4f1eb] tracking-tight">
                Built for deep work, <br />
                <span className="italic font-normal text-[#d4c3b3]">not algorithmic distraction.</span>
              </h2>
            </div>
            <p className="text-sm text-[#9c9890] max-w-md font-body leading-relaxed">
              Standard time trackers turn productivity into bureaucratic data entry. TwentiFi operates silently in the background, prompting you at the natural limits of human concentration.
            </p>
          </div>

          {/* Grid of Core Instruments */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#141414] border border-white/10 p-7 flex flex-col justify-between hover:border-[#d4c3b3]/40 transition-colors">
              <div>
                <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[#d4c3b3] mb-6 font-mono text-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="font-mono text-[10px] text-[#9c9890] tracking-wider uppercase mb-1">
                  CADENCE // 20 MIN
                </div>
                <h3 className="text-lg font-display font-medium text-[#f4f1eb] mb-3">
                  Ultradian Rhythm Pulses
                </h3>
                <p className="text-xs text-[#9c9890] leading-relaxed">
                  Every 20 minutes, a gentle non-invasive nudge captures what you just accomplished. Keeps you accountable without breaking your flow state.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/5 font-mono text-[10px] text-[#d4c3b3]/80">
                ZERO FORMS • ONE TAP LOG
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#141414] border border-white/10 p-7 flex flex-col justify-between hover:border-[#d4c3b3]/40 transition-colors">
              <div>
                <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[#d4c3b3] mb-6 font-mono text-sm">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="font-mono text-[10px] text-[#9c9890] tracking-wider uppercase mb-1">
                  INPUT // STREAM OF THOUGHT
                </div>
                <h3 className="text-lg font-display font-medium text-[#f4f1eb] mb-3">
                  Voice Reflection & Vibe
                </h3>
                <p className="text-xs text-[#9c9890] leading-relaxed">
                  Speak raw, unfiltered thoughts. Google Gemini 3.1 Flash Lite extracts structured tasks, emotional sentiment, and energy dynamics instantly.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/5 font-mono text-[10px] text-[#d4c3b3]/80">
                GEMINI 3.1 FLASH LITE • AUDIO SPEECH
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#141414] border border-white/10 p-7 flex flex-col justify-between hover:border-[#d4c3b3]/40 transition-colors">
              <div>
                <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[#d4c3b3] mb-6 font-mono text-sm">
                  <Flame className="w-5 h-5 text-amber-400" />
                </div>
                <div className="font-mono text-[10px] text-[#9c9890] tracking-wider uppercase mb-1">
                  TIMELINE // DAY BURN RAIL
                </div>
                <h3 className="text-lg font-display font-medium text-[#f4f1eb] mb-3">
                  Today's Docket & Day Burn
                </h3>
                <p className="text-xs text-[#9c9890] leading-relaxed">
                  A real-time cascading schedule with the live NOW flame indicator. When life delays a task, remaining blocks dynamically cascade without manual recalibration.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/5 font-mono text-[10px] text-[#d4c3b3]/80">
                AI BLUEPRINT STUDIO • TIME CASCADE
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#141414] border border-white/10 p-7 flex flex-col justify-between hover:border-[#d4c3b3]/40 transition-colors">
              <div>
                <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[#d4c3b3] mb-6 font-mono text-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="font-mono text-[10px] text-[#9c9890] tracking-wider uppercase mb-1">
                  HISTORICAL // MATRIX
                </div>
                <h3 className="text-lg font-display font-medium text-[#f4f1eb] mb-3">
                  6-Month Streak Ledger
                </h3>
                <p className="text-xs text-[#9c9890] leading-relaxed">
                  Inspect your consistency over half a year in an unyielding matrix. Watch your discipline compound into undeniable momentum day after day.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/5 font-mono text-[10px] text-[#d4c3b3]/80">
                WATERMELONDB • PERSISTENT SQLITE
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: PRIVACY & SYSTEM TELEMETRY                                      */}
      {/* ========================================================================= */}
      <section className="py-20 px-6 md:px-12 bg-[#121212] border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[#d4c3b3] shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-mono text-sm font-semibold uppercase tracking-wider text-[#f4f1eb] mb-1">
                Zero Cloud Telemetry
              </h4>
              <p className="text-xs text-[#9c9890] leading-relaxed">
                Your voice notes, logs, and emotional sentiment reside exclusively on your local device SQLite storage. No remote profiling servers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[#d4c3b3] shrink-0">
              <Cpu className="w-5 h-5 text-[#d4c3b3]" />
            </div>
            <div>
              <h4 className="font-mono text-sm font-semibold uppercase tracking-wider text-[#f4f1eb] mb-1">
                Direct Gemini Gateway
              </h4>
              <p className="text-xs text-[#9c9890] leading-relaxed">
                Calls stream directly from your device to Google AI Studio with sub-second response times using the latest Gemini 3.1 Flash Lite model.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[#d4c3b3] shrink-0">
              <Terminal className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="font-mono text-sm font-semibold uppercase tracking-wider text-[#f4f1eb] mb-1">
                Open Distribution
              </h4>
              <p className="text-xs text-[#9c9890] leading-relaxed">
                Distributed freely via signed universal Android APK releases on GitHub. Verifiable, inspectable, and without Google Play dependencies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: GEMINI 3.1 FLASH LITE SETUP GUIDE                               */}
      {/* ========================================================================= */}
      <section id="gemini-engine" className="py-24 md:py-36 px-6 md:px-12 border-t border-white/10 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Instructions */}
            <div className="lg:col-span-6">
              <div className="font-mono text-[11px] tracking-[0.2em] text-[#d4c3b3] uppercase mb-2">
                [ 02 // INTELLIGENCE INTEGRATION ]
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-light text-[#f4f1eb] tracking-tight mb-6">
                Your own keys. <br />
                <span className="italic font-normal text-[#d4c3b3]">Unlimited intelligence.</span>
              </h2>
              <p className="text-sm text-[#9c9890] leading-relaxed mb-10">
                TwentiFi runs on the official Google Gemini API. By bringing your own free-tier API key from Google AI Studio, you bypass costly subscription fees and retain full sovereignty over your usage.
              </p>

              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4 p-4 rounded bg-[#141414] border border-white/10">
                  <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs text-[#d4c3b3] shrink-0">
                    01
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#f4f1eb] mb-1">
                      Obtain Free API Key
                    </h4>
                    <p className="text-xs text-[#9c9890] leading-relaxed">
                      Visit <a href={AI_STUDIO_URL} target="_blank" rel="noopener noreferrer" className="text-[#d4c3b3] underline font-medium hover:text-[#f4f1eb]">Google AI Studio</a>. Sign in with your Google account and generate an API key. No credit card or billing setup required.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 p-4 rounded bg-[#141414] border border-white/10">
                  <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs text-[#d4c3b3] shrink-0">
                    02
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#f4f1eb] mb-1">
                      Paste in TwentiFi Onboarding
                    </h4>
                    <p className="text-xs text-[#9c9890] leading-relaxed">
                      Launch the app on your Android device. On the onboarding screen or in Profile Settings, paste your API key into the encrypted local vault.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 p-4 rounded bg-[#141414] border border-white/10">
                  <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs text-[#d4c3b3] shrink-0">
                    03
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#f4f1eb] mb-1">
                      Autonomous Synthesis Unlocked
                    </h4>
                    <p className="text-xs text-[#9c9890] leading-relaxed">
                      Voice entries, emotional vibe tracking, and AI schedule blueprints cascade immediately via the Gemini 3.1 Flash Lite model.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <a
                  href={AI_STUDIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono uppercase tracking-wider text-[#d4c3b3] transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Open Google AI Studio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Right Column: Visual Demonstration */}
            <div className="lg:col-span-6">
              <div className="p-3 bg-[#141414] border border-white/10 rounded-lg shadow-2xl relative">
                <div className="flex items-center justify-between pb-3 px-2 border-b border-white/10 font-mono text-[10px] text-[#9c9890]">
                  <span>AI STUDIO KEY ACQUISITION</span>
                  <span className="text-emerald-400">STATUS // VERIFIED</span>
                </div>
                <div className="pt-3">
                  <img
                    src="/aistudio-guide.gif"
                    alt="Acquiring Google Gemini API Key from Google AI Studio"
                    className="w-full h-auto rounded border border-white/5"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: DOWNLOAD LEDGER & APK INSTALLATION INSTRUCTIONS                 */}
      {/* ========================================================================= */}
      <section id="download" className="py-24 md:py-36 px-6 md:px-12 border-t border-white/10 bg-[#121212]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#161616] border border-white/15 p-8 md:p-14 rounded-lg relative overflow-hidden">
            <div className="font-mono text-[11px] tracking-[0.2em] text-[#d4c3b3] uppercase mb-3">
              [ 03 // DEPLOYMENT LEDGER ]
            </div>
            
            <h2 className="font-display text-3xl sm:text-5xl font-light text-[#f4f1eb] tracking-tight mb-4">
              Begin your <span className="italic font-normal text-[#d4c3b3]">first pulse.</span>
            </h2>

            <p className="text-sm sm:text-base text-[#9c9890] max-w-2xl mb-10 leading-relaxed font-body">
              TwentiFi is distributed directly as an optimized Android APK. Click below to download the latest signed build, or view release notes directly on GitHub.
            </p>

            {/* Download Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a
                href={DIRECT_APK_URL}
                download="twentifi.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 px-8 py-4 bg-[#d4c3b3] text-[#0d0d0d] font-semibold text-sm rounded hover:bg-[#e8dccc] transition-all font-mono tracking-wide shadow-lg shadow-black/40 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD TWENTIFI.APK (LATEST)</span>
              </a>

              <a
                href={GITHUB_RELEASE_PAGE}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/15 text-[#f4f1eb] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>GitHub Releases</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Important Installation Guidance Note */}
            <div className="p-5 rounded bg-[#0d0d0d] border border-white/10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#f4f1eb]">
                    Android Installation Notice
                  </h4>
                  <p className="text-xs text-[#9c9890] leading-relaxed">
                    Because TwentiFi is installed directly outside the Google Play Store, Android will display a standard security prompt asking to <span className="text-[#f4f1eb] font-medium">"Allow installation from this source"</span> (Chrome or your chosen browser). TwentiFi is a verified, signed, and private application containing no tracker SDKs.
                  </p>
                  <p className="text-[11px] text-[#9c9890] font-mono">
                    Package Name: <span className="text-[#d4c3b3]">com.anonymous.twentifi</span> • Minimum OS: <span className="text-[#d4c3b3]">Android 10.0 (API 29+)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER                                                                    */}
      {/* ========================================================================= */}
      <footer className="py-12 px-6 md:px-12 border-t border-white/10 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 font-mono text-xs text-[#9c9890]">
          <div className="flex items-center gap-3">
            <span className="text-[#f4f1eb] font-semibold">TwentiFi</span>
            <span>•</span>
            <span>VELLUM LEDGER DESIGN SYSTEM</span>
          </div>

          <div className="flex items-center gap-6">
            <a 
              href={GITHUB_REPO} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#d4c3b3] transition-colors"
            >
              SOURCE CODE
            </a>
            <a 
              href={GITHUB_RELEASE_PAGE} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#d4c3b3] transition-colors"
            >
              RELEASE ARCHIVE
            </a>
            <a 
              href={AI_STUDIO_URL} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#d4c3b3] transition-colors"
            >
              GOOGLE AI STUDIO
            </a>
          </div>

          <div>
            &copy; {new Date().getFullYear()} TwentiFi. MIT License.
          </div>
        </div>
      </footer>
    </div>
  );
}