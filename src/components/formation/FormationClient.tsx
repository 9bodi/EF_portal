"use client";

import { useState, useEffect } from "react";
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
    // Marquer que le welcome a été vu
    await supabase.from("users").update({ welcome_seen: true }).eq("id", userId);
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
      {children}
    </>
  );
}
