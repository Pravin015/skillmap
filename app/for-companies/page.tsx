"use client";
import Link from "next/link";
import { useEffect } from "react";
const heading = "font-[family-name:var(--font-heading)]";

export default function ForCompaniesPage() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }); }, { threshold: 0.15 });
    document.querySelectorAll(".animate-on-scroll").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return (
    <div>
      {/* HERO */}
      <section className="relative px-4 flex flex-col items-center justify-center text-center" style={{ background: "#0C1A1A", minHeight: "85vh", paddingTop: "7rem", paddingBottom: "5rem" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(10,191,188,0.07) 0%, transparent 70%)" }} />
        <div className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(10,191,188,0.3), transparent)" }} />
        <div className="absolute inset-0 pointer-events-none hero-grid-bg" />
        <div className="relative max-w-[750px] mx-auto w-full">
          <div className="section-eyebrow justify-center animate-fade-up">FOR COMPANIES &amp; HR TEAMS</div>
          <h1 className={heading} style={{ fontWeight: 700, fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: "1.5rem" }}>
            <span className="hero-line hero-line-1" style={{ color: "#fff" }}>Hire Job-Ready Talent.</span>
            <span className="hero-line hero-line-2" style={{ color: "#F59E0B" }}>Not Just Resumes.</span>
          </h1>
          <p className="animate-fade-up-2 mx-auto" style={{ color: "#6B8F8F", fontSize: "clamp(1rem, 2vw, 1.15rem)", lineHeight: 1.75, maxWidth: 580, marginBottom: "2.5rem" }}>AI-powered candidate matching, proctored assessments, and hiring challenges — all in one platform. Find candidates who can actually do the job.</p>
          <div className="animate-fade-up-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <Link href="/auth/signup?role=ORG" className="btn-primary animate-glow no-underline" style={{ padding: "0.9rem 2.2rem", fontSize: "1rem" }}>Register Your Company — Free</Link>
            <a href="#how-co" className="btn-outline no-underline">See How It Works &#8595;</a>
          </div>
          <div className="animate-fade-up-3 mb-10">
            <p className="mb-3" style={{ color: "#4A6363", fontSize: "0.8rem" }}>Trusted by hiring teams at</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["TCS","Infosys","Wipro","KPMG","Deloitte","Accenture","Flipkart"].map((c) => (<span key={c} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#8FA8A8", fontSize: "0.75rem", borderRadius: 999, padding: "0.3rem 0.8rem" }}>{c}</span>))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {[{n:"10M+",l:"Graduates Entering Market",s:"Every year in India"},{n:"55%",l:"Are Underprepared",s:"Industry consensus"},{n:"Free",l:"To Register",s:"No setup fee"}].map((x)=>(<div key={x.l} className="card-dark text-center" style={{padding:"1.25rem 1.5rem"}}><div className={heading} style={{fontSize:"2rem",fontWeight:700,color:"#fff"}}>{x.n}</div><div style={{fontSize:"0.85rem",fontWeight:600,color:"rgba(255,255,255,0.7)",marginTop:"0.25rem"}}>{x.l}</div><div style={{fontSize:"0.75rem",color:"#4A6363",marginTop:"0.2rem"}}>{x.s}</div></div>))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4" style={{ background: "#fff", paddingTop: "6rem", paddingBottom: "6rem" }}>
        <div className="mx-auto" style={{ maxWidth: 1200 }}>
          <div className="text-center mb-12">
            <div className="section-eyebrow justify-center animate-on-scroll">WHAT YOU GET</div>
            <h2 className={heading+" animate-on-scroll"} style={{color:"#0D1F1F"}}>End-to-End Hiring.</h2>
            <p className="animate-on-scroll mt-2 mx-auto" style={{color:"#4A6363",fontSize:"1rem",maxWidth:500}}>From job post to offer letter — one platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* AI JD Match */}
            <div className="card-dark animate-on-scroll" style={{borderTop:"2px solid #0ABFBC",padding:"2.5rem"}}>
              <div className="flex items-center gap-3 mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0ABFBC" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <span style={{background:"rgba(10,191,188,0.12)",border:"1px solid rgba(10,191,188,0.25)",borderRadius:999,padding:"0.2rem 0.7rem",fontSize:"0.7rem",fontWeight:600,color:"#0ABFBC"}}>Powered by Claude AI</span>
              </div>
              <h3 className={heading} style={{color:"#fff",fontSize:"1.25rem",fontWeight:700,marginBottom:"0.5rem"}}>Find Your Best Candidate in Seconds</h3>
              <p style={{color:"#6B8F8F",fontSize:"0.9rem",lineHeight:1.65,marginBottom:"1.5rem"}}>Paste any job description. Our AI scans every candidate profile and returns the top matches with percentage scores. No more manually reviewing 500 resumes.</p>
              <div style={{borderRadius:"0.75rem",padding:"1rem",background:"rgba(255,255,255,0.03)"}}>
                <div style={{fontSize:"0.7rem",color:"#6B8F8F",marginBottom:"0.75rem",fontWeight:600}}>AI Match Results</div>
                {[{n:"Arjun M.",p:94},{n:"Priya S.",p:87},{n:"Rahul K.",p:81}].map((c)=>(<div key={c.n} className="flex items-center gap-3 mb-2"><div style={{width:"1.75rem",height:"1.75rem",borderRadius:"50%",background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.6rem",color:"rgba(255,255,255,0.5)",fontWeight:600}}>{c.n.charAt(0)}</div><span style={{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem",width:65}}>{c.n}</span><div className="flex-1" style={{height:4,borderRadius:2,background:"rgba(255,255,255,0.06)"}}><div style={{height:4,borderRadius:2,width:c.p+"%",background:"#0ABFBC"}}/></div><span style={{color:"#0ABFBC",fontSize:"0.75rem",fontWeight:700}}>{c.p}%</span></div>))}
              </div>
            </div>
            {/* Pipeline */}
            <div className="card-dark animate-on-scroll" style={{borderTop:"2px solid #F59E0B",padding:"2.5rem"}}>
              <div className="flex items-center gap-3 mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                <span style={{background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:999,padding:"0.2rem 0.7rem",fontSize:"0.7rem",fontWeight:600,color:"#F59E0B"}}>Visual Pipeline</span>
              </div>
              <h3 className={heading} style={{color:"#fff",fontSize:"1.25rem",fontWeight:700,marginBottom:"0.5rem"}}>See Every Hire at a Glance</h3>
              <p style={{color:"#6B8F8F",fontSize:"0.9rem",lineHeight:1.65,marginBottom:"1.5rem"}}>Drag candidates through your hiring funnel. Applied, Screening, Interview, Assessment, Offer, Hired. No spreadsheets. No lost candidates.</p>
              <div className="flex gap-2" style={{borderRadius:"0.75rem",padding:"1rem",background:"rgba(255,255,255,0.03)"}}>
                {[{t:"Applied",c:2,h:false},{t:"Interview",c:1,h:false},{t:"Offered",c:1,h:true}].map((col)=>(<div key={col.t} className="flex-1"><div style={{fontSize:"0.65rem",color:"#6B8F8F",marginBottom:"0.4rem",fontWeight:600}}>{col.t}</div>{Array.from({length:col.c}).map((_,i)=>(<div key={i} style={{background:col.h?"rgba(10,191,188,0.15)":"rgba(255,255,255,0.05)",border:"1px solid "+(col.h?"rgba(10,191,188,0.3)":"rgba(255,255,255,0.08)"),borderRadius:"0.4rem",padding:"0.4rem 0.5rem",marginBottom:"0.3rem",fontSize:"0.65rem",color:col.h?"#0ABFBC":"rgba(255,255,255,0.5)"}}>Candidate {i+1}</div>))}</div>))}
              </div>
            </div>
          </div>
          {/* Tier 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[{t:"Assessments Candidates Can't Cheat",d:"Attach timed MCQ labs to any job post. Fullscreen enforcement, tab-switch detection, webcam verification.",tg:"Proctored · Auto-graded · Free",a:false},{t:"Let Skills Do the Talking",d:"Host hackathons, coding challenges, quizzes, and case studies. Top performers get fast-tracked to your pipeline.",tg:"4 challenge types · Leaderboard",a:true},{t:"Your Employer Brand, Built",d:"A public company page with your logo, culture, open roles, and hiring stats. Students follow you.",tg:"Public page · Follower alerts",a:false},{t:"Scale Your Hiring Team",d:"Add multiple HR accounts. Each gets their own dashboard. Company admin sees all data across every HR.",tg:"Unlimited HRs · Role-based access",a:false}].map((f)=>(<div key={f.t} className="animate-on-scroll" style={{background:f.a?"#FFFBF0":"#F8FAFA",border:"1px solid "+(f.a?"rgba(245,158,11,0.2)":"#D4E8E8"),borderRadius:"0.75rem",padding:"1.5rem"}}><h3 className={heading} style={{fontSize:"1rem",fontWeight:700,color:"#0D1F1F",marginBottom:"0.4rem"}}>{f.t}</h3><p style={{fontSize:"0.85rem",color:"#4A6363",lineHeight:1.6,marginBottom:"0.75rem"}}>{f.d}</p><span style={{fontSize:"0.7rem",color:f.a?"#F59E0B":"#0ABFBC",fontWeight:600}}>{f.tg}</span></div>))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-co" style={{background:"#0C1A1A",paddingTop:"6rem",paddingBottom:"6rem"}}>
        <div className="mx-auto px-4" style={{maxWidth:1000}}>
          <div className="text-center mb-14">
            <div className="section-eyebrow justify-center animate-on-scroll">HOW IT WORKS</div>
            <h2 className={heading+" animate-on-scroll"} style={{color:"#fff"}}>Start Hiring in 4 Steps</h2>
            <p className="animate-on-scroll" style={{color:"#4A6363",marginTop:"0.5rem"}}>Set up in under 10 minutes.</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-[1.5px]" style={{background:"rgba(10,191,188,0.2)"}}/>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-6">
              {[{n:"01",t:"Register Your Company",d:"Create your org account. Set up your company profile with branding and culture info. Free."},{n:"02",t:"Add Your HR Team",d:"Invite HR members. Each gets their own dashboard with job posting and candidate management."},{n:"03",t:"Post Jobs & Challenges",d:"Create job openings with optional proctored lab assessments. Launch hiring challenges."},{n:"04",t:"Hire Top Candidates",d:"Review AI-matched candidates, use the Kanban pipeline, close hires faster."}].map((s)=>(<div key={s.n} className="text-center animate-on-scroll"><div className="mx-auto flex items-center justify-center" style={{width:"3rem",height:"3rem",borderRadius:"50%",background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(255,255,255,0.2)"}}><span className={heading} style={{fontSize:"0.9rem",fontWeight:700,color:"#0ABFBC"}}>{s.n}</span></div><h3 className={heading} style={{color:"#fff",fontWeight:700,fontSize:"1.1rem",marginTop:"1.25rem",marginBottom:"0.5rem"}}>{s.t}</h3><p className="mx-auto" style={{color:"#4A6363",fontSize:"0.9rem",lineHeight:1.6,maxWidth:220}}>{s.d}</p></div>))}
            </div>
          </div>
          <div className="text-center mt-12"><p style={{color:"#6B8F8F",fontSize:"0.9rem",marginBottom:"1rem"}}>Ready to hire smarter?</p><Link href="/auth/signup?role=ORG" className="btn-primary no-underline" style={{padding:"0.9rem 2rem",fontSize:"1rem"}}>Register Your Company — Free &#8594;</Link></div>
        </div>
      </section>

      {/* PRICING */}
      <section className="px-4" style={{background:"#F8FAFA",paddingTop:"6rem",paddingBottom:"6rem"}}>
        <div className="mx-auto" style={{maxWidth:1000}}>
          <div className="text-center mb-12">
            <div className="section-eyebrow justify-center animate-on-scroll">PRICING</div>
            <h2 className={heading+" animate-on-scroll"} style={{color:"#0D1F1F"}}>Simple, Honest Pricing.</h2>
            <p className="animate-on-scroll mt-2" style={{color:"#4A6363"}}>No hidden fees. No lock-in. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="animate-on-scroll" style={{background:"#fff",border:"1px solid #D4E8E8",borderRadius:"1rem",padding:"2rem"}}><div className={heading} style={{fontWeight:700,color:"#0D1F1F"}}>Starter</div><div className={heading} style={{fontWeight:700,fontSize:"2.5rem",color:"#0ABFBC"}}>Free</div><p style={{color:"#4A6363",fontSize:"0.85rem",marginBottom:"1.25rem"}}>For small teams getting started</p><div style={{borderTop:"1px solid #D4E8E8",margin:"1.25rem 0"}}/><ul className="space-y-2 mb-6">{["5 job posts/month","Basic candidate search","Application tracking","Email notifications"].map((f)=><li key={f} className="flex items-start gap-2 text-sm" style={{color:"#4A6363"}}><span style={{color:"#0ABFBC",fontWeight:700}}>&#10003;</span>{f}</li>)}</ul><Link href="/auth/signup?role=ORG" className="btn-outline block text-center no-underline w-full">Get Started</Link></div>
            <div className="animate-on-scroll relative card-dark" style={{padding:"2rem",transform:"translateY(-8px)"}}><div className="absolute -top-3 left-1/2 -translate-x-1/2" style={{background:"#0ABFBC",color:"#fff",fontSize:"0.7rem",fontWeight:700,padding:"0.25rem 0.75rem",borderRadius:999}}>Most Popular</div><div className={heading} style={{fontWeight:700,color:"#fff"}}>Growth</div><div><span className={heading} style={{fontWeight:700,fontSize:"2.5rem",color:"#0ABFBC"}}>Rs.4,999</span><span style={{color:"#4A6363"}}>/month</span></div><p style={{color:"#4A6363",fontSize:"0.85rem",marginBottom:"1.25rem"}}>For growing companies</p><div style={{borderTop:"1px solid rgba(255,255,255,0.08)",margin:"1.25rem 0"}}/><ul className="space-y-2 mb-6">{["Unlimited job posts","AI JD matching","Proctored assessments","Hiring challenges","Candidate pipeline","Priority support"].map((f)=><li key={f} className="flex items-start gap-2 text-sm" style={{color:"rgba(255,255,255,0.8)"}}><span style={{color:"#0ABFBC",fontWeight:700}}>&#10003;</span>{f}</li>)}</ul><Link href="/auth/signup?role=ORG" className="btn-primary block text-center no-underline w-full animate-glow">Start Free Trial</Link></div>
            <div className="animate-on-scroll" style={{background:"#fff",border:"1px solid #D4E8E8",borderRadius:"1rem",padding:"2rem"}}><div className={heading} style={{fontWeight:700,color:"#0D1F1F"}}>Enterprise</div><div className={heading} style={{fontWeight:700,fontSize:"2.5rem",color:"#0ABFBC"}}>Custom</div><p style={{color:"#4A6363",fontSize:"0.85rem",marginBottom:"1.25rem"}}>For large organisations</p><div style={{borderTop:"1px solid #D4E8E8",margin:"1.25rem 0"}}/><ul className="space-y-2 mb-6">{["Everything in Growth","Dedicated account manager","Custom integrations","SLA guarantee","White-label option","API access"].map((f)=><li key={f} className="flex items-start gap-2 text-sm" style={{color:"#4A6363"}}><span style={{color:"#0ABFBC",fontWeight:700}}>&#10003;</span>{f}</li>)}</ul><Link href="/forms/hire-from-us" className="btn-outline block text-center no-underline w-full">Contact Us</Link></div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative px-4 text-center" style={{background:"#0C1A1A",paddingTop:"7rem",paddingBottom:"7rem"}}>
        <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse 80% 60% at 50% 50%, rgba(10,191,188,0.12) 0%, transparent 70%)"}}/>
        <div className="relative mx-auto" style={{maxWidth:650}}>
          <div className="section-eyebrow justify-center animate-on-scroll">Join India&apos;s best hiring platform</div>
          <h2 className={heading+" animate-on-scroll"} style={{fontWeight:700,fontSize:"clamp(2rem, 5vw, 3.5rem)",lineHeight:1.1,color:"#fff",marginBottom:"1rem"}}>Your Next Great Hire<br/>Is <span style={{color:"#0ABFBC"}}>Already On SkillMap.</span></h2>
          <p className="animate-on-scroll" style={{color:"#4A6363",marginBottom:"2rem"}}>Register free. Post your first job in minutes.</p>
          <Link href="/auth/signup?role=ORG" className="btn-primary animate-glow no-underline" style={{padding:"0.9rem 2.2rem",fontSize:"1rem"}}>Register Your Company — Free &#8594;</Link>
          <div className="flex justify-center gap-2 mt-4 flex-wrap">{["&#128274; Secure","&#129302; AI-Matched","&#127470;&#127475; India&apos;s Platform"].map((b,i)=>(<span key={i} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:999,padding:"0.3rem 0.8rem",color:"#6B8F8F",fontSize:"0.75rem"}} dangerouslySetInnerHTML={{__html:b}}/>))}</div>
        </div>
      </section>
    </div>
  );
}
