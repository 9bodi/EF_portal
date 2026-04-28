"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import WelcomeModal from "./WelcomeModal";

interface Props {
  userId: string;
  firstName: string;
  showWelcome: boolean;
  children: React.ReactNode;
}

export default function FormationClient({ userId, firstName, showWelcome, children }: Props) {
  const [modalOpen, setModalOpen] = useState(showWelcome);
  const supabase = createClient();

  async function handleClose() {
    setModalOpen(false);
    await supabase.from("users").update({ welcome_seen: true }).eq("id", userId);
  }

  function handleReopen() {
    setModalOpen(true);
  }

  return (
    <>
      {modalOpen && (
        <WelcomeModal
          firstName={firstName}
          videoUrl="/scorm/introduction-generale-scorm1.2/scormcontent/assets/V4_PLACE%20DE%20LA%20REPUBLIQUE%20-%20Programme%2015_Introduction%20g%C3%A9n%C3%A9rale.mp4"
          onClose={handleClose}
        />
      )}
      {!modalOpen && (
        <button
          onClick={handleReopen}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: "#373b94",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(55,59,148,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "transform .2s, box-shadow .2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(55,59,148,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(55,59,148,0.3)";
          }}
          title="Revoir le mot d'accueil"
        >
          🎬 Mot d'accueil
        </button>
      )}
      {children}
    </>
  );
}
