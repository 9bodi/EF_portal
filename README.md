@'
<p align="center">
  <img src="public/img/LOGO_ELU-FORMATION_RVB.png" alt="Élu Formation" width="280" />
</p>

<h1 align="center">Élu Formation — Portail de Formation</h1>

<p align="center">
  Plateforme LMS sur mesure pour la formation des élus locaux.<br/>
  Lecteur SCORM 1.2 intégré · Back-office admin · Suivi de progression
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss" />
</p>

---

## Fonctionnalités

### Espace Apprenant
- **Authentification sécurisée** — connexion, première connexion (changement de mot de passe obligatoire), mot de passe oublié, réinitialisation par email
- **Dashboard de progression** — donut animé, barre de progression, pourcentage de complétion
- **Parcours de formation** — grille en S avec déblocage séquentiel des modules (le suivant s'ouvre dès l'accès au précédent)
- **Lecteur SCORM 1.2** — intégration Articulate Rise en iframe avec API LMS complète (`LMSInitialize`, `LMSSetValue`, `LMSCommit`, `LMSFinish`)
- **Sauvegarde automatique** — progression, temps passé, scores et statuts persistés dans Supabase

### Back-office Admin
- **Tableau de bord** — statistiques globales (apprenants inscrits, actifs, complétion moyenne, chapitres)
- **Gestion des apprenants** — création manuelle, import CSV en masse, envoi automatique d'email de bienvenue avec mot de passe temporaire
- **Filtres avancés** — recherche par nom/prénom/email, code postal, groupe, financement, date d'inscription
- **Exports professionnels** — PDF avec logo et mise en page soignée, CSV avec séparateur Excel-compatible
- **Détail par apprenant** — vue chapitre par chapitre (statut, temps, score, dates)
- **Déblocage admin** — possibilité de marquer manuellement un module comme terminé

### Sécurité
- **Row Level Security (RLS)** sur Supabase
- **Middleware Next.js** — protection des routes par rôle (admin / learner)
- **Service Role Key** côté serveur uniquement

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Auth & BDD | Supabase (Auth + PostgreSQL) |
| SCORM | API LMS custom, iframe, postMessage |
| Emails | Resend |
| PDF | jsPDF + jspdf-autotable |

---

## Architecture du projet

Copy
src/ ├── app/ │ ├── (protected)/ │ │ ├── admin/ # Dashboard admin │ │ │ └── learner/[learnerId] # Détail apprenant │ │ └── formation/ # Dashboard apprenant │ │ └── [chapterId] # Lecteur SCORM │ ├── api/ │ │ ├── admin/ │ │ │ ├── create-learner/ # Création manuelle │ │ │ ├── import-learners/ # Import CSV │ │ │ ├── unlock-chapter/ # Déblocage admin │ │ │ └── first-login-done/ # Flag mot de passe changé │ │ ├── auth/ │ │ │ ├── confirm/ # Vérification token email │ │ │ ├── logout/ # Déconnexion │ │ │ └── reset-password/ # Envoi email reset │ │ └── scorm/ # Sauvegarde progression SCORM │ ├── first-login/ # Changement mot de passe initial │ ├── forgot-password/ # Demande de réinitialisation │ ├── login/ # Connexion │ └── reset-password/ # Nouveau mot de passe ├── components/ │ ├── admin/ │ │ ├── CreateLearnerForm.tsx │ │ ├── ImportLearnersForm.tsx │ │ ├── LearnersTable.tsx │ │ └── UnlockButton.tsx │ └── formation/ │ ├── ChapterList.tsx │ └── ScormPlayer.tsx ├── lib/ │ ├── email.ts # Templates emails (Resend) │ ├── logo.ts # Logo base64 pour emails/PDF │ └── supabase/ │ ├── client.ts # Client navigateur │ └── server.ts # Client serveur + admin └── middleware.ts # Protection des routes public/ ├── img/ # Logos └── scorm/ # Packages SCORM (12 modules)

Copy
---

## Installation

### Prérequis
- Node.js 18+
- Compte [Supabase](https://supabase.com)
- Clé API [Resend](https://resend.com) (optionnel, pour les emails)

### Mise en place

```bash
# Cloner le repo
git clone https://github.com/9bodi/EF_portal.git
cd EF_portal

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
Variables d'environnement
CopyNEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
Lancer le serveur
Copynpm run dev
L'application est accessible sur http://localhost:3000.

Base de données
Tables principales
Table	Description
users	Profils (nom, email, rôle, commune, financement, groupe)
chapters	Liste des chapitres (titre, ordre, chemin SCORM)
scorm_progress	Progression par apprenant et par chapitre
Rôles
admin — accès au back-office, gestion des apprenants
learner — accès à la formation uniquement
Déploiement
Recommandé : VPS (Hetzner, OVH, Scaleway) pour gérer les ~1 GB de packages SCORM avec bande passante illimitée.

##Copy

npm run build
npm run start

##
Licence
Projet privé — © Élu Formation. Tous droits réservés.