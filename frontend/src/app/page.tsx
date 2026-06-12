"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowDown,
  BrainCircuit,
  Award,
  QrCode,
  ShieldCheck,
  Camera,
  Loader,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Lock,
  FileText,
  Smartphone,
  Eye,
  Sparkle,
  TrendingDown,
  Mail,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CONFETTI = [
  { left: 10, delay: 0.1, duration: 1.4, size: 8, color: "#ef4444", rotate: 45 },
  { left: 22, delay: 0.5, duration: 1.8, size: 10, color: "#06b6d4", rotate: 90 },
  { left: 35, delay: 0.2, duration: 1.5, size: 6, color: "#10b981", rotate: 120 },
  { left: 48, delay: 0.8, duration: 2.0, size: 10, color: "#eab308", rotate: 15 },
  { left: 62, delay: 0.3, duration: 1.3, size: 12, color: "#ec4899", rotate: 200 },
  { left: 75, delay: 0.6, duration: 1.7, size: 8, color: "#ef4444", rotate: 310 },
  { left: 88, delay: 0.4, duration: 1.6, size: 11, color: "#06b6d4", rotate: 75 },
  { left: 95, delay: 1.0, duration: 2.2, size: 7, color: "#10b981", rotate: 160 },
];

const ConfettiEffect = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
    {CONFETTI.map((p, i) => (
      <div
        key={i}
        className="absolute rounded-sm animate-confetti-fall"
        style={{
          left: `${p.left}%`,
          top: `-10px`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          backgroundColor: p.color,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
          transform: `rotate(${p.rotate}deg)`,
        }}
      />
    ))}
  </div>
);

const FAQS = [
  {
    question: "How does the AI detect traffic violations?",
    answer: "RoadPay AI uses Google Gemini 3.5 Flash to analyze camera feeds and image metadata. It automatically classifies violations like missing helmets, overloaded passenger counts, or driving against traffic direction, while performing OCR on license plates in milliseconds.",
  },
  {
    question: "How do I qualify for the 20% safety quiz discount?",
    answer: "When a digital citation is generated, the registered owner receives an email notice with a quiz link. The quiz contains 3 scenario-based traffic safety questions mapped to the specific violation. Answering at least 2 questions correctly applies an instant 20% discount in the vehicle registry.",
  },
  {
    question: "Which payment options are supported by the gateway?",
    answer: "RoadPay AI integrates Razorpay sandbox checkout supporting secure online transactions via major Credit/Debit Cards, NetBanking, and UPI (such as Google Pay or PhonePe). Markings are updated in the vehicle registry registry immediately.",
  },
  {
    question: "Does RoadPay AI send notifications via SMS or support Apple Pay?",
    answer: "No. Under our safety policy and in strict compliance with registry rules, RoadPay AI does not dispatch citations via SMS or accept Apple Pay. All official correspondence is sent to the registered email address to ensure document privacy and security.",
  },
  {
    question: "What privileges do Administrators and Officers have?",
    answer: "Administrators hold top-level access allowing them to register or delete users, vehicles, and registry logs. Officers have execution permissions to verify violations, mark citations as paid manually, and trigger dispatch notifications to owners.",
  },
];

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const [demoStep, setDemoStep] = useState<1 | 2 | 3>(1);
  const [selectedViolation, setSelectedViolation] = useState<"HELMET" | "TRIPLE" | "WRONG">("HELMET");
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  // ─── Violation data with Indian context ───────────────────────────
  const violationsData = {
    HELMET: {
      title: "No Helmet safety violation",
      plate: "MH 12 AB 1234",
      owner: "Rohan Sharma",
      city: "Pune Expressway Junction",
      image: "/traffic_evidence_mockup.png",
      aiLabels: ["● Helmet Detected: NO", "● Rider Count: 1"],
      mvSection: "Section 129, Motor Vehicles Act",
      confidence: 0.96,
      originalFine: 500,
      discountFine: 400,
      explanation: "Under Section 129 of the Motor Vehicles Act, all two-wheeler riders must wear a certified protective helmet. Helmets shield the skull from traumatic head impact in low-side and high-side collisions.",
      quiz: [
        {
          scenario: "You are running a quick errand just 2 minutes away from home on a quiet neighborhood street.",
          question: "Is it safe to ride without a helmet in this scenario?",
          options: [
            "Yes, since speed will be low and the road is quiet.",
            "Yes, if you ride slowly on the side of the road.",
            "No, because over 40% of two-wheeler accidents occur within 5 km of home.",
            "Only if you hold the helmet in your hand.",
          ],
          correctIdx: 2,
          expl: "Short trips are not safer. Accidents can occur at any distance from home. Wearing a helmet is mandatory and essential for protecting the brain on every single ride.",
        },
        {
          scenario: "You need a new helmet for daily commutes and see a cheap one without an safety rating mark at a local roadside vendor.",
          question: "What is the correct and safe action?",
          options: [
            "Buy it to save money since any helmet is better than none.",
            "Buy it only for local trips and use a certified one for highways.",
            "Avoid it and purchase a safety-certified helmet to ensure it passes crash safety standards.",
            "Buy it and wear it backward for better styling.",
          ],
          correctIdx: 2,
          expl: "A certified safety mark (like ISI) guarantees that the helmet has undergone crash simulation, penetration, and chin-strap retention tests to safeguard your skull.",
        },
        {
          scenario: "You are riding on a wet, slippery road at night and suddenly a pedestrian steps in front of you, causing you to lose control.",
          question: "How does wearing a certified helmet protect you in this crash?",
          options: [
            "It prevents the motorcycle from sliding.",
            "It reduces the risk of severe head injury and brain trauma by up to 70%.",
            "It only protects your eyes from dust and rain.",
            "It guarantees zero damage to the motorcycle.",
          ],
          correctIdx: 1,
          expl: "Helmets reduce the severity of head impacts by absorbing shock. Crashing on hard asphalt without a helmet makes brain shear and skull fractures highly probable.",
        },
      ],
    },
    TRIPLE: {
      title: "Overloaded Rider Count violation",
      plate: "KA 03 MM 4567",
      owner: "Priya Nair",
      city: "Bengaluru Outer Ring Road",
      image: "/triple_riding_mockup.png",
      aiLabels: ["● Passengers Detected: 3", "● Legal Limit: 2"],
      mvSection: "Section 128, Motor Vehicles Act",
      confidence: 0.94,
      originalFine: 500,
      discountFine: 400,
      explanation: "Section 128 of the Motor Vehicles Act prohibits carrying more passengers than a vehicle is certified for. Overloading compromises vehicle balance, extends braking distances, and significantly raises accident risks.",
      quiz: [
        {
          scenario: "You are carrying two friends on a motorcycle designed and certified for only two riders.",
          question: "How does this overload affect the steering and control of your vehicle?",
          options: [
            "It improves traction and grip since there is more weight on the wheels.",
            "It significantly increases braking distance and compromises balancing center-of-gravity.",
            "It makes cornering easier at higher speeds.",
            "It has no impact on safety if the rider is highly experienced.",
          ],
          correctIdx: 1,
          expl: "Motorcycles are balanced dynamically for two riders max. A third passenger overloads the suspension, makes steering sluggish, and extends the braking distance, raising crash hazards.",
        },
        {
          scenario: "You are overloading your motorcycle and need to make an emergency stop because a car suddenly brakes in front of you.",
          question: "What is the most likely reaction of the bike under hard braking?",
          options: [
            "It will stop faster due to the extra weight pushing down.",
            "The bike is highly likely to skid, fishtail, or fail to stop in time.",
            "The ABS system will compensate automatically for the extra load.",
            "The passenger in the middle will fly forward safely.",
          ],
          correctIdx: 1,
          expl: "Added weight pushes momentum forward. The tires lose grip during heavy braking, making the rear swing out (fishtailing) and causing loss of steering control.",
        },
        {
          scenario: "You need to transport three people but you only have a single two-wheeler available.",
          question: "What is the correct and lawful decision?",
          options: [
            "Ride slow and take back streets to avoid checkpoints.",
            "Have the third person sit on the fuel tank at the front.",
            "Make two separate trips or hire a taxi/ride-share.",
            "Place the shortest person in between the rider and pillion.",
          ],
          correctIdx: 2,
          expl: "Safety and law command never carrying more passengers than a vehicle is certified for. Hiring public transit or making multiple trips eliminates the crash risk.",
        },
      ],
    },
    WRONG: {
      title: "Wrong-Direction Driving violation",
      plate: "UP 32 MD 5678",
      owner: "Aarav Singh",
      city: "Lucknow Ring Road, Uttar Pradesh",
      image: "/wrong_direction_mockup.png",
      aiLabels: ["● Direction: Wrong-Way", "● Speed: 38 km/h"],
      mvSection: "Section 184, Motor Vehicles Act",
      confidence: 0.98,
      originalFine: 500,
      discountFine: 400,
      explanation: "Section 184 of the Motor Vehicles Act defines driving against the flow of traffic as dangerous driving. Wrong-way driving is a major cause of fatal accidents, as head-on collisions combine vehicle speeds, making them exponentially more lethal.",
      quiz: [
        {
          scenario: "You missed a U-turn and the next official turn is 1 km ahead, but your destination is right across the street.",
          question: "What should you do in this situation?",
          options: [
            "Drive along the wrong side of the road with hazard lights on.",
            "Ride on the sidewalk slowly.",
            "Proceed to the correct U-turn 1 km ahead and travel safely.",
            "Cross the divider median divider where there is a gap.",
          ],
          correctIdx: 2,
          expl: "Driving wrong-way surprises oncoming drivers, who do not expect a vehicle in their lane. It is always safest and legal to proceed to the designated U-turn.",
        },
        {
          scenario: "You are driving on a one-way speed highway, and another driver is oncoming in your lane.",
          question: "Why is head-on collision closing speed so dangerous?",
          options: [
            "Closing speed is the sum of both vehicle speeds, making impact forces exponentially fatal.",
            "It is not dangerous if both vehicles have airbags.",
            "Oncoming cars have right of way in wrong lanes.",
            "Wrong-direction driving is allowed in extreme heat.",
          ],
          correctIdx: 0,
          expl: "If two vehicles travel at 50 km/h, a head-on collision has an impact velocity equivalent to hitting a stationary brick wall at 100 km/h. This is highly fatal.",
        },
        {
          scenario: "A driver claims they are driving in the wrong direction only on the shoulder/edge of the road.",
          question: "Does this make the action safe?",
          options: [
            "Yes, since they are out of the main traffic lanes.",
            "Yes, if they honk their horn continuously.",
            "No, pedestrians walk on the shoulder and turning vehicles enter/exit shoulders without looking for wrong-way traffic.",
            "Only during daytime hours.",
          ],
          correctIdx: 2,
          expl: "The road shoulder is reserved for breakdowns, emergencies, and pedestrian walking. Driving wrong-way on the shoulder risks running over pedestrians or crashing into turning vehicles.",
        },
      ],
    },
  };

  const handleRunScan = () => {
    setScanning(true);
    setScanComplete(false);
    setTimeout(() => {
      setScanning(false);
      setScanComplete(true);
    }, 2000);
  };
  const handleAnswerSelect = (idx: number) => {
    if (!quizSubmitted) setSelectedAnswer(idx);
  };
  const handleAnswerSubmit = () => {
    if (selectedAnswer === null || quizSubmitted) return;
    setQuizSubmitted(true);
    if (selectedAnswer === violationsData[selectedViolation].quiz[currentQuestionIdx].correctIdx)
      setQuizScore((p) => p + 1);
  };
  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    if (currentQuestionIdx < 2) setCurrentQuestionIdx((p) => p + 1);
    else setQuizComplete(true);
  };
  const handleReset = () => {
    setDemoStep(1);
    setScanComplete(false);
    setScanning(false);
    setQuizStarted(false);
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizComplete(false);
    setPaymentStarted(false);
    setPaymentComplete(false);
  };

  return (
    <div className="roadpay-marketing min-h-screen text-[var(--text-primary)] flex flex-col font-sans selection:bg-lime-300 selection:text-black antialiased overflow-x-hidden">
      <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-80 z-0" />

      {/* ── HEADER ───────────────────────────────── */}
      <header className="marketing-header fixed top-0 left-0 right-0 z-50">
        <div className="w-full max-w-[1200px] mx-auto px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-extrabold tracking-tight text-[var(--text-primary)] hover:opacity-90 transition-opacity"
          >
            <BrainCircuit className="w-5 h-5 text-rose-500" />
            <span>RoadPay AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            <a href="#sandbox" className="hover:text-[var(--text-primary)] transition-colors">
              Live Demo
            </a>
            <a href="#workflow" className="hover:text-[var(--text-primary)] transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">
              Features
            </a>
            <a href="#faq" className="hover:text-[var(--text-primary)] transition-colors">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 text-xs font-bold bg-black text-white rounded-full hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
            >
              Open Dashboard <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────── */}
      <section className="marketing-hero w-full relative z-10 overflow-hidden" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
        <div className="w-full max-w-[900px] mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center justify-center text-center" style={{ gap: "1.5rem" }}>
            <div className="marketing-kicker inline-flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase font-bold mx-auto">
              <Sparkle className="w-3 h-3 text-rose-500 animate-spin" style={{ animationDuration: "6s" }} />
              <span>AI-Powered Automated Citations & Traffic Safety</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl xl:text-[76px] font-black text-black leading-[1.05] tracking-tight text-balance">
                Making our roads
                <br />
                <span className="bg-[var(--marketing-accent)] border border-black px-6 py-2.5 inline-block rounded-2xl transform -rotate-1 mt-4 shadow-[5px_5px_0_#000] text-black">
                  safer for everyone.
                </span>
              </h1>
              <p className="text-base lg:text-lg text-neutral-600 leading-relaxed max-w-xl mx-auto pt-2">
                RoadPay AI detects traffic violations automatically, issues digital citations, and provides
                interactive safety education to reduce repeat offences.
              </p>
            </div>

            <div className="flex items-center gap-4 justify-center flex-wrap pt-2">
              <Link
                href="/login"
                className="px-8 py-4 bg-black text-white font-bold text-sm rounded-xl border border-black shadow-[4px_4px_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-y-[0px] active:shadow-[4px_4px_0_#000] transition-all flex items-center gap-2"
              >
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#sandbox"
                className="px-8 py-4 bg-white border border-black text-neutral-700 font-bold text-sm rounded-xl shadow-[4px_4px_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-y-[0px] active:shadow-[4px_4px_0_#000] transition-all flex items-center gap-2"
              >
                Try Live Demo
              </a>
            </div>

            {/* Quick stats Strip */}
            <div className="flex items-center justify-center gap-12 pt-6 pb-6 border-y border-neutral-200/50 w-full max-w-2xl mx-auto mt-8 select-none">
              {[
                { value: "96%+", label: "AI detection accuracy" },
                { value: "20%", label: "Fine reduction on quiz pass" },
                { value: "Secure Pay", label: "Instant online citation payment" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-xl font-black text-black">{s.value}</div>
                  <div className="text-[10px] text-neutral-500 font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Center mockup scanner widget */}
            <div className="w-full max-w-2xl mx-auto" style={{ marginTop: "2.5rem" }}>
              <div className="hero-product-frame w-full border border-black rounded-2xl p-6 bg-white shadow-xl">
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-neutral-400">
                    <span>AI CAMERA FEED — INTERSECTION 4</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> LIVE
                    </span>
                  </div>

                  <div className="relative h-48 rounded-xl overflow-hidden bg-neutral-900 flex items-center justify-center animate-fade-in" style={{ borderRadius: "12px" }}>
                    <img
                      src="/traffic_evidence_mockup.png"
                      alt="Traffic camera feed"
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        scanning ? "opacity-30" : "opacity-75"
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {scanning ? (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2">
                        <Loader className="w-6 h-6 text-rose-500 animate-spin" />
                        <span className="text-[10px] text-white font-mono uppercase tracking-widest animate-pulse">
                          Scanning via AI Vision...
                        </span>
                      </div>
                    ) : scanComplete ? (
                      <>
                        <div className="absolute top-3 left-3 border border-rose-500 bg-rose-500/10 px-2 py-0.5 rounded text-[8px] text-rose-400 font-mono font-bold animate-pulse">
                          ⚠ No Helmet — Sec. 129 MV Act (96%)
                        </div>
                        <div className="absolute bottom-3 left-3 text-white font-mono">
                          <span className="text-[8px] opacity-60 block">REGISTRY LOOKUP</span>
                          <span className="text-xs font-black tracking-wider">MH 12 AB 1234</span>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={handleRunScan}
                        className="absolute px-4 py-2.5 bg-white text-black hover:bg-neutral-100 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer z-20"
                      >
                        <Camera className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        Simulate Camera Detection
                      </button>
                    )}
                    {scanning && (
                      <div className="absolute left-0 right-0 h-[2px] bg-rose-500 shadow-[0_0_8px_#f43f5e] z-20 animate-scanner-bar" />
                    )}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-neutral-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400 font-medium">Challan Status:</span>
                      {scanComplete ? (
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 border border-rose-200 text-[9px] font-bold uppercase rounded-md">
                          UNPAID
                        </span>
                      ) : (
                        <span className="text-neutral-300 font-medium">Awaiting scan</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-neutral-400">Challan Fine (Sec. 129):</span>
                      <span className="font-bold text-neutral-700">₹{violationsData[selectedViolation].originalFine}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono text-emerald-600 font-bold">
                      <span>Safety Quiz Discount:</span>
                      <span>− ₹{violationsData[selectedViolation].originalFine - violationsData[selectedViolation].discountFine}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono font-black border-t border-neutral-100 pt-2">
                      <span className="text-neutral-600">Pay via NetBanking / UPI:</span>
                      <span className="text-black">₹{violationsData[selectedViolation].discountFine}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-STEP PROCESS SECTION ────────────────── */}
      <section id="workflow" className="w-full border-t border-[var(--border-color)] relative z-10 py-24">
        <div className="w-full max-w-[1200px] mx-auto px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] text-rose-500 uppercase tracking-widest font-extrabold block mb-3">
              Workflow
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-black tracking-tight leading-tight mb-4">
              From Violation to Settle in 3 Steps
            </h2>
            <p className="text-sm text-neutral-500 max-w-xl leading-relaxed mx-auto">
              Our automated system processes citations seamlessly while correcting road safety behaviors in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 items-stretch gap-8 lg:gap-4 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="lg:col-span-1 border border-black rounded-2xl p-6 bg-[var(--marketing-paper)] flex flex-col items-center text-center justify-between min-h-[260px] relative shadow-[6px_6px_0_#000]">
              <div className="flex flex-col items-center gap-3">
                <span className="w-12 h-12 flex items-center justify-center rounded-xl bg-lime-300 border border-black text-black">
                  <Camera className="w-6 h-6" />
                </span>
                <span className="text-[10px] font-extrabold uppercase text-neutral-400">Step 1</span>
                <h3 className="font-bold text-base text-black">AI Evidence Scan</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Municipal networks or mobile cameras capture violations. AI identifies missing helmets, wrong-way driving, or triple riders.
                </p>
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="hidden lg:flex items-center justify-center lg:col-span-1">
              <ArrowRight className="w-6 h-6 text-neutral-400" />
            </div>
            <div className="lg:hidden flex items-center justify-center my-1">
              <ArrowDown className="w-6 h-6 text-neutral-400" />
            </div>

            {/* Step 2 */}
            <div className="lg:col-span-1 border border-black rounded-2xl p-6 bg-[var(--marketing-paper)] flex flex-col items-center text-center justify-between min-h-[260px] relative shadow-[6px_6px_0_#000]">
              <div className="flex flex-col items-center gap-3">
                <span className="w-12 h-12 flex items-center justify-center rounded-xl bg-lime-300 border border-black text-black">
                  <Award className="w-6 h-6" />
                </span>
                <span className="text-[10px] font-extrabold uppercase text-neutral-400">Step 2</span>
                <h3 className="font-bold text-base text-black">Safety Quiz</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Offender takes an interactive educational road safety module mapping to their violation to secure a 20% fine reduction.
                </p>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="hidden lg:flex items-center justify-center lg:col-span-1">
              <ArrowRight className="w-6 h-6 text-neutral-400" />
            </div>
            <div className="lg:hidden flex items-center justify-center my-1">
              <ArrowDown className="w-6 h-6 text-neutral-400" />
            </div>

            {/* Step 3 */}
            <div className="lg:col-span-1 border border-black rounded-2xl p-6 bg-[var(--marketing-paper)] flex flex-col items-center text-center justify-between min-h-[260px] relative shadow-[6px_6px_0_#000]">
              <div className="flex flex-col items-center gap-3">
                <span className="w-12 h-12 flex items-center justify-center rounded-xl bg-lime-300 border border-black text-black">
                  <QrCode className="w-6 h-6" />
                </span>
                <span className="text-[10px] font-extrabold uppercase text-neutral-400">Step 3</span>
                <h3 className="font-bold text-base text-black">Instant Settle</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Payment is made via UPI or NetBanking. Registry records are updated instantly, updating the status to PAID.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE SHOWCASE 1 ─────────────────────── */}
      <section className="w-full border-t border-[var(--border-color)] relative z-10 py-24">
        <div className="w-full max-w-[1200px] mx-auto px-8">
          {/* Centered Heading Block */}
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="text-[10px] text-rose-500 uppercase tracking-widest font-extrabold block mb-3">
              AI Engine
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-black tracking-tight leading-tight mb-4 text-center">
              AI Traffic Enforcement: Scan Evidence in Seconds
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-2xl mx-auto text-center">
              By integrating Google Gemini 3.5 Flash with dedicated EasyOCR and OpenCV preprocessing, RoadPay AI processes incident evidence faster than traditional hardware.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left text */}
            <div className="flex-1 space-y-6 text-left">
              <p className="text-sm text-neutral-500 leading-relaxed">
                Our FastAPI backend resolves camera data, checks regional vehicle databases, and produces digital citation documents securely. No manuals, no wait times, and zero human errors.
              </p>
              <div className="pt-2">
                <a
                  href="#sandbox"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-black text-white px-6 py-3 font-semibold shadow transition-all hover:opacity-90"
                >
                  Try the Live Sandbox <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right mockup visual */}
            <div className="flex-1 w-full text-left">
              <div className="relative border border-black rounded-2xl p-6 bg-[var(--marketing-paper)] shadow-[8px_8px_0_#000] flex flex-col gap-4">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-neutral-400">
                  <span>OCR ANALYSIS LAYER</span>
                  <span className="text-emerald-500">97.4% MATCH</span>
                </div>
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-xs text-neutral-500 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">INPUT EVIDENCE:</span>
                    <span>&ldquo;mh-12-ab-1234&rdquo;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">NORMALIZED STRING:</span>
                    <span className="font-bold bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px]">
                      MH12AB1234
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-200/60 pt-2">
                    <span className="text-neutral-400">COMPILER STATE:</span>
                    <span className="text-emerald-600 font-bold">VALIDATED MATCH</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MANAGEMENT SHOWCASE ───────────────────── */}
      <section className="w-full border-t border-[var(--border-color)] relative z-10 py-24">
        <div className="w-full max-w-[1200px] mx-auto px-8">
          {/* Centered Heading Block */}
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="text-[10px] text-rose-500 uppercase tracking-widest font-extrabold block mb-3">
              Roles & Control
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-black tracking-tight leading-tight mb-4 text-center">
              Administrative Control Center
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-2xl mx-auto text-center">
              RoadPay AI establishes distinct permission levels for traffic safety management. Administrators possess privileges to manage users, update vehicles, and delete obsolete registry logs to keep databases accurate.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16">
            {/* Right text */}
            <div className="flex-1 space-y-6 text-left">
              <p className="text-sm text-neutral-500 leading-relaxed">
                Traffic Officers have dashboard access to check unpaid violations, register payment records manually when necessary, and instantly trigger dispatch notifications to owners.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-black text-white px-6 py-3 font-semibold shadow transition-all hover:opacity-90"
                >
                  Access Console <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Left mockup visual */}
            <div className="flex-1 w-full text-left">
              <div className="relative border border-black rounded-2xl p-6 bg-[var(--marketing-paper)] shadow-[8px_8px_0_#000] flex flex-col gap-4">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-neutral-400">
                  <span>MEMBER ACCESS RULES</span>
                  <span className="text-rose-500">ACTIVE RULE</span>
                </div>
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-xs text-neutral-500 space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-200/60">
                    <span className="font-bold text-black">Administrator Role</span>
                    <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded font-mono font-bold">FULL CONTROL</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 space-y-1 pt-1">
                    <div>✓ Delete User & License Registry Entries</div>
                    <div>✓ Reset Officers Accounts & Permissions</div>
                    <div>✓ Clear Erroneous Citations logs</div>
                  </div>
                </div>
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-xs text-neutral-500 space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-200/60">
                    <span className="font-bold text-black">Traffic Officer Role</span>
                    <span className="text-[9px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-mono font-bold">VERIFY & DISPATCH</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 space-y-1 pt-1">
                    <div>✓ Trigger E-Challan Dispatch Notice</div>
                    <div>✓ Mark Violations as Paid manually</div>
                    <div>✓ Track Regional Safety Statistics</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO SANDBOX ─────────────────────── */}
      <section id="sandbox" className="w-full border-t border-[var(--border-color)] relative z-10">
        <div className="w-full max-w-[1200px] mx-auto px-8 py-24">
          <div className="mb-14 text-center max-w-3xl mx-auto">
            <span className="text-[10px] text-rose-500 uppercase tracking-widest font-extrabold block mb-3">
              Live Demo
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-black tracking-tight leading-tight mb-4 text-center">
              Try the full citation flow.
            </h2>
            <p className="text-sm text-neutral-500 max-w-2xl leading-relaxed mx-auto text-center">
              Select a common safety violation, run the AI scan, complete the road safety quiz, and simulate online
              checkout — the complete RoadPay AI workflow.
            </p>
          </div>

          {/* Browser mock */}
          <div className="w-full rounded-2xl border border-black/[0.08] p-2 bg-neutral-100/60 shadow-sm">
            <div className="rounded-xl overflow-hidden border border-black/[0.06] bg-white flex flex-col min-h-[600px]">
              {demoStep === 2 && quizComplete && quizScore >= 2 && <ConfettiEffect />}

              {/* Browser bar */}
              <div className="h-11 border-b border-[var(--border-color)] px-5 flex items-center justify-between text-xs text-neutral-400 shrink-0 bg-neutral-50 select-none">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-200" />
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-200" />
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-200" />
                </div>
                <div className="bg-white border border-neutral-200 px-8 py-1 rounded-md text-[9px] font-mono text-neutral-400 max-w-xs truncate">
                  roadpay.ai/citation/demo/step-{demoStep}
                </div>
                <div className="w-16" />
              </div>

              {/* Step nav */}
              <div className="border-b border-[var(--border-color)] px-5 py-2.5 flex gap-1 bg-neutral-50/80 shrink-0">
                {[
                  { step: 1, title: "1. Camera Scan" },
                  { step: 2, title: "2. Safety Quiz" },
                  { step: 3, title: "3. Pay Challan" },
                ].map((t) => {
                  const isActive = demoStep === t.step;
                  const isDone = demoStep > t.step;
                  return (
                    <button
                      key={t.step}
                      onClick={() => {
                        if (
                          t.step === 1 ||
                          (t.step === 2 && scanComplete) ||
                          (t.step === 3 && quizComplete)
                        )
                          setDemoStep(t.step as 1 | 2 | 3);
                      }}
                      disabled={(!scanComplete && t.step >= 2) || (!quizComplete && t.step === 3)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isActive
                          ? "bg-black text-white shadow-sm"
                          : "hover:bg-neutral-100 text-neutral-400 hover:text-black"
                      }`}
                    >
                      {isDone ? (
                        <span className="p-0.5 bg-emerald-500 text-white rounded-full">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <span
                          className={`w-3.5 h-3.5 rounded-full border text-[8px] flex items-center justify-center font-mono ${
                            isActive ? "border-transparent bg-rose-500 text-white" : "border-neutral-300"
                          }`}
                        >
                          {t.step}
                        </span>
                      )}
                      {t.title}
                    </button>
                  );
                })}
              </div>

              {/* Workspace */}
              <div className="flex-grow p-8 flex flex-col text-left">
                <AnimatePresence mode="wait">
                  {/* STEP 1: AI Camera Scan */}
                  {demoStep === 1 && (
                    <motion.div
                      key="s1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex-grow flex flex-col gap-6"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-5">
                        <div>
                          <span className="text-[9px] text-rose-500 uppercase tracking-widest font-bold block mb-0.5">
                            Select a Violation Type
                          </span>
                          <h3 className="text-lg font-bold text-black">AI Camera Scan + License Plate OCR</h3>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {(["HELMET", "TRIPLE", "WRONG"] as const).map((v) => (
                            <button
                              key={v}
                              onClick={() => {
                                setSelectedViolation(v);
                                setScanComplete(false);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                selectedViolation === v
                                  ? "bg-rose-500/10 border-rose-300 text-rose-600"
                                  : "bg-white border-neutral-200 text-neutral-400 hover:text-black"
                              }`}
                            >
                              {v === "HELMET" ? "No Helmet" : v === "TRIPLE" ? "Overloading" : "Wrong Side"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                        {/* Camera view */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl relative overflow-hidden min-h-[280px] flex items-center justify-center" style={{ borderRadius: "16px" }}>
                          <img
                            src={violationsData[selectedViolation].image}
                            alt={violationsData[selectedViolation].title}
                            className="absolute inset-0 w-full h-full object-cover opacity-70"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />

                          {scanning && (
                            <>
                              <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] z-30 flex flex-col items-center justify-center gap-3">
                                <Loader className="w-6 h-6 text-rose-500 animate-spin" />
                                <span className="text-[10px] text-white font-mono tracking-widest uppercase animate-pulse">
                                  AI Vision + License Plate OCR...
                                </span>
                              </div>
                              <div className="absolute left-0 right-0 h-[2px] bg-rose-500 shadow-[0_0_8px_#f43f5e] z-30 animate-scanner-bar" />
                            </>
                          )}

                          {scanComplete && !scanning && (
                            <>
                              <div className="absolute top-1/3 left-1/4 border-2 border-rose-500 bg-rose-500/10 px-2 py-0.5 rounded text-[10px] text-white font-mono font-extrabold z-20">
                                {selectedViolation} DETECTED
                              </div>
                              <span className="text-[9px] text-emerald-400 font-mono absolute top-4 right-4 bg-black/70 px-2.5 py-1 border border-emerald-500/20 rounded-full font-bold z-20 flex items-center gap-1">
                                <span className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                                {(violationsData[selectedViolation].confidence * 100).toFixed(0)}% CONFIDENCE
                              </span>
                              <div className="absolute bottom-4 left-4 font-mono z-20">
                                <span className="text-[8px] text-neutral-400 block">REGISTRY LOOKUP</span>
                                <span className="text-xs text-white font-black tracking-wider">
                                  {violationsData[selectedViolation].plate}
                                </span>
                              </div>
                            </>
                          )}

                          {!scanning && !scanComplete && (
                            <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center">
                              <button
                                onClick={handleRunScan}
                                className="px-5 py-3 bg-white text-black hover:bg-neutral-100 font-bold text-xs rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer z-30"
                              >
                                <Camera className="w-3.5 h-3.5 text-rose-500" />
                                Run AI Scan
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Diagnostic panel */}
                        <div className="flex flex-col justify-between border border-neutral-200 p-6 rounded-2xl bg-neutral-50 min-h-[280px]">
                          {scanComplete ? (
                            <div className="space-y-5 flex-grow flex flex-col justify-between text-xs">
                              <div className="space-y-4">
                                <div className="flex justify-between items-center border border-neutral-200 px-4 py-2.5 rounded-xl bg-white font-mono text-[10px]">
                                  <span className="text-neutral-400">PLATE (REGISTRY DB):</span>
                                  <span className="font-bold text-black">
                                    {violationsData[selectedViolation].plate}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center border border-neutral-200 px-4 py-2.5 rounded-xl bg-white font-mono text-[10px]">
                                  <span className="text-neutral-400">REGISTERED OWNER:</span>
                                  <span className="font-bold text-black">
                                    {violationsData[selectedViolation].owner}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center border border-neutral-200 px-4 py-2.5 rounded-xl bg-white font-mono text-[10px]">
                                  <span className="text-neutral-400">TRAFFIC CODE:</span>
                                  <span className="font-bold text-rose-600">
                                    {violationsData[selectedViolation].mvSection}
                                  </span>
                                </div>
                                <div className="space-y-1.5">
                                  <span className="text-[10px] text-rose-500 uppercase tracking-wider font-bold block">
                                    AI Violation Summary:
                                  </span>
                                  <p className="text-xs text-neutral-500 leading-relaxed">
                                    {violationsData[selectedViolation].explanation}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {violationsData[selectedViolation].aiLabels.map((l, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-black text-white text-[9px] font-mono rounded-md">
                                      {l}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={() => setDemoStep(2)}
                                className="w-full py-3 bg-black text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                Proceed to Safety Quiz <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex-grow flex flex-col justify-center items-center text-center gap-3">
                              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                                <BrainCircuit className="w-6 h-6 text-neutral-300 animate-pulse" />
                              </div>
                              <h4 className="font-bold text-sm text-neutral-600">Awaiting Camera Scan</h4>
                              <p className="text-[11px] text-neutral-400 leading-relaxed max-w-xs">
                                Click "Run AI Scan" to detect the safety violation, read the license plate via OCR, and
                                look up the registered owner in the vehicle database.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: Safety Quiz */}
                  {demoStep === 2 && (
                    <motion.div
                      key="s2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex-grow flex flex-col gap-6"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-5">
                        <div>
                          <span className="text-[9px] text-rose-500 uppercase tracking-widest font-bold block mb-0.5">
                            Road Safety Module
                          </span>
                          <h3 className="text-lg font-bold text-black">{violationsData[selectedViolation].title}</h3>
                        </div>
                        <div className="px-3 py-1 border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 text-[10px] rounded-lg font-bold uppercase tracking-wider font-mono">
                          {violationsData[selectedViolation].plate}
                        </div>
                      </div>

                      {!quizStarted ? (
                        <div className="flex-grow flex items-center justify-center">
                          <div className="border border-neutral-200 rounded-2xl p-10 text-center max-w-lg w-full space-y-6 bg-neutral-50">
                            <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                              <Award className="w-7 h-7" />
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-lg font-bold text-black">Hi, {violationsData[selectedViolation].owner}!</h4>
                              <p className="text-sm text-neutral-500 leading-relaxed max-w-md mx-auto">
                                A challan fine of <strong>₹{violationsData[selectedViolation].originalFine}</strong> has
                                been issued under {violationsData[selectedViolation].mvSection}. Answer 3 road safety
                                questions correctly (2/3 pass mark) to get a <strong>20% reduction</strong> — pay only
                                ₹{violationsData[selectedViolation].discountFine}.
                              </p>
                            </div>
                            <button
                              onClick={() => setQuizStarted(true)}
                              className="px-8 py-3 bg-black text-white font-bold text-sm rounded-xl shadow transition-all cursor-pointer hover:opacity-90"
                            >
                              Start Safety Quiz
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                          {/* Questions col */}
                          <div className="lg:col-span-2 border border-neutral-200 p-6 rounded-2xl flex flex-col justify-between bg-white min-h-[320px]">
                            {!quizComplete ? (
                              <div className="space-y-5 flex-grow flex flex-col justify-between">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center text-[9px] font-bold tracking-widest text-neutral-400 font-mono">
                                    <span>QUESTION {currentQuestionIdx + 1} OF 3</span>
                                    <span>SCORE: {quizScore}/3</span>
                                  </div>
                                  {violationsData[selectedViolation].quiz[currentQuestionIdx].scenario && (
                                    <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-600 text-xs italic leading-relaxed">
                                      <strong>Scenario:</strong> &ldquo;
                                      {violationsData[selectedViolation].quiz[currentQuestionIdx].scenario}&rdquo;
                                    </div>
                                  )}
                                  <h4 className="text-sm font-bold text-black leading-snug">
                                    {violationsData[selectedViolation].quiz[currentQuestionIdx].question}
                                  </h4>
                                </div>

                                <div className="space-y-2.5">
                                  {violationsData[selectedViolation].quiz[currentQuestionIdx].options.map(
                                    (opt, oIdx) => {
                                      const sel = selectedAnswer === oIdx;
                                      const correct =
                                        violationsData[selectedViolation].quiz[currentQuestionIdx].correctIdx === oIdx;
                                      let cls =
                                        "bg-neutral-50 border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-black";
                                      if (sel && !quizSubmitted)
                                        cls = "border-black bg-neutral-100 text-black font-semibold";
                                      else if (quizSubmitted) {
                                        if (correct)
                                          cls =
                                            "border-emerald-500 bg-emerald-500/10 text-emerald-700 font-semibold";
                                        else if (sel)
                                          cls = "border-rose-500 bg-rose-500/10 text-rose-600 font-semibold";
                                        else cls = "opacity-40 border-neutral-200 text-neutral-400";
                                      }
                                      return (
                                        <button
                                          key={oIdx}
                                          onClick={() => handleAnswerSelect(oIdx)}
                                          disabled={quizSubmitted}
                                          className={`w-full p-3.5 border rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer ${cls}`}
                                        >
                                          <span className="flex-1 pr-4">{opt}</span>
                                          {quizSubmitted && correct && (
                                            <span className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0">
                                              <Check className="w-2.5 h-2.5" />
                                            </span>
                                          )}
                                          {quizSubmitted && sel && !correct && (
                                            <span className="w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center shrink-0">
                                              <X className="w-2.5 h-2.5" />
                                            </span>
                                          )}
                                        </button>
                                      );
                                    }
                                  )}
                                </div>

                                <div className="pt-3 border-t border-neutral-200">
                                  {!quizSubmitted ? (
                                    <button
                                      onClick={handleAnswerSubmit}
                                      disabled={selectedAnswer === null}
                                      className="w-full py-3 bg-black text-white font-bold text-xs rounded-xl shadow disabled:opacity-40 cursor-pointer transition-all"
                                    >
                                      Submit Answer
                                    </button>
                                  ) : (
                                    <button
                                      onClick={handleNextQuestion}
                                      className="w-full py-3 bg-black text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center justify-center gap-1"
                                    >
                                      {currentQuestionIdx < 2 ? "Next Question" : "Complete Quiz"}{" "}
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex-grow flex flex-col justify-center items-center text-center p-4 space-y-5">
                                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                                  <ShieldCheck className="w-7 h-7" />
                                </div>
                                <div>
                                  <h4 className="text-base font-bold text-black">Quiz Complete!</h4>
                                  <p className="text-xs text-neutral-500 mt-1">
                                    Score: {quizScore}/3 — {quizScore >= 2 ? "20% discount applied ✓" : "Minimum score not reached"}
                                  </p>
                                </div>
                                <div className="border border-neutral-200 px-4 py-2 rounded-xl font-mono text-[10px] font-bold text-rose-500 flex items-center gap-1.5 bg-neutral-50">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  CERT: SAFETY-{selectedViolation}-
                                  {violationsData[selectedViolation].plate.replace(/\s/g, "")}
                                </div>
                                <button
                                  onClick={() => setDemoStep(3)}
                                  className="w-full py-3 bg-black text-white font-bold text-xs rounded-xl shadow hover:opacity-90 cursor-pointer"
                                >
                                  Proceed to Payment
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Fine summary col */}
                          <div className="border border-neutral-200 p-6 rounded-2xl flex flex-col gap-5 bg-white">
                            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">
                              Challan Summary
                            </span>
                            <div className="space-y-3 font-mono text-[10px]">
                              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                                <span className="text-neutral-400">Section:</span>
                                <span className="font-bold text-black text-right text-xs">
                                  {violationsData[selectedViolation].mvSection}
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                                <span className="text-neutral-400">Base Fine:</span>
                                <span className="font-bold text-black">
                                  ₹{violationsData[selectedViolation].originalFine}
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-neutral-100 pb-2.5 text-emerald-600 font-bold">
                                <span>Quiz Discount:</span>
                                <span>
                                  − ₹
                                  {violationsData[selectedViolation].originalFine -
                                    violationsData[selectedViolation].discountFine}
                                </span>
                              </div>
                              <div className="flex justify-between text-black font-bold text-xs">
                                <span>Pay Now:</span>
                                <span>₹{violationsData[selectedViolation].discountFine}</span>
                              </div>
                            </div>

                            {quizSubmitted && (
                              <div className="p-3.5 border border-neutral-200 rounded-xl text-[11px] leading-relaxed text-neutral-500 bg-neutral-50 animate-fade-in">
                                <span className="font-bold text-black block mb-1">Why this matters:</span>
                                <span>&ldquo;{violationsData[selectedViolation].quiz[currentQuestionIdx]?.expl}&rdquo;</span>
                              </div>
                            )}

                            <div className="mt-auto p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                              <span className="text-[9px] text-neutral-400 leading-tight block">
                                Score 2/3 or more to qualify for the 20% fine reduction under the RoadPay safety education
                                program.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 3: Pay Citation */}
                  {demoStep === 3 && (
                    <motion.div
                      key="s3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex-grow flex flex-col gap-6"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-5">
                        <div>
                          <span className="text-[9px] text-rose-500 uppercase tracking-widest font-bold block mb-0.5">
                            Secure Payment Gateway
                          </span>
                          <h3 className="text-lg font-bold text-black">Pay Your Citation Online</h3>
                        </div>
                        <div className="px-3 py-1 border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 text-[10px] rounded-lg font-bold uppercase tracking-wider font-mono animate-pulse">
                          20% Quiz Discount Applied
                        </div>
                      </div>

                      <div className="flex-grow flex items-center justify-center">
                        <div className="max-w-sm w-full border border-neutral-200 rounded-2xl p-6 flex flex-col gap-5 bg-white shadow-sm">
                          {paymentComplete ? (
                            <div className="flex flex-col justify-center items-center text-center py-6 space-y-5">
                              <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow">
                                <Check className="w-7 h-7" />
                              </div>
                              <div>
                                <h4 className="text-base font-bold text-black">Challan Settled!</h4>
                                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                  Challan status updated to <strong>PAID</strong> in the vehicle registry. Receipt and safety
                                  certificate sent via email.
                                </p>
                              </div>
                              <div className="w-full flex gap-3">
                                <button
                                  onClick={handleReset}
                                  className="flex-1 py-3 border border-neutral-200 hover:border-neutral-400 text-neutral-500 hover:text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" /> Restart Demo
                                </button>
                                <Link
                                  href="/login"
                                  className="flex-1 py-3 bg-black text-white font-bold text-xs rounded-xl shadow hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                  Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          ) : paymentStarted ? (
                            <div className="flex flex-col items-center gap-5">
                              <div className="w-10 h-10 bg-neutral-100 text-neutral-500 rounded-full flex items-center justify-center">
                                <Lock className="w-5 h-5 animate-pulse" />
                              </div>
                              <div className="w-full border border-neutral-200 rounded-2xl overflow-hidden text-left shadow-sm animate-fade-in">
                                <div className="bg-[#111] p-4 text-white flex justify-between items-center">
                                  <div>
                                    <span className="text-[8px] text-neutral-400 block font-bold uppercase">
                                      Citation Payment
                                    </span>
                                    <h5 className="font-bold text-xs">Traffic Department</h5>
                                  </div>
                                  <span className="font-mono font-bold text-xs text-rose-400">
                                    ₹{violationsData[selectedViolation].discountFine}
                                  </span>
                                </div>
                                <div className="p-5 space-y-3">
                                  <span className="text-[8px] text-neutral-400 font-bold uppercase block tracking-wider">
                                    Choose Payment Method
                                  </span>
                                  <div className="space-y-2 text-[11px]">
                                    <button
                                      onClick={() => setPaymentComplete(true)}
                                      className="w-full p-2.5 bg-white border border-neutral-200 hover:border-emerald-500 hover:bg-emerald-500/5 rounded-xl font-bold flex items-center justify-between transition-all cursor-pointer"
                                    >
                                      <span>💳 Credit Card / Debit Card (Razorpay)</span>
                                      <span className="text-[9px] text-emerald-500">Instant</span>
                                    </button>
                                    <button
                                      onClick={() => setPaymentComplete(true)}
                                      className="w-full p-2.5 bg-white border border-neutral-200 hover:border-emerald-500 hover:bg-emerald-500/5 rounded-xl font-bold flex items-center justify-between transition-all cursor-pointer"
                                    >
                                      <span>📱 NetBanking / UPI (Razorpay)</span>
                                      <span className="text-[9px] text-emerald-500">Instant</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-5">
                              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">
                                Challan Receipt
                              </span>
                              <div className="space-y-2.5 font-mono text-[10px]">
                                <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                                  <span className="text-neutral-400">License Plate:</span>
                                  <span className="font-bold text-black">
                                    {violationsData[selectedViolation].plate}
                                  </span>
                                </div>
                                <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                                  <span className="text-neutral-400">Traffic Code:</span>
                                  <span className="font-bold text-black">
                                    {violationsData[selectedViolation].mvSection}
                                  </span>
                                </div>
                                <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                                  <span className="text-neutral-400">Original Fine:</span>
                                  <span className="font-bold text-black">
                                    ₹{violationsData[selectedViolation].originalFine}
                                  </span>
                                </div>
                                <div className="flex justify-between border-b border-neutral-100 pb-2.5 text-emerald-600 font-bold">
                                  <span>Safety Quiz Discount:</span>
                                  <span>
                                    − ₹
                                    {violationsData[selectedViolation].originalFine -
                                      violationsData[selectedViolation].discountFine}
                                  </span>
                                </div>
                                <div className="flex justify-between text-black font-bold text-xs">
                                  <span>Total Payable:</span>
                                  <span>₹{violationsData[selectedViolation].discountFine}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => setPaymentStarted(true)}
                                className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Check className="w-4 h-4" /> Pay via Credit Card / UPI
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────── */}
      <section id="workflow" className="w-full border-t border-[var(--border-color)] relative z-10">
        <div className="w-full max-w-[1200px] mx-auto px-8 py-24">
          <div className="mb-14">
            <span className="text-[10px] text-rose-500 uppercase tracking-widest font-extrabold block mb-3">
              The Process
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-black tracking-tight leading-tight mb-4">
              How RoadPay AI Works.
            </h2>
            <p className="text-sm text-neutral-500 max-w-xl leading-relaxed">
              From camera detection to checkout — the complete citation lifecycle is fully automated and educational.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden">
            {[
              {
                step: "01",
                icon: <Camera className="w-4 h-4" />,
                title: "Evidence Capture",
                tag: "Camera",
                desc: "Traffic cameras or officers upload images/videos of safety violations. Compatible with municipal network cameras and mobile devices.",
              },
              {
                step: "02",
                icon: <BrainCircuit className="w-4 h-4" />,
                title: "AI Violation Detection",
                tag: "Gemini 3.5 Flash",
                desc: "Google Gemini 3.5 Flash identifies safety violations like missing helmets, overloading, or wrong-way driving, returning instant classification details.",
              },
              {
                step: "03",
                icon: <Eye className="w-4 h-4" />,
                title: "License Plate OCR",
                tag: "OCR",
                desc: "AI extracts the license plate from the image, normalizes it into a standard alphanumeric string, and validates the match.",
              },
              {
                step: "04",
                icon: <UserCheck className="w-4 h-4" />,
                title: "Registry DB Lookup",
                tag: "Registry",
                desc: "Registry lookup resolves the vehicle's registered owner name, address, contact numbers, and registration category.",
              },
              {
                step: "05",
                icon: <FileText className="w-4 h-4" />,
                title: "Citation PDF",
                tag: "ReportLab",
                desc: "A formal citation PDF is generated containing citation details, safety regulations, fee structures, and a scannable payment QR code.",
              },
              {
                step: "06",
                icon: <Mail className="w-4 h-4" />,
                title: "Email Notification",
                tag: "Notification",
                desc: "The e-challan and safety quiz link are instantly emailed to the owner's registered email address.",
              },
              {
                step: "07",
                icon: <Award className="w-4 h-4" />,
                title: "Road Safety Quiz",
                tag: "Education",
                desc: "The vehicle owner completes an interactive 3-question module covering the specific violation, its hazards, and proper road behaviors.",
              },
              {
                step: "08",
                icon: <TrendingDown className="w-4 h-4" />,
                title: "Fine Reduction",
                tag: "Discount",
                desc: "Achieving a passing score automatically reduces the fine by 20% in the backend. The updated citation amount is updated in real-time.",
              },
              {
                step: "09",
                icon: <Smartphone className="w-4 h-4" />,
                title: "Online Payment",
                tag: "Razorpay",
                desc: "The offender pays the reduced fee online. Completed payments automatically update the citation status to PAID in the vehicle registry.",
              },
            ].map((s, i) => (
              <div key={i} className="p-6 bg-white flex flex-col gap-4 hover:bg-neutral-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600">
                    {s.icon}
                  </div>
                  <span className="text-[9px] font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded uppercase tracking-wider">
                    {s.tag}
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-[10px] font-black text-neutral-300 font-mono">{s.step}</span>
                    <h4 className="text-sm font-extrabold text-black uppercase tracking-wide">{s.title}</h4>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────── */}
      <section id="features" className="w-full border-t border-[var(--border-color)] relative z-10">
        <div className="w-full max-w-[1200px] mx-auto px-8 py-24">
          <div className="mb-14 text-center max-w-3xl mx-auto">
            <span className="text-[10px] text-rose-500 uppercase tracking-widest font-extrabold block mb-3">
              Platform Features
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-black tracking-tight leading-tight mb-4 text-center">
              Built for Modern Roads.
            </h2>
            <p className="text-sm text-neutral-500 max-w-2xl leading-relaxed mx-auto text-center">
              Every feature is designed to modernize traffic safety — registry integration, automated citation delivery,
              seamless online payments, and safety education.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <BrainCircuit className="w-5 h-5 text-rose-500" />,
                iconBg: "bg-rose-500/10",
                badge: "Gemini 3.5 Flash",
                title: "AI Violation Detection",
                desc: "Detects missing safety gear, overloading, and wrong-way driving from camera feeds using Google Gemini 3.5 Flash.",
                detail: (
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-[9px] text-neutral-500 space-y-1.5 mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      helmet_detected: false → Sec. 12
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      passenger_count: 3 → Sec. 14
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      wrong_side: true → Sec. 22
                    </div>
                  </div>
                ),
              },
              {
                icon: <Eye className="w-5 h-5 text-blue-500" />,
                iconBg: "bg-blue-500/10",
                badge: "OCR Engine",
                title: "License Plate Recognition",
                desc: "Reads Indian format license plates using AI OCR and validates them against vehicle registry formatting.",
                detail: (
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-[9px] mt-auto space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Input:</span>
                      <span>&ldquo;mh-12-ab-1234&rdquo;</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Normalised:</span>
                      <span className="font-bold bg-emerald-500 text-white px-2 py-0.5 rounded text-[8px]">
                        MH12AB1234
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Confidence:</span>
                      <span className="text-emerald-600 font-bold">97.4%</span>
                    </div>
                  </div>
                ),
              },
              {
                icon: <Sparkles className="w-5 h-5 text-amber-500" />,
                iconBg: "bg-amber-500/10",
                badge: "Generative AI",
                title: "Safety Regulations Explanations",
                desc: "Google Gemini 3.5 Flash generates clear, section-specific safety explanations in plain language, detailing the hazards and real-world risks associated with each violation.",
                detail: (
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-[10px] text-neutral-500 italic leading-relaxed mt-auto">
                    &ldquo;Under Section 12 of the Traffic Act, helmets reduce fatal head injury risk by 70%. Traffic
                    statistics show headgear prevents major head trauma...&rdquo;
                  </div>
                ),
              },
              {
                icon: <FileText className="w-5 h-5 text-purple-500" />,
                iconBg: "bg-purple-500/10",
                badge: "ReportLab",
                title: "Challan PDF + QR Code",
                desc: "Generates a formal e-challan PDF with a citation number, vehicle details, fine amount, and a scannable payment QR code.",
                detail: (
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-[9px] text-neutral-500 mt-auto flex justify-between items-center">
                    <div className="space-y-1">
                      <div>challan_MH12AB1234_001.pdf</div>
                      <div className="text-neutral-400">MV Act Sec. 129 · ₹500 · QR</div>
                    </div>
                    <QrCode className="w-8 h-8 text-black" />
                  </div>
                ),
              },
              {
                icon: <Award className="w-5 h-5 text-emerald-500" />,
                iconBg: "bg-emerald-500/10",
                badge: "Education",
                title: "Road Safety Quiz",
                desc: "3-question quiz mapped to the specific traffic code. Score 2/3 to earn a 20% fine reduction and a digital safety compliance certificate.",
                detail: (
                  <div className="mt-auto space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="border border-emerald-300 p-2.5 rounded-lg text-center font-bold text-emerald-600 bg-emerald-500/5">
                        ✓ Correct — −20%
                      </div>
                      <div className="border border-rose-200 p-2.5 rounded-lg text-center font-bold text-rose-400 bg-rose-500/5 opacity-60">
                        ✗ Incorrect
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-1 text-[9px] font-mono text-neutral-400">
                      <span>Pass mark: 2/3 questions</span>
                      <span className="text-emerald-600 font-bold">→ ₹500 becomes ₹400</span>
                    </div>
                  </div>
                ),
              },
              {
                icon: <Smartphone className="w-5 h-5 text-cyan-500" />,
                iconBg: "bg-cyan-500/10",
                badge: "Razorpay",
                title: "Secure Online Payments",
                desc: "Offenders pay the reduced fine instantly via UPI, NetBanking, or card. The payment is marked PAID in the registry.",
                detail: (
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-[9px] text-neutral-500 mt-auto space-y-1.5">
                    <div className="flex justify-between">
                      <span>UPI (GPay / PhonePe)</span>
                      <span className="text-emerald-600 font-bold">✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Debit / Credit Card</span>
                      <span className="text-emerald-600 font-bold">✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Razorpay Sandbox</span>
                      <span className="text-blue-500 font-bold">ON</span>
                    </div>
                  </div>
                ),
              },
            ].map((card, i) => (
              <div
                key={i}
                className="border border-black p-7 flex flex-col gap-5 text-left bg-[var(--marketing-paper)] rounded-2xl shadow-[6px_6px_0_#000] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#000] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                    {card.icon}
                  </div>
                  <span className="text-[9px] font-bold text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md uppercase tracking-wider">
                    {card.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black mb-2">{card.title}</h3>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">{card.desc}</p>
                </div>
                {card.detail}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ───────────────────────────── */}
      <section id="faq" className="w-full border-t border-[var(--border-color)] relative z-10 py-24">
        <div className="w-full max-w-[1200px] mx-auto px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] text-rose-500 uppercase tracking-widest font-extrabold block mb-3">
              FAQ
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-black tracking-tight leading-tight mb-4 text-center mx-auto">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-neutral-500 max-w-xl leading-relaxed mx-auto">
              Got questions? We have answers. If you have additional inquiries, reach out to our traffic support desk.
            </p>
          </div>

          <div className="faq-grid max-w-3xl mx-auto text-left">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className="faq-item">
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="faq-question w-full flex justify-between items-center"
                  >
                    <span>{faq.question}</span>
                    <span className="font-mono text-lg font-bold ml-4">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="faq-answer animate-fade-in border-t border-neutral-100/60 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ────────────────────────────── */}
      <section className="w-full border-t border-[var(--border-color)] relative z-10">
        <div className="w-full max-w-[1200px] mx-auto px-8 py-20">
          <div className="flex flex-col items-center justify-center text-center gap-8">
            <div>
              <span className="text-[10px] text-rose-500 uppercase tracking-widest font-extrabold block mb-2 mx-auto">
                Tech Stack
              </span>
              <h2 className="text-3xl font-extrabold text-black tracking-tight mb-2">Built on modern tools.</h2>
            </div>
            <div className="flex flex-wrap gap-2.5 justify-center max-w-3xl mx-auto">
              {[
                "Next.js 15",
                "TypeScript",
                "TailwindCSS",
                "Framer Motion",
                "FastAPI",
                "SQLAlchemy",
                "PostgreSQL",
                "Gemini 3.5 Flash",
                "ReportLab PDF",
                "Razorpay Payment",
              ].map((t, i) => (
                <span
                  key={i}
                  className="px-3.5 py-1.5 border border-neutral-200 rounded-lg text-xs font-bold text-neutral-500 bg-white hover:border-neutral-400 hover:text-black transition-colors cursor-default"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────── */}
      <footer className="w-full border-t border-[var(--border-color)] py-10 bg-neutral-50 relative z-10">
        <div className="w-full max-w-[1200px] mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-rose-500" />
            <span className="font-extrabold text-black text-sm">RoadPay AI</span>
          </div>
          <span className="text-neutral-400 text-[11px] font-medium">
            &copy; 2026 RoadPay AI · Making our roads safer, one citation at a time.
          </span>
          <div className="flex items-center gap-5 text-[11px] font-bold text-neutral-400">
            <Link href="/login" className="hover:text-black transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-black transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
