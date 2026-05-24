# 💎 FinTrack Haiti — v2 (Google Sheets)

Application de gestion financière personnelle HTG & USD.
**Zéro Firebase. Zéro backend. Vos données restent dans votre Google Drive.**

---

## Architecture

```
Navigateur (GitHub Pages)  ←→  Google Sheets API  ←→  Votre Google Sheet
         ↑
   Auth Google OAuth
```

---

## 🚀 Mise en ligne — Guide complet

### ÉTAPE 1 — Mettre le code sur GitHub (5 min)

1. Créer un compte sur **github.com** si vous n'en avez pas
2. Cliquer **New repository** → Nom : `fintrack-haiti` → Public → **Create**
3. Extraire le ZIP téléchargé sur votre ordinateur
4. Dans le dossier extrait, ouvrir un terminal :

```bash
git init
git add .
git commit -m "FinTrack Haiti v2"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/fintrack-haiti.git
git push -u origin main
```

5. Sur GitHub → **Settings** → **Pages** → Source : **GitHub Actions**

L'app se déploie automatiquement à chaque push. URL : `https://VOTRE_USERNAME.github.io/fintrack-haiti`

---

### ÉTAPE 2 — Créer le Client ID Google (10 min)

L'app inclut un **guide interactif** qui vous explique chaque étape visuellement au premier démarrage.

En résumé :

1. Aller sur **console.cloud.google.com**
2. Créer un projet `fintrack-haiti`
3. Activer **Google Sheets API** + **Google Drive API**
4. Créer un **ID client OAuth** (type : Application Web)
5. Ajouter votre URL GitHub Pages dans « Origines JavaScript autorisées »
6. Copier votre **Client ID** et le coller dans l'app au premier démarrage

---

### ÉTAPE 3 — Premier lancement

1. Aller sur `https://VOTRE_USERNAME.github.io/fintrack-haiti`
2. L'app affiche le guide de configuration
3. Coller votre Client ID → Se connecter avec Google
4. Choisir **"Créer mon Google Sheet"** (1 clic, automatique)
5. ✅ L'app est prête !

---

## Structure du projet

```
src/
├── components/
│   ├── SetupWizard.js      ← Guide de config intégré (affiché au 1er démarrage)
│   ├── SheetConnect.js     ← Connexion/création du Google Sheet
│   ├── Dashboard.js        ← Tableau de bord, KPIs, graphiques
│   ├── Accounts.js         ← Gestion des comptes & cartes de crédit
│   ├── Transactions.js     ← Journal, filtres, saisie
│   ├── Savings.js          ← Objectifs d'épargne + projections
│   ├── LoanSimulator.js    ← Simulateur de prêt complet
│   └── Settings.js         ← Paramètres, taux de change
├── hooks/
│   └── useFinTrack.js      ← Toute la logique auth + données
├── utils/
│   └── finance.js          ← Calculs financiers, formatage
├── sheetsApi.js            ← Couche Google Sheets API v4
├── styles.css              ← Thème sombre or
└── App.js                  ← Shell principal
```

## Fonctionnalités

| Module | Détail |
|--------|--------|
| 🏦 Comptes | Banque HTG/USD, cartes crédit avec limite, cash, épargne |
| 📊 Dashboard | KPIs temps réel, graphiques 6 mois, répartition catégories |
| 📄 Transactions | Saisie, filtres, recherche, catégorisation |
| 🎯 Épargne | Objectifs + projection 36 mois avec intérêts composés |
| 🔔 Alertes | Seuil de solde / disponible carte configurable |
| 🧮 Simulateur | Amortissement, tableau complet, comparaison 2 scénarios |
| 📱 Responsive | Fonctionne sur mobile |

## Stack

React 18 · Google Sheets API v4 · Google OAuth 2.0 · Recharts · GitHub Pages
