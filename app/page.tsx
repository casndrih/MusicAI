import RemixWorkspace from "@/components/remix-workspace";
import { AudioWaveform, ArrowUpRight, Check, Disc3, Headphones, Music2, Sparkles, WandSparkles } from "lucide-react";

const examples = [
  { n: "01", name: "Sapphire", style: "Melodic house", genre: "HOUSE", color: "art-violet", note: "A shimmering club-ready rework with warm synths and a steady four-on-the-floor pulse." },
  { n: "02", name: "Hymn for the Weekend", style: "Lo-fi chillhop", genre: "LO-FI", color: "art-amber", note: "Dusty drums, mellow keys, and a softer late-night atmosphere." },
  { n: "03", name: "Skyline Nights", style: "Drum & bass", genre: "DNB", color: "art-blue", note: "A high-energy reimagining with rolling breaks and deep sub bass." }
];
const faqs = [
  ["What audio formats can I upload?", "MusicAI accepts MP3, WAV, and M4A audio files up to 8 minutes long. Files are sent securely to the configured AI provider for processing."],
  ["How does AI remixing work?", "MusicAI uses Replicate's MusicGen Remixer model. It analyzes the musical input and creates a new arrangement guided by your style prompt."],
  ["Will every generation return two versions?", "Yes. Duo Mix starts two independent remix predictions so you can compare different takes. Wave Mix runs one prediction."],
  ["Can I use any song?", "Only upload music you own or have permission to process. You are responsible for the rights to your source audio and generated use."],
  ["How long does a remix take?", "Generation time depends on the model queue, track length, and provider capacity. The workspace updates while your job is running."],
  ["Are my generated tracks stored forever?", "This starter implementation displays the provider's generated output URLs. Replicate-hosted prediction files are temporary, so download results you want to keep."]
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#" aria-label="MusicAI home"><span className="brand-mark"><AudioWaveform size={22}/></span><span>music<span className="brand-accent">ai</span></span></a>
        <nav className="main-nav"><a href="#remixer">AI Remixer</a><a href="#examples">Explore</a><a href="#how-it-works">How it works</a><a href="#faq">FAQ</a></nav>
        <a className="header-cta" href="#remixer">Start creating <ArrowUpRight size={15}/></a>
      </header>

      <section className="hero">
        <div className="hero-glow glow-one"/><div className="hero-glow glow-two"/>
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot"/> AI MUSIC STUDIO <span className="eyebrow-line"/></div>
          <h1>Your music.<br/><span>A new dimension.</span></h1>
          <p className="hero-description">Reimagine any track with AI. Flip the genre, reshape the mood, and discover a sound you didn&apos;t know was there.</p>
          <div className="hero-actions"><a className="button button-primary" href="#remixer"><WandSparkles size={17}/> Remix a song <ArrowUpRight size={16}/></a><a className="text-link" href="#examples">Hear what&apos;s possible <span>↗</span></a></div>
          <div className="hero-proof"><div className="proof-icons"><span><Music2 size={14}/></span><span><Disc3 size={14}/></span><span><Headphones size={14}/></span></div><span>One track. Infinite directions.</span></div>
        </div>
        <div className="hero-art" aria-label="Abstract audio waveform artwork">
          <div className="orbit orbit-a"/><div className="orbit orbit-b"/>
          <div className="vinyl"><div className="vinyl-grooves"/><div className="vinyl-label"><AudioWaveform size={37}/><small>MA</small></div></div>
          <div className="floating-card card-top"><span className="mini-wave">{Array.from({length:18},(_,i)=><i key={i} style={{height:`${12+(i*17)%31}px`}}/>)}</span><span><b>NEW FREQUENCY</b><small>Remix in progress</small></span><Sparkles size={17}/></div>
          <div className="floating-card card-bottom"><span className="equalizer"><i/><i/><i/><i/><i/></span><span><b>GENRE SHIFT</b><small>Original → Future bass</small></span><span className="live-dot"/></div>
          <div className="art-caption">SOUND IS A PLAYGROUND <span>✳</span></div>
        </div>
        <div className="hero-bottom"><span>SCROLL TO EXPLORE</span><span className="scroll-mark">↓</span><span>01 / 04</span></div>
      </section>

      <section className="stats-strip"><div><strong>03</strong><span>ways to remix</span></div><div><strong>08<span>min</span></strong><span>max source length</span></div><div><strong>03</strong><span>audio formats</span></div><div><strong>∞</strong><span>creative directions</span></div></section>

      <section className="section workspace-section" id="remixer">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> THE CREATIVE TOOLKIT</div><h2>Make it <em>yours.</em></h2></div><p>Start with a track. Tell us where to take it.<br/>Your next favorite version is one prompt away.</p></div>
        <RemixWorkspace/>
      </section>

      <section className="section examples-section" id="examples">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> A LITTLE INSPIRATION</div><h2>Hear the <em>possibilities.</em></h2></div><p>Same source. Different universe.<br/>Explore the creative directions you can try.</p></div>
        <div className="example-grid">{examples.map((item)=><article className="example-card" key={item.n}><div className={`example-art ${item.color}`}><span className="example-number">{item.n}</span><div className="example-disc"><div/></div><span className="example-tag">{item.genre}</span><span className="art-wave">{Array.from({length:34},(_,i)=><i key={i} style={{height:`${10+(Math.sin(i*.8)*.5+.5)*48}px`}}/>)}</span></div><div className="example-info"><div><span className="muted-label">REMIX DIRECTION</span><h3>{item.name}</h3><p>{item.note}</p></div><a href="#remixer" aria-label={`Try ${item.style} remix`}><ArrowUpRight size={19}/></a></div><div className="example-style"><span><span className="status-dot"/> {item.style}</span><a href="#remixer">Try this direction ↗</a></div></article>)}</div>
      </section>

      <section className="feature-band" id="how-it-works"><div className="feature-band-inner"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR SOUND, REIMAGINED</div><h2>Less scrolling.<br/><em>More creating.</em></h2><p>Whether you have a clear vision or just want to experiment, MusicAI gives you a simple way to explore new versions of the music you love.</p><a className="button button-light" href="#remixer">Enter the studio <ArrowUpRight size={16}/></a></div><div className="steps">{[{n:"01",title:"Drop your track",desc:"Upload MP3, WAV, or M4A. Your source audio is the starting point."},{n:"02",title:"Set a new direction",desc:"Choose a preset or describe a genre, mood, energy, and instruments."},{n:"03",title:"Generate & compare",desc:"Get one or two AI-generated takes. Listen, compare, and download."}].map(s=><div className="step" key={s.n}><span>{s.n}</span><div><h3>{s.title}</h3><p>{s.desc}</p></div><Check size={17}/></div>)}</div></div></section>

      <section className="section possibilities-section"><div className="center-heading"><div className="eyebrow"><span className="eyebrow-dot"/> THE REMIX PLAYBOOK</div><h2>One song. <em>Many lives.</em></h2><p>Give your original a whole new point of view.</p></div><div className="possibility-grid">{[{icon:"✳",title:"Genre flips",desc:"Pop to house. Acoustic to hip-hop. Take the scenic route."},{icon:"◒",title:"Mood shifts",desc:"Turn the energy up, strip it back, or find a softer side."},{icon:"⌁",title:"Instrumental focus",desc:"Put the spotlight on rhythm, texture, and arrangement."},{icon:"✦",title:"Cinematic reworks",desc:"Build atmosphere, tension, and a bigger sense of scale."}].map((f,i)=><div className="possibility" key={f.title}><span className="possibility-icon">{f.icon}</span><span className="possibility-index">0{i+1}</span><h3>{f.title}</h3><p>{f.desc}</p></div>)}</div></section>

      <section className="section faq-section" id="faq"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> GOOD TO KNOW</div><h2>Questions, <em>answered.</em></h2></div><p>A few details before you hit<br/>that generate button.</p></div><div className="faq-list">{faqs.map(([q,a],i)=><details className="faq-item" key={q}><summary><span className="faq-index">0{i+1}</span><span>{q}</span><span className="faq-plus">+</span></summary><p>{a}</p></details>)}</div></section>

      <section className="final-cta"><div className="final-orb"><AudioWaveform size={54}/></div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR NEXT SOUND STARTS HERE</div><h2>Ready to hear it<br/><em>a different way?</em></h2><a className="button button-primary" href="#remixer"><WandSparkles size={17}/> Open the remix studio <ArrowUpRight size={16}/></a></section>
      <footer className="site-footer"><a className="brand" href="#"><span className="brand-mark"><AudioWaveform size={20}/></span><span>music<span className="brand-accent">ai</span></span></a><span>Make something unexpected.</span><span>© {new Date().getFullYear()} MusicAI. Built for the love of sound.</span></footer>
    </main>
  );
}
