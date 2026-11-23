import RemixWorkspace from "@/components/remix-workspace";
import { AudioWaveform, ArrowUpRight, Check, Clapperboard, Disc3, Guitar, Headphones, Layers3, Mic2, Music2, Radio, SlidersHorizontal, Sparkles, WandSparkles, Waves } from "lucide-react";

const examples = [
  { n: "01", name: "Sapphire", style: "Melodic house", genre: "HOUSE", color: "art-violet", note: "Warm synths, a steady kick and a wide melodic lift." },
  { n: "02", name: "Hymn for the Weekend", style: "Lo-fi chillhop", genre: "LO-FI", color: "art-amber", note: "Mellow keys, softened drums and a late-night atmosphere." },
  { n: "03", name: "Skyline Nights", style: "Drum & bass", genre: "DNB", color: "art-blue", note: "Rolling breaks, atmospheric layers and deep sub bass." }
];
const features = [
  [<Waves key="genre" size={21}/>, "Change the genre", "Reimagine a track as house, hip-hop, synthwave, Afrobeats, drum & bass or another style."],
  [<Disc3 key="lofi" size={21}/>, "Find a lo-fi feel", "Explore mellow keys, softened percussion and a warmer, more relaxed production direction."],
  [<Radio key="club" size={21}/>, "Build club energy", "Ask for punchier drums, stronger low end and a bigger, dance-focused arrangement."],
  [<Clapperboard key="cinematic" size={21}/>, "Go cinematic", "Try atmospheric textures, dramatic builds and a widescreen sense of movement."],
  [<Guitar key="arrangement" size={21}/>, "Shift the arrangement", "Guide the model toward different instruments, rhythmic emphasis and production textures."],
  [<Mic2 key="vocal" size={21}/>, "Shape vocal direction", "Add vocal notes or lyric ideas as prompt guidance. Dedicated vocal replacement is not available yet."]
];
const steps = [
  ["01", "Upload your track", "Bring an MP3, WAV or M4A file you own or have permission to use."],
  ["02", "Describe the new sound", "Choose a quick preset or write a custom direction with genre, mood and instruments."],
  ["03", "Generate and compare", "Create one or two independent takes, listen to the results and download what you like."]
];
const faqs = [
  ["Which audio formats can I upload?", "MusicAI accepts MP3, WAV and M4A files up to 30 MB. Track duration is not yet enforced by the upload form, so very long files may fail at the model provider."],
  ["How does MusicAI create a remix?", "This independent project sends your source audio and text direction to the Replicate MusicGen Remixer model. Results depend on model availability."],
  ["What is Wave Mix vs Duo Mix?", "Wave Mix starts one model prediction. Duo Mix starts two independent predictions so you can compare two takes. These are MusicAI options, not MusicWave services."],
  ["Can I replace lyrics or vocals?", "Custom fields are included as text guidance. They do not provide dedicated lyric replacement, vocal isolation or voice conversion."],
  ["Can I remix a commercial song?", "Only upload audio you own or have permission to process. You are responsible for rights to the source recording, composition, lyrics and generated use."],
  ["Are my results stored permanently?", "No account library or permanent storage is connected yet. Generated files are hosted by the AI provider temporarily, so download any result you want to keep."],
  ["Does MusicAI have subscriptions or credits?", "Not in this version. Accounts, payment, credit balances and subscriptions are not enabled, and no MusicAI plan is being sold through this page."]
];

export default function Home() {
  return <main>
    <div className="announcement-bar"><span className="announcement-pill">MUSICAI STUDIO</span><span>Explore a new direction for your sound.</span><a href="#remixer">Try the remixer <ArrowUpRight size={13}/></a></div>
    <header className="site-header">
      <a className="brand" href="#" aria-label="MusicAI home"><span className="brand-mark"><AudioWaveform size={22}/></span><span>music<span className="brand-accent">ai</span></span></a>
      <nav className="main-nav"><a href="#remixer">AI Remixer</a><a href="#examples">Examples</a><a href="#how-it-works">How it works</a><a href="#plans">Studio info</a><a href="#faq">FAQ</a><a href="/about">About</a></nav>
      <a className="header-cta" href="#remixer">Open studio <ArrowUpRight size={15}/></a>
    </header>
    <section className="hero">
      <div className="hero-glow glow-one"/><div className="hero-glow glow-two"/>
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/> AI SONG REMIXER <span className="eyebrow-line"/></div>
        <h1>Give your song<br/><span>a new sound.</span></h1>
        <p className="hero-description">Rework a track into a different genre, mood or production style. Start with your audio, describe the direction, and explore a fresh interpretation.</p>
        <div className="hero-actions"><a className="button button-primary" href="#remixer"><WandSparkles size={17}/> Remix your song <ArrowUpRight size={16}/></a><a className="text-link" href="#examples">Explore remix ideas <span>↗</span></a></div>
        <div className="hero-proof"><div className="proof-icons"><span><Music2 size={14}/></span><span><Disc3 size={14}/></span><span><Headphones size={14}/></span></div><span>One source. More ways to hear it.</span></div>
      </div>
      <div className="hero-art" aria-label="Abstract music record artwork"><div className="orbit orbit-a"/><div className="orbit orbit-b"/>
        <div className="vinyl"><div className="vinyl-grooves"/><div className="vinyl-label"><AudioWaveform size={37}/><small>MA</small></div></div>
        <div className="floating-card card-top"><span className="mini-wave">{Array.from({length:18},(_,i)=><i key={i} style={{height:`${12+(i*17)%31}px`}}/>)}</span><span><b>NEW DIRECTION</b><small>Melodic house · warm synths</small></span><Sparkles size={17}/></div>
        <div className="floating-card card-bottom"><span className="equalizer"><i/><i/><i/><i/><i/></span><span><b>STYLE SHIFT</b><small>Original → New interpretation</small></span><span className="live-dot"/></div>
        <div className="art-caption">MAKE ROOM FOR A NEW SOUND <span>✳</span></div>
      </div>
      <div className="hero-bottom"><span>SCROLL TO EXPLORE</span><span className="scroll-mark">↓</span><span>01 / 04</span></div>
    </section>
    <section className="stats-strip"><div><strong>02</strong><span>independent remix takes</span></div><div><strong>30<span>MB</span></strong><span>maximum upload size</span></div><div><strong>03</strong><span>audio formats</span></div><div><strong>∞</strong><span>creative directions</span></div></section>
    <section className="section examples-section" id="examples"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> REMIX INSPIRATION</div><h2>Three ways to <em>reimagine.</em></h2></div><p>Explore creative directions.<br/>These are visual concepts, not playable demo tracks.</p></div>
      <div className="example-grid">{examples.map(item=><article className="example-card" key={item.n}><div className={`example-art ${item.color}`}><span className="example-number">{item.n}</span><div className="example-disc"><div/></div><span className="example-tag">{item.genre}</span><span className="art-wave">{Array.from({length:34},(_,i)=><i key={i} style={{height:`${10+(Math.sin(i*.8)*.5+.5)*48}px`}}/>)}</span></div><div className="example-info"><div><span className="muted-label">REMIX DIRECTION</span><h3>{item.name}</h3><p>{item.note}</p></div><a href="#remixer" aria-label={`Try ${item.style} remix`}><ArrowUpRight size={19}/></a></div><div className="example-style"><span><span className="status-dot"/> {item.style}</span><a href="#remixer">Try this direction ↗</a></div></article>)}</div>
    </section>
    <section className="section feature-section"><div className="center-heading"><div className="eyebrow"><span className="eyebrow-dot"/> THE REMIX PLAYBOOK</div><h2>Change the feel.<br/><em>Keep exploring.</em></h2><p>Start with a creative idea and use a prompt to guide the next version.</p></div><div className="feature-grid">{features.map(([icon,title,desc],i)=><article className="feature-card" key={title as string}><span className="feature-icon">{icon}</span><span className="feature-number">0{i+1}</span><h3>{title}</h3><p>{desc}</p></article>)}</div></section>
    <section className="feature-band" id="how-it-works"><div className="feature-band-inner"><div><div className="eyebrow"><span className="eyebrow-dot"/> A SIMPLE CREATIVE FLOW</div><h2>From source track<br/><em>to fresh perspective.</em></h2><p>No complicated production setup needed. Bring a track and describe the direction you want to explore.</p><a className="button button-light" href="#remixer">Enter the studio <ArrowUpRight size={16}/></a></div><div className="steps">{steps.map(s=><div className="step" key={s[0]}><span>{s[0]}</span><div><h3>{s[1]}</h3><p>{s[2]}</p></div><Check size={17}/></div>)}</div></div></section>
    <section className="section workspace-section" id="remixer"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR CREATIVE TOOLKIT</div><h2>Make it <em>your own.</em></h2></div><p>Upload your source, set a direction and choose<br/>whether to create one take or two.</p></div><RemixWorkspace/></section>
    <section className="section usecase-section"><div className="center-heading"><div className="eyebrow"><span className="eyebrow-dot"/> MADE FOR EXPERIMENTING</div><h2>One track. <em>Many possibilities.</em></h2><p>Use a remix as a creative sketch, an alternate mood or a new starting point.</p></div><div className="usecase-grid"><article><Layers3 size={22}/><h3>Production ideas</h3><p>Explore alternate arrangements and textures before refining a final production.</p></article><article><Headphones size={22}/><h3>Content projects</h3><p>Develop a different musical direction for a video, podcast or personal project.</p></article><article><SlidersHorizontal size={22}/><h3>Creative discovery</h3><p>Try genres and moods you might not have considered for the original track.</p></article></div></section>
    <section className="section plans-section" id="plans"><div className="plans-panel"><div><div className="eyebrow"><span className="eyebrow-dot"/> MUSICAI, RIGHT NOW</div><h2>A clear studio.<br/><em>No pretend pricing.</em></h2><p>MusicAI currently offers AI remix generation through the configured Replicate model. Accounts, subscriptions, credits, saved libraries and payment checkout are not enabled yet.</p></div><div className="plans-facts"><div><span>AI ENGINE</span><b>Replicate · MusicGen Remixer</b></div><div><span>GENERATION</span><b>1 or 2 model predictions</b></div><div><span>RESULT STORAGE</span><b>Download provider-hosted results</b></div><div><span>BILLING</span><b>Not implemented</b></div><a className="button button-primary" href="#remixer">Try the current studio <ArrowUpRight size={16}/></a></div></div></section>
    <section className="section faq-section" id="faq"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> GOOD TO KNOW</div><h2>Questions, <em>answered.</em></h2></div><p>Important details about the current<br/>MusicAI remix experience.</p></div><div className="faq-list">{faqs.map(([q,a],i)=><details className="faq-item" key={q}><summary><span className="faq-index">0{i+1}</span><span>{q}</span><span className="faq-plus">+</span></summary><p>{a}</p></details>)}</div></section>
    <section className="final-cta"><div className="final-orb"><AudioWaveform size={54}/></div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR NEXT SOUND STARTS HERE</div><h2>Ready to hear it<br/><em>a different way?</em></h2><a className="button button-primary" href="#remixer"><WandSparkles size={17}/> Open the remix studio <ArrowUpRight size={16}/></a></section>
    <footer className="site-footer"><a className="brand" href="#"><span className="brand-mark"><AudioWaveform size={20}/></span><span>music<span className="brand-accent">ai</span></span></a><span>Independent AI music remix studio. <a href="/about">About the developer</a></span><span>© {new Date().getFullYear()} MusicAI. Built by <a href="https://github.com/casndrih" target="_blank" rel="noreferrer">casndrih</a>. Not affiliated with MusicWave.ai.</span></footer>
  </main>;
}
