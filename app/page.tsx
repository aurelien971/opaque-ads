// The marketing homepage — the designer's "natural premium" direction:
// warm paper, roman serif display, mono labels, one olive accent, and real
// CSS perspective for depth. Spine: a five-step journey, each step shown as
// a card with the artifact that step produces. Step 4 is the one dark card.
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import OrbitMark from "@/components/OrbitMark";
import Reveal from "@/components/Reveal";

const TILT_R = { transform: "rotateY(-12deg) rotateX(6deg)" }; // artifact on the right
const TILT_L = { transform: "rotateY(12deg) rotateX(6deg)" };  // artifact on the left
const ARTIFACT_SHADOW = "0 40px 60px -40px rgba(22,21,15,0.6)";

function Label({ n, children, dark = false }: { n: number; children: React.ReactNode; dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 font-mono text-[11px]" style={{ color: dark ? "rgba(244,241,234,0.55)" : "#8A8779" }}>
      <span
        className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px]"
        style={{ border: `1px solid ${dark ? "rgba(244,241,234,0.35)" : "rgba(22,21,15,0.25)"}`, color: dark ? "#F4F1EA" : "#16150F" }}
      >
        {n}
      </span>
      {children}
    </div>
  );
}

function Copy({ n, label, title, body, dark = false }: { n: number; label: string; title: string; body: string; dark?: boolean }) {
  return (
    <div className="flex flex-col gap-3.5">
      <Label n={n} dark={dark}>{label}</Label>
      <h3 className="serif text-[28px] leading-[1.1] md:text-[36px]">{title}</h3>
      <p className="max-w-[420px] text-[16px] leading-[1.6]" style={{ color: dark ? "rgba(244,241,234,0.7)" : "#55534A" }}>{body}</p>
    </div>
  );
}

// ---- Artifacts -------------------------------------------------------------

function ConnectCard() {
  return (
    <div className="tilt flex w-[260px] flex-col gap-3.5 rounded-[20px] border border-[rgba(22,21,15,0.08)] bg-ink p-[22px]" style={{ ...TILT_R, boxShadow: ARTIFACT_SHADOW }}>
      <div className="h-2.5 w-[60%] rounded-[5px] bg-[rgba(22,21,15,0.14)]" />
      <div className="h-2.5 w-[85%] rounded-[5px] bg-[rgba(22,21,15,0.08)]" />
      <div className="mt-1.5 flex h-9 items-center justify-center rounded-full bg-fg text-[12px] text-ink">Connect TikTok</div>
    </div>
  );
}

function UploadGrid() {
  const shots = ["/img/creator-review.jpg", "/img/creator-unboxing.jpg", "/img/creator-talking.jpg", "/img/creator-review.jpg", "/img/creator-talking.jpg"];
  return (
    <div className="tilt grid w-[280px] grid-cols-3 gap-2.5 rounded-[20px] border border-dashed border-[rgba(22,21,15,0.2)] bg-ink p-5" style={{ ...TILT_L, boxShadow: ARTIFACT_SHADOW }}>
      {shots.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={src} alt="" className="aspect-[9/14] w-full rounded-[10px] object-cover" />
      ))}
      <div className="mono-sm flex aspect-[9/14] items-center justify-center rounded-[10px] border border-[rgba(22,21,15,0.14)]">+18</div>
    </div>
  );
}

function WeekCalendar() {
  return (
    <div className="tilt flex w-[300px] flex-col gap-3 rounded-[20px] border border-[rgba(22,21,15,0.08)] bg-ink p-5" style={{ ...TILT_R, boxShadow: ARTIFACT_SHADOW }}>
      <div className="mono-sm flex justify-between">
        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {[0, 1, 0, 1, 0, 1, 0].map((on, i) => (
          <div key={i} className="h-11 rounded-lg" style={{ background: on ? "#4E5B3A" : "rgba(22,21,15,0.07)" }} />
        ))}
      </div>
      <div className="mono-sm">3 posts a week · 6:00 PM</div>
    </div>
  );
}

function ClockRing() {
  return (
    <div className="tilt" style={TILT_L}>
      <OrbitMark size={190} ringWidth={2} ring="rgba(244,241,234,0.22)" dot="#F4F1EA" glow>
        <span className="font-mono text-[11px]" style={{ color: "rgba(244,241,234,0.6)" }}>6:00 PM</span>
      </OrbitMark>
    </div>
  );
}

function ResultsBars() {
  const bars = [34, 56, 100, 48, 62];
  return (
    <div className="tilt flex w-[280px] flex-col gap-3 rounded-[20px] border border-[rgba(22,21,15,0.08)] bg-ink p-5" style={{ ...TILT_L, boxShadow: ARTIFACT_SHADOW }}>
      <div className="flex h-24 items-end gap-2.5">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-[6px]" style={{ height: `${h}%`, background: h === 100 ? "#4E5B3A" : `rgba(22,21,15,${0.12 + (i % 2) * 0.04})` }} />
        ))}
      </div>
      <div className="mono-sm">best day · Thursday 6:00 PM</div>
    </div>
  );
}

// ---- Steps -----------------------------------------------------------------

const STEPS = [
  { label: "Sign up", title: "You're set up before your coffee cools.", body: "Connect your TikTok account with one tap. Nothing to install, nothing to learn.", art: <ConnectCard />, artLeft: false },
  { label: "Upload", title: "Empty your camera roll in one drag.", body: "Drop in everything you filmed this week. Captions and sounds come along with each video.", art: <UploadGrid />, artLeft: true },
  { label: "Schedule", title: "Pick the hours your fans are awake.", body: "Choose a few good times once. Every video you upload slots itself into the next free one.", art: <WeekCalendar />, artLeft: false },
  { label: "Posting", title: "It posts without you. Even while you sleep.", body: "No alarms, no phone in hand, no missed days. Your account keeps showing up on its own.", art: <ClockRing />, artLeft: true, dark: true },
  { label: "Learn", title: "Find out which videos to make more of.", body: "Every post reports back in plain words: what people watched, what they skipped, when to post next.", art: <ResultsBars />, artLeft: true },
];

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-10 pt-[60px] text-center md:px-12 md:pt-[90px]">
          <div className="sun pointer-events-none absolute left-1/2 top-[-260px] h-[900px] w-[1300px] -translate-x-1/2 rounded-full" />
          <div className="relative mx-auto max-w-[1080px]">
            <p className="mono">Free while we build</p>
            <h1 className="serif mx-auto mt-5 max-w-[1000px] text-[44px] leading-[1.0] md:text-[64px] lg:text-[96px]" style={{ textWrap: "balance" }}>
              A month of videos, posted while you get on with your life.
            </h1>
            <p className="mx-auto mt-7 max-w-[580px] text-[18px] leading-[1.6] text-muted" style={{ textWrap: "pretty" }}>
              Upload everything you filmed. Choose the times. OAISIS Labs posts each video to TikTok for you and tells you which ones people loved.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="pill-primary px-8 py-4 text-[15px] font-medium">Start free</Link>
              <Link href="/#journey" className="pill-secondary px-8 py-4 text-[15px] font-medium">See the five steps</Link>
            </div>
            <p className="mt-4 text-[13px] text-faint">No card. Your account stays yours.</p>

            {/* Phone stage */}
            <div className="mt-[76px] flex items-end justify-center gap-[26px]" style={{ perspective: "1600px", transformStyle: "preserve-3d" }}>
              <div
                className="relative hidden aspect-[9/16] w-[180px] overflow-hidden rounded-[26px] md:block lg:w-[230px]"
                style={{ transform: "rotateY(16deg) rotateX(5deg) translateZ(-70px)", boxShadow: "0 50px 70px -40px rgba(22,21,15,0.55)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/creator-unboxing.jpg" alt="" className="h-full w-full object-cover" />
                <span className="mono-sm absolute bottom-4 left-4 rounded-full bg-[#F4F1EA]/90 px-2 py-1 !text-[#55534A]">clip 12 · queued</span>
              </div>

              <div
                className="flex aspect-[9/16] w-[268px] flex-col gap-3.5 rounded-[30px] p-4"
                style={{ transform: "translateZ(60px)", background: "linear-gradient(180deg,#FBFAF6,#F1EDE3)", boxShadow: "0 70px 90px -46px rgba(22,21,15,0.6)" }}
              >
                <div className="mono-sm flex items-center gap-2 text-left">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  posting now · 6:00 PM
                </div>
                <div className="relative h-[60%] overflow-hidden rounded-[18px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/creator-talking.jpg" alt="" className="h-full w-full object-cover" />
                </div>
                <p className="text-left text-[13px] leading-snug text-muted">Thursday&apos;s video went out on time.</p>
              </div>

              <div
                className="relative hidden aspect-[9/16] w-[180px] overflow-hidden rounded-[26px] md:block lg:w-[230px]"
                style={{ transform: "rotateY(-16deg) rotateX(5deg) translateZ(-70px)", boxShadow: "0 50px 70px -40px rgba(22,21,15,0.55)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/creator-review.jpg" alt="" className="h-full w-full object-cover" />
                <span className="mono-sm absolute bottom-4 left-4 rounded-full bg-[#F4F1EA]/90 px-2 py-1 !text-[#55534A]">posted · 12.4K views</span>
              </div>
            </div>
          </div>
        </section>

        {/* Journey intro */}
        <section id="journey" className="mx-auto max-w-[1080px] px-6 pb-10 pt-[90px] md:px-12 md:pt-[130px]">
          <p className="mono">Five steps, start to finish</p>
          <h2 className="serif mt-[18px] max-w-[720px] text-[40px] leading-[1.08] md:text-[54px]">You do the first ten minutes. We do the rest of the month.</h2>
        </section>

        {/* Step stack */}
        <div className="mx-auto flex max-w-[1080px] flex-col gap-7 px-6 pb-[60px] pt-10 md:px-12" style={{ perspective: "1800px" }}>
          {STEPS.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div
                className="grid items-center gap-10 rounded-[28px] p-7 md:grid-cols-2 md:p-11"
                style={
                  s.dark
                    ? { background: "#16150F", color: "#F4F1EA", boxShadow: "0 50px 70px -50px rgba(22,21,15,0.9)" }
                    : { background: "#FBFAF6", border: "1px solid rgba(22,21,15,0.08)", boxShadow: "0 40px 60px -50px rgba(22,21,15,0.7)" }
                }
              >
                <div className={`order-1 ${s.artLeft ? "md:order-2" : "md:order-1"}`}>
                  <Copy n={i + 1} label={s.label} title={s.title} body={s.body} dark={s.dark} />
                </div>
                <div className={`order-2 flex justify-center ${s.artLeft ? "md:order-1" : "md:order-2"}`} style={{ transformStyle: "preserve-3d" }}>
                  {s.art}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Closing panel */}
        <section className="mx-auto max-w-[1080px] px-6 pb-[90px] pt-[60px] md:px-12 md:pb-[130px]">
          <div className="relative overflow-hidden rounded-[32px] border border-[rgba(22,21,15,0.08)] px-6 py-[60px] text-center md:px-12 md:py-20" style={{ background: "linear-gradient(180deg,#FBFAF6,#EFEAE0)" }}>
            <div className="sun pointer-events-none absolute left-1/2 top-[-180px] h-[500px] w-[800px] -translate-x-1/2 rounded-full" />
            <div className="relative">
              <h2 className="serif mx-auto max-w-[640px] text-[34px] leading-[1.08] md:text-[52px]">Ten minutes on Sunday. A full month of posts.</h2>
              <Link href="/signup" className="pill-primary mt-[34px] inline-block px-8 py-4 text-[15px] font-medium">Start free</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
