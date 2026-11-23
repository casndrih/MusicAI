import RemixWorkspace from "@/components/remix-workspace";
import { AudioWaveform, ArrowUpRight, Disc3, Headphones, Music2, WandSparkles } from "lucide-react";

export default function Home() {
  return <main>
    <header className="site-header">
      <a className="brand" href="#" aria-label="MusicAI home"><span className="brand-mark"><AudioWaveform size={22}/></span><span>Music<span className="brand-accent">AI</span></span></a>
      <nav className="main-nav"><a href="#remixer">Studio</a><a href="#how-it-works">How it works</a><a href="/about">About</a></nav>
      <a className="header-cta" href="#remixer">Open studio <ArrowUpRight size={15}/></a>
    </header>

    <section className="hero">
      <div className="hero-glow glow-one"/><div className="hero-glow glow-two"/>
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot"/> LOCAL AI AUDIO STUDIO <span className="eyebrow-line"/></div>
        <h1>Give your song<br/><span>a new sound.</span></h1>
        <p className="hero-description">Remove vocals, separate instruments and discover music. Your audio is processed locally in your browser.</p>
        <div className="hero-actions"><a className="button button-primary" href="#remixer"><WandSparkles size={17}/> Open audio tools <ArrowUpRight size={16}/></a></div>
        <div className="hero-proof"><div className="proof-icons"><span><Music2 size={14}/></span><span><Disc3 size={14}/></span><span><Headphones size={14}/></span></div><span>Your audio. Your device. Your stems.</span></div>
      </div>
      <div className="hero-art" aria-label="Abstract music record artwork"><div className="orbit orbit-a"/><div className="orbit orbit-b"/>
        <div className="vinyl"><div className="vinyl-grooves"/><div className="vinyl-label"><AudioWaveform size={37}/><small>MA</small></div></div>
        <div className="floating-card card-top"><span className="mini-wave">{Array.from({length:18},(_,i)=><i key={i} style={{height:`${12+(i*17)%31}px`}} />)}</span><span><b>LOCAL AI MODEL</b><small>Vocals · drums · bass · other</small></span></div>
        <div className="floating-card card-bottom"><span className="equalizer"><i/><i/><i/><i/><i/></span><span><b>STEM SEPARATION</b><small>Source mix → separated stems</small></span><span className="live-dot"/></div>
        <div className="art-caption">MAKE ROOM FOR A NEW SOUND <span>✳</span></div>
      </div>
      <div className="hero-bottom"><span>SCROLL TO STUDIO</span><span className="scroll-mark">↓</span><span>01 / 02</span></div>
    </section>

    <section className="section workspace-section" id="remixer"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> MUSICAI STUDIO</div><h2>Your audio. <em>Your tools.</em></h2></div><p>Separate stems, identify recordings and preview music sources.</p></div><RemixWorkspace/></section>

    <section className="feature-band" id="how-it-works"><div className="feature-band-inner"><div><div className="eyebrow"><span className="eyebrow-dot"/> SIMPLE BY DESIGN</div><h2>Three steps.<br/><em>More ways to create.</em></h2><p>Everything starts with an audio file on your device.</p></div><div className="steps">
      <div className="step"><span>01</span><div><h3>Choose your audio</h3><p>Select a supported track from your device.</p></div></div>
      <div className="step"><span>02</span><div><h3>Run a tool</h3><p>Separate stems or identify the recording.</p></div></div>
      <div className="step"><span>03</span><div><h3>Preview and save</h3><p>Listen to results and save your WAV files.</p></div></div>
    </div></div></section>

    <footer className="site-footer"><a className="brand" href="#"><span className="brand-mark"><AudioWaveform size={20}/></span><span>Music<span className="brand-accent">AI</span></span></a><span>Independent local AI music studio. <a href="/about">About the developer</a></span><span>© {new Date().getFullYear()} MusicAI.</span></footer>
  </main>;
}
