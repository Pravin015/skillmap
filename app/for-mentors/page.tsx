"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
const heading = "font-[family-name:var(--font-heading)]";

export default function ForMentorsPage() {
  const [e1, setE1] = useState(0);
  const [e2, setE2] = useState(0);
  const [e3, setE3] = useState(0);
  const [earnVis, setEarnVis] = useState(false);
  const earnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }); }, { threshold: 0.15 });
    document.querySelectorAll(".animate-on-scroll").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!earnRef.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setEarnVis(true); }, { threshold: 0.5 });
    obs.observe(earnRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!earnVis) return;
    const dur = 1500; const steps = 30; const iv = dur / steps; let step = 0;
    const timer = setInterval(() => {
      step++; const p = 1 - Math.pow(1 - step / steps, 3);
      setE1(Math.round(8000 * p)); setE2(Math.round(32000 * p)); setE3(Math.round(96000 * p));
      if (step >= steps) clearInterval(timer);
    }, iv);
    return () => clearInterval(timer);
  }, [earnVis]);

  return (
    <div>
      {/* HERO */}
      <section className="relative px-4 flex flex-col items-center justify-center text-center" style={{ background: "#0F0E14", minHeight: "85vh", paddingTop: "7rem", paddingBottom: "5rem" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(124,58,237,0.07) 0%, transparent 70%)" }} />
        <div className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent)" }} />
        <div className="absolute inset-0 pointer-events-none hero-grid-bg" />
        <div className="relative max-w-[700px] mx-auto w-full">
          <div className="section-eyebrow justify-center animate-fade-up">FOR INDUSTRY MENTORS</div>
          <h1 className={heading} style={{ fontWeight: 700, fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: "1.5rem" }}>
            <span className="hero-line hero-line-1" style={{ color: "#fff" }}>Share What You Know.</span>
            <span className="hero-line hero-line-2" style={{ color: "#F59E0B" }}>Get Paid.</span>
            <span className="hero-line hero-line-3" style={{ color: "#fff" }}>Or Give Back.</span>
          </h1>
          <p className="animate-fade-up-2 mx-auto" style={{ color: "#6B6776", fontSize: "clamp(1rem, 2vw, 1.15rem)", lineHeight: 1.75, maxWidth: 550, marginBottom: "2.5rem" }}>Guide India&apos;s next generation of professionals from your own experience. Set your rates, host events, build your reputation.</p>
          <div className="animate-fade-up-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <Link href="/forms/mentor-onboarding" className="btn-primary animate-glow no-underline" style={{ padding: "0.9rem 2.2rem", fontSize: "1rem" }}>Apply as Mentor — Free</Link>
            <a href="#earn" className="btn-outline no-underline">See Earning Potential &#8595;</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mt-10">
            {[{n:"Rs.96K+",l:"Potential Monthly",s:"For senior mentors"},{n:"Free",l:"To Join",s:"No platform fee"},{n:"4.8&#9733;",l:"Average Rating",s:"Across all mentors"}].map((x)=>(<div key={x.l} className="card-dark text-center" style={{padding:"1.25rem 1.5rem"}}><div className={heading} style={{fontSize:"2rem",fontWeight:700,color:"#fff"}} dangerouslySetInnerHTML={{__html:x.n}}/><div style={{fontSize:"0.85rem",fontWeight:600,color:"rgba(255,255,255,0.7)",marginTop:"0.25rem"}}>{x.l}</div><div style={{fontSize:"0.75rem",color:"#9A95A6",marginTop:"0.2rem"}}>{x.s}</div></div>))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4" style={{ background: "#fff", paddingTop: "6rem", paddingBottom: "6rem" }}>
        <div className="mx-auto" style={{ maxWidth: 1200 }}>
          <div className="text-center mb-12">
            <div className="section-eyebrow justify-center animate-on-scroll">WHAT YOU GET</div>
            <h2 className={heading+" animate-on-scroll"} style={{color:"#0F0E14"}}>Everything You Need to Mentor.</h2>
            <p className="animate-on-scroll mt-2 mx-auto" style={{color:"#9A95A6",fontSize:"1rem",maxWidth:500}}>We handle the platform. You handle the expertise.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Rates */}
            <div className="card-dark animate-on-scroll" style={{borderTop:"2px solid #F59E0B",padding:"2.5rem"}}>
              <div className="flex items-center gap-3 mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span style={{background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:999,padding:"0.2rem 0.7rem",fontSize:"0.7rem",fontWeight:600,color:"#F59E0B"}}>Full Control</span>
              </div>
              <h3 className={heading} style={{color:"#fff",fontSize:"1.25rem",fontWeight:700,marginBottom:"0.5rem"}}>You Set the Price. We Handle the Rest.</h3>
              <p style={{color:"#6B6776",fontSize:"0.9rem",lineHeight:1.65,marginBottom:"1.5rem"}}>Charge Rs.300-2,000 per session for 1-on-1 or group mentoring. Switch to volunteer mode anytime. Accept bookings, share Zoom links, and get paid — all from your dashboard.</p>
              <div style={{borderRadius:"0.75rem",padding:"1rem",background:"rgba(255,255,255,0.03)"}}>
                <div style={{fontSize:"0.7rem",color:"#6B6776",marginBottom:"0.75rem",fontWeight:600}}>Rate Settings</div>
                {[{l:"1-on-1 Session",v:"Rs.800"},{l:"Group Session (up to 5)",v:"Rs.300/person"}].map((r)=>(<div key={r.l} className="flex justify-between items-center mb-2" style={{fontSize:"0.8rem"}}><span style={{color:"rgba(255,255,255,0.6)"}}>{r.l}</span><span style={{color:"#7C3AED",fontWeight:600,background:"rgba(124,58,237,0.1)",padding:"0.2rem 0.5rem",borderRadius:"0.3rem",fontSize:"0.75rem"}}>{r.v}</span></div>))}
                <div className="flex justify-between items-center mt-3 pt-2" style={{borderTop:"1px solid rgba(255,255,255,0.06)",fontSize:"0.75rem"}}><span style={{color:"rgba(255,255,255,0.5)"}}>Volunteer Mode</span><div style={{width:32,height:18,borderRadius:9,background:"rgba(255,255,255,0.1)",position:"relative"}}><div style={{width:14,height:14,borderRadius:7,background:"rgba(255,255,255,0.3)",position:"absolute",top:2,left:2}}/></div></div>
              </div>
            </div>
            {/* Dashboard */}
            <div className="card-dark animate-on-scroll" style={{borderTop:"2px solid #7C3AED",padding:"2.5rem"}}>
              <div className="flex items-center gap-3 mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                <span style={{background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.25)",borderRadius:999,padding:"0.2rem 0.7rem",fontSize:"0.7rem",fontWeight:600,color:"#7C3AED"}}>Organised</span>
              </div>
              <h3 className={heading} style={{color:"#fff",fontSize:"1.25rem",fontWeight:700,marginBottom:"0.5rem"}}>All Your Sessions, One Place</h3>
              <p style={{color:"#6B6776",fontSize:"0.9rem",lineHeight:1.65,marginBottom:"1.5rem"}}>See incoming requests, accept with a Zoom link and notes, or decline with a reason. Mark sessions complete, get rated, and track your earnings.</p>
              <div style={{borderRadius:"0.75rem",padding:"1rem",background:"rgba(255,255,255,0.03)",display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"0.5rem",padding:"0.6rem 0.75rem",fontSize:"0.75rem"}}>
                  <div className="flex justify-between"><span style={{color:"rgba(255,255,255,0.7)",fontWeight:600}}>Arjun M.</span><span style={{color:"#6B6776"}}>Tomorrow, 6 PM</span></div>
                  <div style={{color:"#6B6776",fontSize:"0.7rem",marginTop:"0.2rem"}}>Mock Interview — TCS Java</div>
                  <div className="flex gap-2 mt-2"><span style={{background:"rgba(124,58,237,0.15)",color:"#7C3AED",padding:"0.2rem 0.5rem",borderRadius:"0.3rem",fontSize:"0.65rem",fontWeight:600}}>Accept</span><span style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.4)",padding:"0.2rem 0.5rem",borderRadius:"0.3rem",fontSize:"0.65rem"}}>Decline</span></div>
                </div>
                <div style={{background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:"0.5rem",padding:"0.6rem 0.75rem",fontSize:"0.75rem"}}>
                  <div className="flex justify-between"><span style={{color:"rgba(255,255,255,0.7)",fontWeight:600}}>Priya S.</span><span style={{color:"#7C3AED",fontSize:"0.65rem",fontWeight:600}}>Confirmed</span></div>
                  <div style={{color:"#6B6776",fontSize:"0.7rem",marginTop:"0.2rem"}}>Career Roadmap — KPMG Finance</div>
                  <div style={{color:"#7C3AED",fontSize:"0.65rem",marginTop:"0.3rem"}}>Zoom link added &#10003;</div>
                </div>
              </div>
            </div>
          </div>
          {/* Tier 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[{t:"Stand Out as Verified",d:"Apply, get reviewed by our team, and receive your Verified badge. Verified mentors get 3-4x more bookings.",tg:"Admin reviewed · Verified badge",a:false},{t:"Reach Hundreds at Once",d:"Create workshops, webinars, and career guidance events. Free or paid with Razorpay. Build your reputation at scale.",tg:"Free or paid · Razorpay integrated",a:false},{t:"Build Your Personal Brand",d:"Write career tips and interview guides on the AstraaHire blog. Your articles reach thousands of students.",tg:"Blog access · Admin reviewed",a:false},{t:"Let Your Work Speak",d:"Students rate and review every session. Your average rating displays on your public profile. Higher-rated mentors unlock more visibility.",tg:"Public ratings · Honest reviews",a:true}].map((f)=>(<div key={f.t} className="animate-on-scroll" style={{background:f.a?"#FFFBF0":"#F3EFE8",border:"1px solid "+(f.a?"rgba(245,158,11,0.2)":"#E8E2D6"),borderRadius:"0.75rem",padding:"1.5rem"}}><h3 className={heading} style={{fontSize:"1rem",fontWeight:700,color:"#0F0E14",marginBottom:"0.4rem"}}>{f.t}</h3><p style={{fontSize:"0.85rem",color:"#9A95A6",lineHeight:1.6,marginBottom:"0.75rem"}}>{f.d}</p><span style={{fontSize:"0.7rem",color:f.a?"#F59E0B":"#7C3AED",fontWeight:600}}>{f.tg}</span></div>))}
          </div>
        </div>
      </section>

      {/* EARNING POTENTIAL */}
      <section id="earn" style={{background:"#0F0E14",paddingTop:"6rem",paddingBottom:"6rem"}}>
        <div className="mx-auto px-4" style={{maxWidth:1000}}>
          <div className="text-center mb-12">
            <div className="section-eyebrow justify-center animate-on-scroll">EARNING POTENTIAL</div>
            <h2 className={heading+" animate-on-scroll"} style={{color:"#fff"}}>Your Knowledge Has Value.</h2>
            <p className="animate-on-scroll mt-1" style={{color:"#9A95A6"}}>Most mentors start earning within their first week.</p>
          </div>
          <div ref={earnRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {lbl:"Starter",exp:"0-2 years experience",rate:"Rs.300-500",sess:"2-4 sessions/week",monthly:earnVis?`Rs.${e1.toLocaleString()}`:"Rs.0",target:"Rs.2,400-8,000",feat:false},
              {lbl:"Expert",exp:"3-5 years experience",rate:"Rs.500-1,000",sess:"4-8 sessions/week",monthly:earnVis?`Rs.${e2.toLocaleString()}`:"Rs.0",target:"Rs.8,000-32,000",feat:true},
              {lbl:"Senior",exp:"5+ years experience",rate:"Rs.1,000-2,000",sess:"6-12 sessions/week",monthly:earnVis?`Rs.${e3.toLocaleString()}`:"Rs.0",target:"Rs.24,000-96,000",feat:false},
            ].map((t)=>(<div key={t.lbl} className={"animate-on-scroll text-center "+(t.feat?"card-dark relative":"card-dark")} style={{padding:"2rem",...(t.feat?{transform:"translateY(-8px)"}:{})}}>
              {t.feat && <div className="absolute -top-3 left-1/2 -translate-x-1/2" style={{background:"#F59E0B",color:"#fff",fontSize:"0.7rem",fontWeight:700,padding:"0.25rem 0.75rem",borderRadius:999}}>Most Common</div>}
              <div style={{fontSize:"0.75rem",color:"#9A95A6",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>{t.lbl}</div>
              <div style={{fontSize:"0.8rem",color:"#9A95A6",marginTop:"0.25rem"}}>{t.exp}</div>
              <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",margin:"1rem 0"}}/>
              <div className={heading} style={{fontSize:t.feat?"1.85rem":"1.75rem",fontWeight:700,color:"#fff"}}>{t.rate}</div>
              <div style={{fontSize:"0.8rem",color:"#9A95A6"}}>per session · {t.sess}</div>
              <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",margin:"1rem 0"}}/>
              <div className={heading} style={{fontSize:t.feat?"1.25rem":"1.1rem",fontWeight:700,color:"#7C3AED"}}>{t.monthly}+</div>
              <div style={{fontSize:"0.75rem",color:"#9A95A6"}}>potential monthly</div>
            </div>))}
          </div>
          <p className="text-center mt-6" style={{color:"#9A95A6",fontSize:"0.75rem"}}>*Estimates based on platform average. Actual earnings depend on sessions booked and rates set.</p>
        </div>
      </section>

      {/* HOW IT WORKS — light version */}
      <section style={{background:"#fff",paddingTop:"6rem",paddingBottom:"6rem"}}>
        <div className="mx-auto px-4" style={{maxWidth:1000}}>
          <div className="text-center mb-14">
            <div className="section-eyebrow justify-center animate-on-scroll">HOW IT WORKS</div>
            <h2 className={heading+" animate-on-scroll"} style={{color:"#0F0E14"}}>Start Mentoring in 4 Steps</h2>
            <p className="animate-on-scroll" style={{color:"#9A95A6",marginTop:"0.5rem"}}>From application to first booking in days, not weeks.</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-[1.5px]" style={{background:"rgba(124,58,237,0.2)"}}/>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-6">
              {[{n:"01",t:"Apply as Mentor",d:"Fill out the mentor form with your experience, expertise, and LinkedIn profile. Takes 5 minutes."},{n:"02",t:"Get Verified",d:"Our team reviews your application. Verified mentors get a badge and appear higher in student searches."},{n:"03",t:"Set Availability & Rates",d:"Configure your session rates, availability, and whether you offer free or paid sessions."},{n:"04",t:"Start Mentoring",d:"Students book sessions. You accept, share a Zoom link, conduct the session, and get rated."}].map((s)=>(<div key={s.n} className="text-center animate-on-scroll">
                <div className="mx-auto flex items-center justify-center" style={{width:"3rem",height:"3rem",borderRadius:"50%",background:"rgba(124,58,237,0.08)",border:"1.5px solid #7C3AED"}}><span className={heading} style={{fontSize:"0.9rem",fontWeight:700,color:"#7C3AED"}}>{s.n}</span></div>
                <h3 className={heading} style={{color:"#0F0E14",fontWeight:700,fontSize:"1.1rem",marginTop:"1.25rem",marginBottom:"0.5rem"}}>{s.t}</h3>
                <p className="mx-auto" style={{color:"#9A95A6",fontSize:"0.9rem",lineHeight:1.6,maxWidth:220}}>{s.d}</p>
              </div>))}
            </div>
          </div>
          <div className="text-center mt-12"><p style={{color:"#6B6776",fontSize:"0.9rem",marginBottom:"1rem"}}>Ready to share your expertise?</p><Link href="/forms/mentor-onboarding" className="btn-primary no-underline" style={{padding:"0.9rem 2rem",fontSize:"1rem"}}>Apply as Mentor — Free &#8594;</Link></div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative px-4 text-center" style={{background:"#0F0E14",paddingTop:"7rem",paddingBottom:"7rem"}}>
        <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%)"}}/>
        <div className="relative mx-auto" style={{maxWidth:650}}>
          <div className="section-eyebrow justify-center animate-on-scroll">Make an impact today</div>
          <h2 className={heading+" animate-on-scroll"} style={{fontWeight:700,fontSize:"clamp(2rem, 5vw, 3.5rem)",lineHeight:1.1,color:"#fff",marginBottom:"1rem"}}>India&apos;s Next Generation<br/>Needs People <span style={{color:"#F59E0B"}}>Like You.</span></h2>
          <p className="animate-on-scroll" style={{color:"#9A95A6",marginBottom:"2rem"}}>Join verified mentors helping students land their dream jobs.</p>
          <Link href="/forms/mentor-onboarding" className="btn-primary animate-glow no-underline" style={{padding:"0.9rem 2.2rem",fontSize:"1rem"}}>Apply as Mentor — Free &#8594;</Link>
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            {["&#128274; Verified Only","&#128176; You Set Rates","&#127470;&#127475; Built for India"].map((b,i)=>(<span key={i} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:999,padding:"0.3rem 0.8rem",color:"#6B6776",fontSize:"0.75rem"}} dangerouslySetInnerHTML={{__html:b}}/>))}
          </div>
        </div>
      </section>
    </div>
  );
}
