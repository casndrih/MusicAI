import RemixWorkspace from "@/components/remix-workspace";
import { AudioWaveform, ArrowUpRight, Check, Clapperboard, Disc3, Headphones, Layers3, Mic2, Music2, Search, Sparkles, WandSparkles } from "lucide-react";

const examples = [
  { n: "01", name: "Sapphire", style: "Melodic house", genre: "HOUSE", color: "art-violet", note: "Warm synths, a steady kick and a wide melodic lift." },
  { n: "02", name: "Hymn for the Weekend", style: "Lo-fi chillhop", genre: "LO-FI", color: "art-amber", note: "Mellow keys, softened drums and a late-night atmosphere." },
  { n: "03", name: "Skyline Nights", style: "Drum & bass", genre: "DNB", color: "art-blue", note: "Rolling breaks, atmospheric layers and deep sub bass." }
];
const features = [
  [<Mic2 key="vocal" size={21}/>, "Remove vocals", "Separate the vocal performance from a song to create an acapella or karaoke-ready source."],
  [<Waves key="instrumental" size={21}/>, "Make instrumentals", "Create an instrumental version by separating vocals from the backing music."],
  [<Layers3 key="stems" size={21}/>, "Split four stems", "Extract vocals, drums, bass and other instruments into individual WAV files."],
  [<Disc3 key="local" size={21}/>, "Process on your device", "Run the open Demucs ONNX model in your browser using WebGPU or CPU fallback."],
  [<Search key="finder" size={21}/>, "Find music sources", "Search popular music catalogues and streaming platforms by title, artist or phrase."],
  [<Headphones key="privacy" size={21}/>, "Keep audio private", "Your selected audio stays in the browser and is not uploaded to MusicAI for separation."]
];
const steps = [
  ["01", "Choose an audio file", "Select a track from your device. The file is read locally in your browser."],
  ["02", "Run local separation", "Demucs AI extracts vocals, drums, bass and other instruments on your device."],
  ["03", "Preview and save", "Listen to each separated stem and download the WAV files you want to keep."]
];
const faqs = [
  ["Does my audio get uploaded?", "No. Source audio is decoded and processed inside your browser. The AI model file is downloaded from a public model host on first use and cached by your browser."],
  ["What does vocal removal produce?", "MusicAI separates the song into vocals, drums, bass and other instruments. It also creates an instrumental mix by subtracting the vocal stem from the original mix."],
  ["Which audio formats are supported?", "The browser uses your device's audio decoder. Common formats include MP3, WAV, M4A, AAC, FLAC and OGG. Files are limited to 40 MB and three minutes in this initial browser build."],
  ["Does it work on phones?", "It can work on modern mobile browsers, but source separation is memory- and processor-intensive. A desktop or newer phone with WebGPU is recommended."],
  ["Can MusicAI identify a song from a recording?", "The current Music Source Finder searches by a title, artist or phrase you provide. Automatic audio fingerprint recognition is not implemented yet."],
  ["Where do music source links go?", "Search results open on YouTube, Spotify, SoundCloud, Apple Music or Bandcamp. MusicAI does not download or rehost their audio."],
  ["Does MusicAI need Replicate or an AI subscription?", "No. The source-separation engine runs locally in your browser and the Replicate integration has been removed. The model is open-source, but downloading it uses internet data."]
];

export default function Home() {
  return <main>
    <div className="announcement-bar"><span className="announcement-pill">MUSICAI STUDIO</span><span>Explore a new direction for your sound.</span><a href="#remixer">Try the remixer <ArrowUpRight size={13}/></a></div>
    <header className="site-header">
      <a className="brand" href="#" aria-label="MusicAI home"><span className="brand-mark"><AudioWaveform size={22}/></span><span>Music<span className="brand-accent">AI</span></span></a>
      <nav className="main-nav"><a href="#remixer">AI Remixer</a><a href="#examples">Examples</a><a href="#how-it-works">How it works</a><a href="#plans">Studio info</a><a href="#faq">FAQ</a><a href="/about">About</a></nav>
      <a className="header-cta" href="#remixer">Open studio <ArrowUpRight size={15}/></a>
    </header>
    <section className="hero">
      <div className="hero-glow glow-one"/><div className="hero-glow glow-two"/>
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/> LOCAL AI AUDIO STUDIO <span className="eyebrow-line"/></div>
        <h1>Give your song<br/><span>a new sound.</span></h1>
        <p className="hero-description">Remove vocals, create instrumentals and split your music into separate stems. MusicAI runs its AI separation engine locally in your browser.</p>
        <div className="hero-actions"><a className="button button-primary" href="#remixer"><WandSparkles size={17}/> Remix your song <ArrowUpRight size={16}/></a><a className="text-link" href="#examples">Explore remix ideas <span>↗</span></a></div>
        <div className="hero-proof"><div className="proof-icons"><span><Music2 size={14}/></span><span><Disc3 size={14}/></span><span><Headphones size={14}/></span></div><span>Your audio. Your device. Your stems.</span></div>
      </div>
      <div className="hero-art" aria-label="Abstract music record artwork"><div className="orbit orbit-a"/><div className="orbit orbit-b"/>
        <div className="vinyl"><div className="vinyl-grooves"/><div className="vinyl-label"><AudioWaveform size={37}/><small>MA</small></div></div>
        <div className="floating-card card-top"><span className="mini-wave">{Array.from({length:18},(_,i)=><i key={i} style={{height:`${12+(i*17)%31}px`}}/>)}</span><span><b>NEW DIRECTION</b><small>Melodic house · warm synths</small></span><Sparkles size={17}/></div>
        <div className="floating-card card-bottom"><span className="equalizer"><i/><i/><i/><i/><i/></span><span><b>STYLE SHIFT</b><small>Original → New interpretation</small></span><span className="live-dot"/></div>
        <div className="art-caption">MAKE ROOM FOR A NEW SOUND <span>✳</span></div>
      </div>
      <div className="hero-bottom"><span>SCROLL TO EXPLORE</span><span className="scroll-mark">↓</span><span>01 / 04</span></div>
    </section>
    <section className="stats-strip"><div><strong>02</strong><span>local AI separation</span></div><div><strong>30<span>MB</span></strong><span>maximum upload size</span></div><div><strong>03</strong><span>audio formats</span></div><div><strong>∞</strong><span>separated audio stems</span></div></section>
    <section className="section examples-section" id="examples"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> REMIX INSPIRATION</div><h2>Three ways to <em>separate.</em></h2></div><p>Explore what you can extract from a single source recording.</p></div>
      <div className="example-grid">{examples.map(item=><article className="example-card" key={item.n}><div className={`example-art ${item.color}`}><span className="example-number">{item.n}</span><div className="example-disc"><div/></div><span className="example-tag">{item.genre}</span><span className="art-wave">{Array.from({length:34},(_,i)=><i key={i} style={{height:`${10+(Math.sin(i*.8)*.5+.5)*48}px`}}/>)}</span></div><div className="example-info"><div><span className="muted-label">REMIX DIRECTION</span><h3>{item.name}</h3><p>{item.note}</p></div><a href="#remixer" aria-label={`Try ${item.style} remix`}><ArrowUpRight size={19}/></a></div><div className="example-style"><span><span className="status-dot"/> {item.style}</span><a href="#remixer">Try this direction ↗</a></div></article>)}</div>
    </section>
    <section className="section feature-section"><div className="center-heading"><div className="eyebrow"><span className="eyebrow-dot"/> THE AUDIO TOOLKIT</div><h2>Separate the sound.<br/><em>Keep every layer.</em></h2><p>Use local AI to isolate vocals and instruments without uploading your recording.</p></div><div className="feature-grid">{features.map(([icon,title,desc],i)=><article className="feature-card" key={title as string}><span className="feature-icon">{icon}</span><span className="feature-number">0{i+1}</span><h3>{title}</h3><p>{desc}</p></article>)}</div></section>
    <section className="feature-band" id="how-it-works"><div className="feature-band-inner"><div><div className="eyebrow"><span className="eyebrow-dot"/> A SIMPLE CREATIVE FLOW</div><h2>From one mix<br/><em>to individual stems.</em></h2><p>Choose a file, run the local model, then preview and save your separated WAV stems.</p><a className="button button-light" href="#remixer">Enter the studio <ArrowUpRight size={16}/></a></div><div className="steps">{steps.map(s=><div className="step" key={s[0]}><span>{s[0]}</span><div><h3>{s[1]}</h3><p>{s[2]}</p></div><Check size={17}/></div>)}</div></div></section>
    <section className="section workspace-section" id="remixer"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR CREATIVE TOOLKIT</div><h2>Work with your <em>audio.</em></h2></div><p>Upload your audio and run local separation or find catalogue links.</p></div><RemixWorkspace/></section>
    <section className="section usecase-section"><div className="center-heading"><div className="eyebrow"><span className="eyebrow-dot"/> MADE FOR EXPERIMENTING</div><h2>One track. <em>Many possibilities.</em></h2><p>Use a remix as a creative sketch, an alternate mood or a new starting point.</p></div><div className="usecase-grid"><article><Layers3 size={22}/><h3>Production ideas</h3><p>Explore alternate arrangements and textures before refining a final production.</p></article><article><Headphones size={22}/><h3>Content projects</h3><p>Develop a different musical direction for a video, podcast or personal project.</p></article><article><SlidersHorizontal size={22}/><h3>Creative discovery</h3><p>Try genres and moods you might not have considered for the original track.</p></article></div></section>
    <section className="section plans-section" id="plans"><div className="plans-panel"><div><div className="eyebrow"><span className="eyebrow-dot"/> MUSICAI, RIGHT NOW</div><h2>Independent processing.<br/><em>No AI API bill.</em></h2><p>MusicAI uses an open Demucs ONNX model and ONNX Runtime Web. Source audio is processed in the browser; no Replicate API, AI generation account or server-side audio processing is required.</p></div><div className="plans-facts"><div><span>AI ENGINE</span><b>Demucs ONNX · Browser runtime</b></div><div><span>PROCESSING</span><b>Local WebGPU / WASM</b></div><div><span>AUDIO PRIVACY</span><b>Source files stay on device</b></div><div><span>MODEL DOWNLOAD</span><b>~166 MB, cached in browser</b></div><a className="button button-primary" href="#remixer">Open local audio tools <ArrowUpRight size={16}/></a></div></div></section>
    <section className="section faq-section" id="faq"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> GOOD TO KNOW</div><h2>Questions, <em>answered.</em></h2></div><p>Important details about local audio processing.</p></div><div className="faq-list">{faqs.map(([q,a],i)=><details className="faq-item" key={q}><summary><span className="faq-index">0{i+1}</span><span>{q}</span><span className="faq-plus">+</span></summary><p>{a}</p></details>)}</div></section>
    <section className="final-cta"><div className="final-orb"><AudioWaveform size={54}/></div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR NEXT SOUND STARTS HERE</div><h2>Ready to hear it<br/><em>a different way?</em></h2><a className="button button-primary" href="#remixer"><WandSparkles size={17}/> Open the remix studio <ArrowUpRight size={16}/></a></section>
    <footer className="site-footer"><a className="brand" href="#"><span className="brand-mark"><AudioWaveform size={20}/></span><span>Music<span className="brand-accent">AI</span></span></a><span>Independent local AI music studio. <a href="/about">About the developer</a></span><span>© {new Date().getFullYear()} MusicAI. Built by <a href="https://github.com/casndrih" target="_blank" rel="noreferrer">casndrih</a>. Not affiliated with MusicWave.ai.</span></footer>
  </main>;
}
