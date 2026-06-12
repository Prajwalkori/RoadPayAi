"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Award,
  BookOpen,
  Check,
  X,
  Loader,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Sparkles,
  Trophy,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { apiRequest, getToken, UserToken } from "../../utils/api";
import confetti from "canvas-confetti";
import Link from "next/link";

export default function LearningPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<UserToken | null>(null);
  
  // Pending challans list to choose from
  const [pendingChallans, setPendingChallans] = useState<any[]>([]);
  const [selectedChallanId, setSelectedChallanId] = useState<number | null>(null);
  
  // Quiz states
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  
  // Quiz results
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  const startQuizModule = async (violationId: number) => {
    setQuizLoading(true);
    setQuizData(null);
    setQuizResult(null);
    setCurrentIdx(0);
    setSelectedOption(null);
    setAnswered(false);
    setUserAnswers([]);
    
    try {
      const data = await apiRequest(`/learning/module?violation_id=${violationId}`);
      setQuizData(data);
    } catch (err: any) {
      alert(err.message || "Failed to load safety quiz module.");
      setSelectedChallanId(null);
    } finally {
      setQuizLoading(false);
    }
  };

  const loadPendingChallans = async () => {
    try {
      const activeToken = getToken();
      setToken(activeToken);
      
      const res = await apiRequest("/violations?status_filter=PENDING");
      const overdueRes = await apiRequest("/violations?status_filter=OVERDUE");
      
      const combined = [...(res.violations || []), ...(overdueRes.violations || [])];
      setPendingChallans(combined);

      // Check if violation_id was passed via query parameter (e.g. from Violations Feed)
      const paramId = searchParams.get("violation_id");
      if (paramId) {
        const idNum = parseInt(paramId);
        setSelectedChallanId(idNum);
        startQuizModule(idNum);
      }
    } catch (e) {
      console.log("Error loading pending violations for quiz:", e);
    }
  };

  useEffect(() => {
    loadPendingChallans();
  }, [searchParams]);

  const selectOption = (optIdx: number) => {
    if (answered) return;
    setSelectedOption(optIdx);
    setAnswered(true);
    
    // Check if correct index
    const correctIndex = quizData.questions[currentIdx].correct_index;
    const isCorrect = (optIdx === correctIndex);
    
    if (isCorrect) {
      // Trigger canvas-confetti burst for correct answer
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 },
        colors: ["#10b981", "#34d399", "#6ee7b7"]
      });
    }
    
    setUserAnswers([...userAnswers, optIdx]);
  };

  const handleNext = async () => {
    setSelectedOption(null);
    setAnswered(false);
    
    if (currentIdx + 1 < quizData.questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Submit Answers
      setSubmitting(true);
      try {
        const res = await apiRequest("/learning/submit", {
          method: "POST",
          body: JSON.stringify({
            violation_id: selectedChallanId,
            answers: userAnswers
          })
        });
        setQuizResult(res);
        
        if (res.passed) {
          // Exploding confetti for passing safety module
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
        }
      } catch (err: any) {
        alert(err.message || "Failed to submit safety quiz answers.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-8 text-[var(--text-primary)]">
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Road Safety Learning Portal</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Complete modules to earn up to 20% fine mitigation and driver certificates.
        </p>
      </div>

      {/* NO CHALLAN SELECTED - CHOOSE DRILL MODULE */}
      {!selectedChallanId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main selection card */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass-panel-static p-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Select Active Violations to Settle</h3>
              
              {pendingChallans.length > 0 ? (
                <div className="space-y-4">
                  {pendingChallans.map((challan) => (
                    <div
                      key={challan.id}
                      onClick={() => { setSelectedChallanId(challan.id); startQuizModule(challan.id); }}
                      className="p-5 bg-[var(--hover-bg)] border border-[var(--border-color)] hover:border-[var(--card-hover-border)] hover:bg-[var(--hover-bg)]/80 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:translate-x-1 shadow-sm"
                    >
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{challan.challan_id}</span>
                          <span className="px-2 py-0.5 bg-rose-500/[0.08] border border-rose-500/10 text-rose-500 text-[10px] font-semibold uppercase rounded">
                            {challan.violation_type.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">
                          Due Date: {new Date(challan.due_date).toLocaleDateString()} | Vehicle: {challan.vehicle_number}
                        </p>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <div>
                          <div className="text-sm font-black text-[var(--text-primary)]">₹{challan.final_amount}</div>
                          <span className="text-[10px] text-emerald-500">Earn up to ₹{challan.base_amount * 0.2} discount</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-[var(--text-secondary)] italic space-y-2">
                  <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p>You have no active violations qualifying for safety modules.</p>
                  <Link href="/dashboard" className="text-xs text-rose-500 hover:underline">Return to dashboard</Link>
                </div>
              )}
            </div>
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6">
            <div className="glass-panel-static p-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Scholar Rewards</h3>
              <div className="space-y-4 text-xs">
                <div className="flex gap-3 items-start p-3 bg-emerald-500/[0.05] border border-emerald-500/10 rounded-xl text-left">
                  <Trophy className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <strong className="block text-[var(--text-primary)]">Score 90%+ (3/3 Correct)</strong>
                    <span className="text-[var(--text-secondary)]">Earns a <strong>20% discount</strong> on fine base rate and safety certificate.</span>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-yellow-500/[0.05] border border-yellow-500/10 rounded-xl text-left">
                  <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                  <div>
                    <strong className="block text-[var(--text-primary)]">Score 80%+ (2/3 Correct)</strong>
                    <span className="text-[var(--text-secondary)]">Earns a <strong>10% discount</strong> and safety certificate.</span>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-xl text-left">
                  <AlertTriangle className="w-5 h-5 text-[var(--text-secondary)] shrink-0" />
                  <div>
                    <strong className="block text-[var(--text-secondary)]">Below 80% (Failed)</strong>
                    <span className="text-[var(--text-tertiary)]">No discount. You can retry the module to improve your score.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ LOADING */}
      {quizLoading && (
        <div className="h-80 flex flex-col items-center justify-center text-[var(--text-secondary)]">
          <Loader className="w-8 h-8 text-rose-500 animate-spin mb-3" />
          <span>Generating custom educational scenarios via Gemini 3.5 Flash...</span>
        </div>
      )}

      {/* QUIZ DISPLAY */}
      {quizData && !quizResult && !quizLoading && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="glass-panel-static p-6 relative overflow-hidden">
            {/* Top progress bar */}
            <div className="w-full h-1 bg-[var(--background)] rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-primary transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / quizData.questions.length) * 100}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] mb-6">
              <span>MODULE: <strong>{quizData.violation_type.replace("_", " ")}</strong></span>
              <span>Question <strong>{currentIdx + 1}</strong> of {quizData.questions.length}</span>
            </div>

            {/* Question Text block */}
            <div className="space-y-4 mb-8 text-left">
              <div className="p-4 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] text-sm italic">
                <strong>Scenario:</strong> "{quizData.questions[currentIdx].scenario}"
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {quizData.questions[currentIdx].question}
              </h3>
            </div>

            {/* Options list */}
            <div className="space-y-3">
              {quizData.questions[currentIdx].options.map((opt: string, oIdx: number) => {
                const isSelected = selectedOption === oIdx;
                const correctIdx = quizData.questions[currentIdx].correct_index;
                const isCorrect = oIdx === correctIdx;
                
                let btnStyle = "border-[var(--border-color)] bg-[var(--hover-bg)] text-[var(--text-primary)] hover:border-[var(--card-hover-border)] hover:bg-[var(--hover-bg)]";
                
                if (answered) {
                  if (isCorrect) {
                    btnStyle = "border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400 font-bold";
                  } else if (isSelected) {
                    btnStyle = "border-rose-500/40 bg-rose-500/[0.08] text-rose-600 dark:text-rose-400 font-bold";
                  } else {
                    btnStyle = "border-[var(--border-color)] bg-[var(--hover-bg)] text-[var(--text-tertiary)] opacity-40";
                  }
                }
                
                return (
                  <button
                    key={oIdx}
                    onClick={() => selectOption(oIdx)}
                    disabled={answered}
                    className={`w-full p-4 border text-left rounded-xl text-sm transition-all flex items-center justify-between shadow-sm cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {answered && isCorrect && <Check className="w-5 h-5 text-emerald-500 shrink-0" />}
                    {answered && isSelected && !isCorrect && <X className="w-5 h-5 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* AI Explanation details display */}
            {answered && (
              <div className="mt-6 p-4 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-xl space-y-3 animate-fade-in text-xs text-left">
                <div className="text-rose-500 font-bold flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>AI Explanation</span>
                </div>
                <p className="text-[var(--text-primary)] leading-relaxed">
                  {quizData.questions[currentIdx].explanation}
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-gradient-primary text-white font-bold rounded-lg flex items-center gap-1.5 shadow-lg active:scale-98 transition-all cursor-pointer"
                  >
                    <span>{currentIdx + 1 === quizData.questions.length ? "Finish Assessment" : "Next Scenario"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUIZ SUBMITTING RESULT */}
      {submitting && (
        <div className="h-80 flex flex-col items-center justify-center text-[var(--text-secondary)]">
          <Loader className="w-8 h-8 text-rose-500 animate-spin mb-3" />
          <span>Verifying scores and updating outstanding challan records...</span>
        </div>
      )}

      {/* QUIZ RESULT PANEL */}
      {quizResult && (
        <div className="max-w-md mx-auto space-y-6">
          <div className="glass-panel-static p-8 text-center relative overflow-hidden animate-fade-in">
            {quizResult.passed ? (
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto mb-6">
                <Trophy className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto mb-6">
                <AlertTriangle className="w-8 h-8" />
              </div>
            )}

            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">
              {quizResult.passed ? "Safety Module Passed!" : "Assessment Incomplete"}
            </h3>
            <p className="text-[var(--text-secondary)] text-xs leading-relaxed mb-6">
              You scored <strong>{Math.round(quizResult.score)}%</strong> ({quizResult.correct_count} of {quizResult.total_count} correct).
            </p>

            {/* Calculations Summary display */}
            <div className="bg-[var(--hover-bg)] p-4 border border-[var(--border-color)] rounded-2xl text-left space-y-3 mb-6">
              <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-semibold block border-b border-[var(--border-color)] pb-2">
                Settlement Calculator Breakout
              </span>
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>Original Fine Due:</span>
                <span>₹{quizResult.original_amount}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-500 font-semibold">
                <span>Course discount Applied:</span>
                <span>- ₹{quizResult.discount_earned}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[var(--text-primary)] pt-2 border-t border-[var(--border-color)]">
                <span>Final Settle Fine:</span>
                <span>₹{quizResult.final_amount}</span>
              </div>
            </div>

            {/* Digital Certificate warning */}
            {quizResult.passed && quizResult.certificate_code && (
              <div className="p-4 bg-emerald-500/[0.05] border border-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-2xl flex items-start gap-3 text-left mb-8">
                <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <strong className="block text-xs mb-0.5 text-[var(--text-primary)]">Safety Certificate Issued</strong>
                  <span className="text-[10px] text-[var(--text-tertiary)] block">Cert Code: {quizResult.certificate_code}</span>
                  <span className="text-[10px] leading-tight block mt-1 text-[var(--text-secondary)]">
                    This confirms you have successfully reviewed safety protocols for this violation type.
                  </span>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => { setSelectedChallanId(null); setQuizResult(null); loadPendingChallans(); }}
                className="flex-1 py-3 bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Back to List
              </button>
              
              <Link
                href="/dashboard/violations"
                className="flex-1 py-3 bg-gradient-primary text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all"
              >
                <span>Proceed to Pay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
