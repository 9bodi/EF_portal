"use client";

import { useEffect, useRef, useCallback } from "react";

interface ScormPlayerProps {
  chapterId: string;
  scormEntryUrl: string;
  savedCmiData: Record<string, any> | null;
  chapterTitle: string;
}

export default function ScormPlayer({ chapterId, scormEntryUrl, savedCmiData, chapterTitle }: ScormPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cmiDataRef = useRef<Record<string, any>>(savedCmiData || {});
  const savingRef = useRef(false);

  const saveCmiData = useCallback(async (finish: boolean = false) => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const cmi = cmiDataRef.current;
      await fetch("/api/scorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId,
          cmiData: cmi,
          status: cmi["cmi.core.lesson_status"] || "incomplete",
          sessionTime: finish ? (cmi["cmi.core.session_time"] || "00:00:00") : null,
          score: cmi["cmi.core.score.raw"] ? parseFloat(cmi["cmi.core.score.raw"]) : null,
        }),
      });
    } catch (err) {
      console.error("Erreur sauvegarde SCORM:", err);
    } finally {
      savingRef.current = false;
    }
  }, [chapterId]);

  useEffect(() => {
    const cmiDefaults: Record<string, string> = {
      "cmi.core.student_id": "",
      "cmi.core.student_name": "",
      "cmi.core.lesson_location": "",
      "cmi.core.lesson_status": "not attempted",
      "cmi.core.entry": savedCmiData ? "resume" : "ab-initio",
      "cmi.core.score.raw": "",
      "cmi.core.score.max": "100",
      "cmi.core.score.min": "0",
      "cmi.core.total_time": "00:00:00",
      "cmi.core.credit": "credit",
      "cmi.core.lesson_mode": "normal",
      "cmi.core.exit": "",
      "cmi.core.session_time": "00:00:00",
      "cmi.suspend_data": "",
      "cmi.launch_data": "",
      "cmi.comments": "",
      "cmi.comments_from_lms": "",
    };

    const API = {
      LMSInitialize: function() { return "true"; },
      LMSFinish: function() { saveCmiData(true); return "true"; },
      LMSGetValue: function(el: string) {
        var v = cmiDataRef.current[el];
        if (v !== undefined && v !== null) return String(v);
        return cmiDefaults[el] !== undefined ? cmiDefaults[el] : "";
      },
      LMSSetValue: function(el: string, val: string) { cmiDataRef.current[el] = val; return "true"; },
      LMSCommit: function() { saveCmiData(false); return "true"; },
      LMSGetLastError: function() { return "0"; },
      LMSGetErrorString: function() { return "No error"; },
      LMSGetDiagnostic: function() { return "No diagnostic"; },
    };

    (window as any).API = API;

    return () => {
      delete (window as any).API;
    };
  }, [savedCmiData, saveCmiData]);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", overflow: "hidden", zIndex: 1 }}>
      <a
        href="/formation"
        style={{
          position: "fixed", top: 16, left: 16, zIndex: 99999,
          backgroundColor: "rgba(15,31,61,0.85)", color: "white",
          padding: "10px 20px", borderRadius: 10, textDecoration: "none",
          fontSize: 15, fontWeight: 600, backdropFilter: "blur(10px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        Retour au programme
      </a>
      <iframe
        ref={iframeRef}
        src={scormEntryUrl}
        style={{ width: "100vw", height: "100vh", border: "none", display: "block" }}
       allow="autoplay; fullscreen"


        title={chapterTitle}
      />
    </div>
  );
}
