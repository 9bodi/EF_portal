"use client";

import { useState } from "react";

interface Props {
  firstName: string;
  videoUrl: string;
  onClose: () => void;
}

export default function WelcomeModal({ firstName, videoUrl, onClose }: Props) {
  const [step, setStep] = useState<"video" | "text">("video");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .wm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: wmFadeIn 0.3s ease;
        }
        @keyframes wmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .wm-card {
          background: #fff;
          border-radius: 20px;
          max-width: 680px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 80px rgba(0,0,0,0.4);
          animation: wmSlideUp 0.3s ease;
        }
        @keyframes wmSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .wm-header {
          background: #373b94;
          border-radius: 20px 20px 0 0;
          padding: 28px 32px 20px;
          text-align: center;
        }
        .wm-header h2 {
          color: #fff;
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 4px;
        }
        .wm-header p {
          color: rgba(255,255,255,0.6);
          font-size: 14px;
          margin: 0;
        }
        .wm-body {
          padding: 28px 32px;
        }
        .wm-video-wrap {
          border-radius: 12px;
          overflow: hidden;
          background: #000;
          margin-bottom: 24px;
        }
        .wm-video-wrap video {
          width: 100%;
          display: block;
        }
        .wm-text {
          color: #374151;
          font-size: 14px;
          line-height: 1.7;
        }
        .wm-text p {
          margin-bottom: 12px;
        }
        .wm-list {
          margin: 12px 0 0;
          padding: 0;
          list-style: none;
        }
        .wm-list li {
          padding: 6px 0 6px 24px;
          position: relative;
          font-size: 14px;
          color: #374151;
        }
        .wm-list li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #373b94;
          font-weight: 700;
        }
        .wm-btn {
          display: block;
          width: 100%;
          padding: 16px;
          background: #373b94;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 24px;
          font-family: 'DM Sans', sans-serif;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .wm-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(55,59,148,0.3);
        }
        @media (max-width: 640px) {
          .wm-card { max-width: 100%; }
          .wm-header { padding: 20px 20px 16px; }
          .wm-header h2 { font-size: 18px; }
          .wm-body { padding: 20px; }
        }
      `}} />

      <div className="wm-overlay">
        <div className="wm-card">
          <div className="wm-header">
            <h2>Bienvenue {firstName} !</h2>
            <p>Votre formation en communication d&apos;élu(e)</p>
          </div>

          <div className="wm-body">
            <div className="wm-video-wrap">
              <video
                controls
                autoPlay
                playsInline
                src={videoUrl}
              >
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            </div>

            <div className="wm-text">
              <p>
                Apprenez à <strong>bien gérer votre image et votre communication d&apos;élu(e) local(e)</strong>. 
                Savoir communiquer n&apos;est pas inné, mais c&apos;est indispensable et à la portée de tous. 
                Avec de la méthode, de bons outils et de l&apos;entraînement, vous pourrez communiquer en toutes circonstances.
              </p>
              <p>Au travers de vidéos, d&apos;activités interactives et de quiz, vous apprendrez à :</p>
              <ul className="wm-list">
                <li>Saisir les spécificités de la communication politique des élus locaux</li>
                <li>Construire une stratégie de communication performante</li>
                <li>Mobiliser les bons outils et les techniques adaptées</li>
                <li>Prendre la parole pour défendre vos projets et parler au nom de votre collectivité</li>
              </ul>
            </div>

            <button className="wm-btn" onClick={onClose}>
              Démarrer ma formation →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
