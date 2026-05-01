"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const heading = "font-[family-name:var(--font-heading)]";

interface ProctoringGuardProps {
  sessionId: string;
  sessionType: "LAB" | "MOCK_INTERVIEW";
  enabled?: boolean;
  strictMode?: boolean; // true = auto-submit on max violations (labs), false = warn only (mock interviews)
  maxViolations?: number;
  onAutoSubmit?: () => void; // called when max violations reached in strict mode
  children: React.ReactNode;
}

interface ProctoringEvent {
  type: string;
  timestamp: string;
  detail?: string;
}

export default function ProctoringGuard({
  sessionId,
  sessionType,
  enabled = true,
  strictMode = false,
  maxViolations = 4,
  onAutoSubmit,
  children,
}: ProctoringGuardProps) {
  const [tabSwitches, setTabSwitches] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warning, setWarning] = useState<{ type: string; level: "yellow" | "orange" | "red" } | null>(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [proctoringStarted, setProctoringStarted] = useState(false);
  const [showSetup, setShowSetup] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const eventsRef = useRef<ProctoringEvent[]>([]);
  const totalViolationsRef = useRef(0);

  const addEvent = useCallback((type: string, detail?: string) => {
    eventsRef.current.push({ type, timestamp: new Date().toISOString(), detail });
  }, []);

  const showWarningBanner = useCallback((type: string) => {
    totalViolationsRef.current += 1;
    const total = totalViolationsRef.current;

    if (total >= maxViolations && strictMode && onAutoSubmit) {
      setWarning({ type: "AUTO-SUBMITTING: Too many violations", level: "red" });
      // Save final state then auto-submit
      fetch("/api/proctoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end", sessionId,
          tabSwitches, fullscreenExits, copyAttempts,
          events: JSON.stringify(eventsRef.current),
        }),
      }).finally(() => {
        setTimeout(() => onAutoSubmit(), 1500);
      });
      return;
    }

    const level = total === 1 ? "yellow" : total === 2 ? "orange" : "red";
    setWarning({ type, level });
    setTimeout(() => setWarning(null), 4000);
  }, [maxViolations, strictMode, onAutoSubmit, sessionId, tabSwitches, fullscreenExits, copyAttempts]);

  // Sync violations to server periodically
  const syncToServer = useCallback(() => {
    if (!proctoringStarted) return;
    fetch("/api/proctoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update", sessionId,
        tabSwitches, fullscreenExits, copyAttempts,
        events: JSON.stringify(eventsRef.current),
      }),
    }).catch(() => {});
  }, [proctoringStarted, sessionId, tabSwitches, fullscreenExits, copyAttempts]);

  // Start proctoring session
  async function startProctoring() {
    // 1. Request fullscreen
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch { /* user may deny */ }

    // 2. Request webcam
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setWebcamReady(true);

      // Capture initial snapshot after small delay
      setTimeout(() => captureWebcam(), 1000);
    } catch { /* webcam denied — continue without it */ }

    // 3. Create proctoring log
    await fetch("/api/proctoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", sessionId, sessionType }),
    });

    addEvent("SESSION_START", `Proctoring started. Fullscreen: ${document.fullscreenElement ? "yes" : "no"}, Webcam: ${streamRef.current ? "yes" : "no"}`);
    setProctoringStarted(true);
    setShowSetup(false);
  }

  function captureWebcam() {
    if (!videoRef.current || !streamRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      // We just capture — storing webcam images would need GCS upload
      // For now, just log that capture happened
      addEvent("WEBCAM_CAPTURE", "Initial identity snapshot captured");
    }
  }

  // Register event listeners
  useEffect(() => {
    if (!proctoringStarted || !enabled) return;

    function handleVisibilityChange() {
      if (document.hidden) {
        setTabSwitches((prev) => {
          const next = prev + 1;
          addEvent("TAB_SWITCH", `Tab switch #${next}`);
          showWarningBanner(`Tab switch detected (${next})`);
          return next;
        });
      }
    }

    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        setFullscreenExits((prev) => {
          const next = prev + 1;
          addEvent("FULLSCREEN_EXIT", `Fullscreen exit #${next}`);
          showWarningBanner(`Fullscreen exit detected (${next})`);
          return next;
        });
      } else {
        setIsFullscreen(true);
      }
    }

    function handleCopy(e: Event) {
      e.preventDefault();
      setCopyAttempts((prev) => {
        const next = prev + 1;
        addEvent("COPY_ATTEMPT", `Copy attempt #${next}`);
        showWarningBanner("Copy attempt blocked");
        return next;
      });
    }

    function handlePaste(e: Event) {
      e.preventDefault();
      setCopyAttempts((prev) => {
        const next = prev + 1;
        addEvent("PASTE_ATTEMPT", `Paste attempt #${next}`);
        showWarningBanner("Paste attempt blocked");
        return next;
      });
    }

    function handleContextMenu(e: Event) {
      e.preventDefault();
      addEvent("RIGHT_CLICK", "Right-click blocked");
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);

    // Periodic sync every 30 seconds
    const syncInterval = setInterval(syncToServer, 30000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      clearInterval(syncInterval);

      // Cleanup: end session, release webcam, exit fullscreen
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      fetch("/api/proctoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end", sessionId,
          tabSwitches, fullscreenExits, copyAttempts,
          events: JSON.stringify(eventsRef.current),
        }),
      }).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proctoringStarted, enabled]);

  if (!enabled) return <>{children}</>;

  // Setup screen
  if (showSetup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "var(--ink)" }}>
        <div className="max-w-md w-full mx-4 rounded-2xl bg-white p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🛡️</div>
            <h2 className={`${heading} text-xl font-bold mb-2`} style={{ color: "var(--ink)" }}>Proctored Assessment</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              This {sessionType === "LAB" ? "assessment" : "interview"} is proctored. The following will be monitored:
            </p>
          </div>

          <div className="space-y-2 mb-6">
            {[
              { icon: "🖥️", text: "Full-screen mode will be activated" },
              { icon: "📷", text: "Webcam photo for identity verification" },
              { icon: "🔄", text: "Tab switches will be tracked and limited" },
              { icon: "📋", text: "Copy/paste will be disabled during the test" },
              { icon: "🖱️", text: "Right-click will be disabled" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--surface)" }}>
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs" style={{ color: "var(--ink)" }}>{item.text}</span>
              </div>
            ))}
          </div>

          {strictMode && (
            <div className="rounded-xl p-3 mb-4 text-xs" style={{ background: "#fef2f2", color: "#ef4444" }}>
              <strong>Warning:</strong> Exceeding {maxViolations} violations will auto-submit your assessment.
            </div>
          )}

          {/* Hidden video element for webcam */}
          <video ref={videoRef} autoPlay muted playsInline className="hidden" />

          <button
            onClick={startProctoring}
            className={`w-full rounded-xl py-3 text-sm font-bold transition-all ${heading}`}
            style={{ background: "var(--primary)", color: "white" }}
          >
            I Understand — Start {sessionType === "LAB" ? "Assessment" : "Interview"}
          </button>

          <p className="text-[10px] text-center mt-3" style={{ color: "var(--muted)" }}>
            By proceeding, you agree to be monitored during this session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Warning Banner */}
      {warning && (
        <div
          className="fixed top-0 left-0 right-0 z-[100] py-2 px-4 text-center text-sm font-bold animate-pulse"
          style={{
            background: warning.level === "yellow" ? "#fef3c7" : warning.level === "orange" ? "#fed7aa" : "#fecaca",
            color: warning.level === "yellow" ? "#92400e" : warning.level === "orange" ? "#9a3412" : "#991b1b",
          }}
        >
          ⚠️ {warning.type}
          {strictMode && (
            <span className="ml-2 text-xs font-normal">
              ({totalViolationsRef.current}/{maxViolations} violations)
            </span>
          )}
        </div>
      )}

      {/* Fullscreen Exit Overlay */}
      {proctoringStarted && !isFullscreen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="text-center text-white max-w-sm mx-4">
            <div className="text-4xl mb-3">🖥️</div>
            <h3 className={`${heading} text-lg font-bold mb-2`}>Fullscreen Required</h3>
            <p className="text-sm mb-4 opacity-70">You exited fullscreen mode. Please return to fullscreen to continue.</p>
            <button
              onClick={() => document.documentElement.requestFullscreen().catch(() => {})}
              className={`${heading} rounded-xl px-6 py-3 text-sm font-bold`}
              style={{ background: "white", color: "var(--primary)" }}
            >
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Proctoring Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[80] flex items-center justify-between px-4 py-1.5 text-[10px]" style={{ background: "var(--ink)", color: "rgba(255,255,255,0.5)" }}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10b981" }} />
            Proctored
          </span>
          {webcamReady && <span>📷 Webcam active</span>}
        </div>
        <div className="flex items-center gap-3">
          {tabSwitches > 0 && <span style={{ color: tabSwitches >= 3 ? "#ef4444" : "#f59e0b" }}>Tab: {tabSwitches}</span>}
          {fullscreenExits > 0 && <span style={{ color: fullscreenExits >= 3 ? "#ef4444" : "#f59e0b" }}>FS: {fullscreenExits}</span>}
          {copyAttempts > 0 && <span style={{ color: "#f59e0b" }}>Copy: {copyAttempts}</span>}
        </div>
      </div>

      {/* Hidden webcam video */}
      <video ref={videoRef} autoPlay muted playsInline className="hidden" />

      {/* Content */}
      {children}
    </div>
  );
}
