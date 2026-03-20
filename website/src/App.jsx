import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Calendar, Timer, Sparkles, Download, ArrowRight, User } from 'lucide-react';

const FadeIn = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-surface-low p-8 rounded-[32px] border border-outline-variant/10 relative overflow-hidden group"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="bg-surface-high w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-outline-variant/20 shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
      <Icon className="text-primary w-7 h-7" />
    </div>
    <h3 className="text-xl font-display font-bold text-on-surface mb-3">{title}</h3>
    <p className="text-on-surface-variant leading-relaxed text-sm">{desc}</p>
  </motion.div>
);

export default function App() {
  return (
    <div className="min-h-screen bg-background text-on-surface overflow-x-hidden selection:bg-primary/30">
      
      {/* Navbar Minimal */}
      <nav className="fixed top-0 inset-x-0 z-50 h-24 flex items-center">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-gradient flex items-center justify-center shadow-[0_0_15px_rgba(186,158,255,0.3)]">
              <span className="font-display font-black text-on-primary text-xl tracking-tighter">T</span>
            </div>
            <span className="font-display font-extrabold text-xl tracking-wide">TwentiFi</span>
          </div>
          <motion.a
            href="https://github.com/Yashpsct010/TwentiFi/releases/latest/download/twentifi.apk"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 glass-button px-6 py-3 rounded-full font-bold text-sm tracking-widest uppercase hover:text-primary transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Get APK</span>
          </motion.a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-28 pb-32 lg:pt-32 lg:pb-48 px-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="uppercase tracking-[0.2em] text-xs font-bold text-primary">The Ethereal Intelligence</span>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.1}>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-8">
              AI life-logging in <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-primary-gradient">20-min pulses.</span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-12 leading-relaxed">
              Don't just track your time. Understand your vibe. TwentiFi breaks your day into focused pulses, using voice AI to generate deep insights into your productivity and mood.
            </p>
          </FadeIn>
          
          <FadeIn delay={0.3} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              href="https://github.com/Yashpsct010/TwentiFi/releases/latest/download/twentifi.apk"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="primary-button px-8 py-5 rounded-full flex items-center justify-center w-full sm:w-auto text-base tracking-widest uppercase"
            >
              <span>Download APK</span>
              <ArrowRight className="ml-3 w-5 h-5" />
            </motion.a>
            <motion.a
              href="#guide"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="glass-button px-8 py-5 rounded-full flex items-center justify-center w-full sm:w-auto text-on-surface font-bold text-base tracking-widest uppercase hover:bg-surface-variant/50 transition-colors"
            >
              API Guide
            </motion.a>
          </FadeIn>
        </div>
      </header>

      {/* Layered Interface Mockup Illusion */}
      <section className="px-6 pb-32">
        <FadeIn className="container mx-auto max-w-6xl">
           <div className="w-full h-[400px] md:h-[600px] glass-panel rounded-[40px] relative overflow-hidden flex items-center justify-center border-t border-l border-white/10">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay" />
              <div className="w-64 h-64 bg-secondary/20 rounded-full blur-[80px] absolute top-1/2 left-1/4" />
              <div className="w-48 h-48 bg-primary/20 rounded-full blur-[60px] absolute bottom-1/4 right-1/4" />
              
              <div className="relative z-10 text-center px-4">
                 <h2 className="font-display font-black text-3xl md:text-5xl tracking-tight mb-4">Focus. Log. <span className="text-primary">Evolve.</span></h2>
                 <p className="text-on-surface-variant font-medium">Experience the dark mode interface built for extreme focus.</p>
              </div>
           </div>
        </FadeIn>
      </section>

      {/* Intelligence Layers (Features) */}
      <section className="py-32 bg-surface-low relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <FadeIn className="mb-20 md:text-center">
            <h2 className="font-display font-black text-4xl md:text-5xl tracking-tight mb-6">Intelligence Layers</h2>
            <p className="text-on-surface-variant text-lg max-w-2xl md:mx-auto">A system designed to reduce friction and maximize awareness through autonomous tracking and deep insights.</p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Mic}
              title="Voice Logging & Insights"
              desc="Just speak. We use Gemini 3.1 Flash lite preview to perfectly transcribe your entry and extract a deep analysis of your emotional vibe and productivity."
              delay={0.1}
            />
            <FeatureCard 
              icon={Timer}
              title="20-Min Pulses"
              desc="Work in dedicated blocks. TwentiFi autonomously nudges you every 20 minutes to capture what you actually got done. No cap."
              delay={0.2}
            />
            <FeatureCard 
              icon={Calendar}
              title="Streak Calendar"
              desc="Visualize your consistency over the last 6 months. Maintain your momentum and watch your daily goal progress fill up."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* API Guide */}
      <section id="guide" className="py-32 px-6">
        <div className="container mx-auto max-w-5xl">
          <FadeIn className="mb-16">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-tertiary/20 bg-tertiary/5 mb-6">
               <User className="w-4 h-4 text-tertiary" />
               <span className="uppercase tracking-[0.2em] text-[10px] font-bold text-tertiary">User Setup</span>
             </div>
             <h2 className="font-display font-black text-4xl md:text-5xl tracking-tight mb-6">Power it with Gemini</h2>
             <p className="text-on-surface-variant text-lg max-w-2xl lg:mb-12">TwentiFi requires your own Google Gemini API key to operate its AI features. It's completely free tier and easy to setup.</p>
          </FadeIn>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn delay={0.2} className="space-y-8">
               <div className="flex gap-6">
                 <div className="w-12 h-12 rounded-full bg-surface-highest flex items-center justify-center font-bold text-primary shrink-0 border border-outline-variant/30">1</div>
                 <div>
                   <h4 className="text-xl font-bold mb-2">Get an API Key</h4>
                   <p className="text-on-surface-variant text-sm leading-relaxed">Head over to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary underline">Google AI Studio</a> and generate a free API key. No credit card required.</p>
                 </div>
               </div>
               <div className="flex gap-6">
                 <div className="w-12 h-12 rounded-full bg-surface-highest flex items-center justify-center font-bold text-primary shrink-0 border border-outline-variant/30">2</div>
                 <div>
                   <h4 className="text-xl font-bold mb-2">Paste in Onboarding</h4>
                   <p className="text-on-surface-variant text-sm leading-relaxed">When you first open TwentiFi, simply paste your key into the designated input field during the onboarding flow.</p>
                 </div>
               </div>
               <div className="flex gap-6">
                 <div className="w-12 h-12 rounded-full bg-surface-highest flex items-center justify-center font-bold text-primary shrink-0 border border-outline-variant/30">3</div>
                 <div>
                   <h4 className="text-xl font-bold mb-2">Start Logging</h4>
                   <p className="text-on-surface-variant text-sm leading-relaxed">That's it. You now have access to hyper-fast voice transcription and personalized Gen-Z nudges via Gemini 1.5 Flash.</p>
                 </div>
               </div>
            </FadeIn>
            
            <FadeIn delay={0.4} className="bg-surface-highest/50 rounded-3xl p-2 border border-outline-variant/30 shadow-2xl relative">
              <div className="absolute inset-0 bg-primary-gradient opacity-5 mix-blend-color rounded-3xl pointer-events-none" />
              <img 
                src="/aistudio-guide.gif" 
                alt="Getting a Gemini API Key from Google AI Studio" 
                className="w-full h-auto rounded-2xl border border-white/5 shadow-inner"
              />
              {/* Fallback text if GIF is missing */}
              <p className="absolute bottom-4 left-0 right-0 text-center text-on-surface-variant text-xs font-medium opacity-50 pointer-events-none">
                Place your aistudio-guide.gif in the public folder
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="download" className="py-32 px-6">
         <FadeIn className="container mx-auto max-w-4xl glass-panel rounded-[40px] p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary-gradient opacity-10 mix-blend-color" />
            <div className="relative z-10">
               <h2 className="font-display font-black text-4xl md:text-6xl tracking-tight mb-8">Ready to lock in?</h2>
               <p className="text-on-surface-variant text-lg md:text-xl mb-12 max-w-2xl mx-auto">Maintain your streak. Evolve your focus.</p>
               <motion.a
                href="https://github.com/Yashpsct010/TwentiFi/releases/latest/download/twentifi.apk"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="primary-button inline-flex items-center px-10 py-6 rounded-full text-lg tracking-widest uppercase"
              >
                <Download className="mr-3 w-6 h-6" />
                <span>Download APK</span>
              </motion.a>
            </div>
         </FadeIn>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-outline-variant/10 text-center">
         <p className="text-on-surface-variant text-sm font-medium tracking-wide uppercase">&copy; {new Date().getFullYear()} TwentiFi. Built with React & Tailwind.</p>
      </footer>
    </div>
  );
}
