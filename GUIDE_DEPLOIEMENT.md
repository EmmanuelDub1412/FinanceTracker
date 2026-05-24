# 🚀 FinTrack Haiti — Guide de déploiement complet
## (Zéro configuration, zéro Firebase, 100% GitHub)

---

## ✅ Ce dont tu as besoin
- Un ordinateur avec accès à internet
- Un navigateur Chrome ou Firefox
- 20 à 30 minutes

---

## ÉTAPE 1 — Créer un compte GitHub
*(Si tu as déjà un compte, passe à l'Étape 2)*

1. Va sur **https://github.com**
2. Clique sur **"Sign up"** (en haut à droite)
3. Remplis le formulaire :
   - **Username** : choisis un nom simple (ex: `emmanueldub` ou `fintrack-ht`)
   - **Email** : ton adresse email
   - **Password** : un mot de passe fort
4. Vérifie ton email et confirme ton compte
5. Connecte-toi sur github.com

---

## ÉTAPE 2 — Créer un nouveau repository (repo)

Un "repository" = un dossier de projet en ligne.

1. Sur github.com, clique sur le **"+" en haut à droite** → **"New repository"**
2. Remplis le formulaire :
   - **Repository name** : `fintrack-haiti`
   - **Description** : `Application gestion finances personnelles HTG/USD`
   - **Visibilité** : Choisis **Public** *(obligatoire pour GitHub Pages gratuit)*
   - ✅ Coche **"Add a README file"**
3. Clique sur **"Create repository"**
4. Tu arrives sur la page de ton repo — copie l'URL (format: `https://github.com/TON_USERNAME/fintrack-haiti`)

---

## ÉTAPE 3 — Télécharger et installer les outils

### 3a. Installer Node.js
Node.js est le moteur qui fait fonctionner React.

1. Va sur **https://nodejs.org**
2. Télécharge la version **LTS** (bouton vert à gauche)
3. Lance l'installateur et clique "Next" jusqu'à la fin
4. Pour vérifier : ouvre **Terminal** (Mac) ou **Invite de commandes** (Windows) et tape :
   ```
   node --version
   ```
   Tu dois voir quelque chose comme `v20.x.x` ✅

### 3b. Installer Git
Git est le logiciel qui envoie le code sur GitHub.

- **Windows** : Télécharge sur **https://git-scm.com** → "Download for Windows" → installe
- **Mac** : Tape dans Terminal : `git --version` (s'il n'est pas là, il te propose de l'installer)

Pour vérifier : tape `git --version` → tu dois voir `git version 2.x.x` ✅

---

## ÉTAPE 4 — Préparer le code de l'application

1. **Télécharge le fichier ZIP** de l'application (le fichier `fintrack_github.zip`)
2. **Extrais le ZIP** dans un dossier facile à trouver
   - Windows : clic droit → "Extraire tout"
   - Mac : double-clic sur le ZIP
3. Tu dois avoir un dossier appelé `fintrack` avec ces fichiers dedans :
   ```
   fintrack/
   ├── src/
   ├── public/
   ├── package.json
   └── ...
   ```

---

## ÉTAPE 5 — Mettre en ligne sur GitHub (upload)

### 5a. Ouvre le Terminal dans le bon dossier

**Windows :**
- Ouvre le dossier `fintrack` dans l'Explorateur
- Dans la barre d'adresse, tape `cmd` et appuie sur Entrée

**Mac :**
- Ouvre Terminal
- Tape `cd ` (avec espace), puis fais glisser le dossier `fintrack` dans le Terminal
- Appuie sur Entrée

### 5b. Tape ces commandes une par une

*(Remplace `TON_USERNAME` par ton vrai nom d'utilisateur GitHub)*

```bash
# 1. Initialiser Git dans le dossier
git init

# 2. Dire à Git qui tu es (une seule fois)
git config user.email "ton@email.com"
git config user.name "Ton Nom"

# 3. Connecter au repo GitHub
git remote add origin https://github.com/TON_USERNAME/fintrack-haiti.git

# 4. Télécharger ce qui existe déjà (le README)
git pull origin main

# 5. Ajouter tous les fichiers
git add .

# 6. Créer un "commit" (une sauvegarde)
git commit -m "Ajout application FinTrack Haiti"

# 7. Envoyer sur GitHub
git push origin main
```

**Si GitHub te demande un mot de passe :**
- Depuis 2021, GitHub n'accepte plus les mots de passe directs
- Va sur **github.com → Paramètres → Developer settings → Personal access tokens → Tokens (classic)**
- Clique **"Generate new token"** → coche **"repo"** → génère → copie le token
- Utilise ce token à la place de ton mot de passe

---

## ÉTAPE 6 — Activer GitHub Pages (mettre en ligne)

1. Va sur ton repo : `https://github.com/TON_USERNAME/fintrack-haiti`
2. Clique sur **"Settings"** (onglet en haut)
3. Dans le menu gauche, clique **"Pages"**
4. Sous **"Build and deployment"** :
   - **Source** : sélectionne **"GitHub Actions"**
5. Clique **"Save"**

---

## ÉTAPE 7 — Configurer le déploiement automatique

Crée le fichier de déploiement automatique :

Dans ton Terminal (toujours dans le dossier `fintrack`) :

**Windows :**
```
mkdir .github\workflows
notepad .github\workflows\deploy.yml
```

**Mac :**
```
mkdir -p .github/workflows
nano .github/workflows/deploy.yml
```

Colle ce contenu :

```yaml
name: Deploy FinTrack to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm install --legacy-peer-deps
      
      - name: Install ajv fix
        run: npm install ajv@8 --legacy-peer-deps
      
      - name: Build
        run: npm run build
        env:
          CI: false
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
```

Sauvegarde le fichier (Ctrl+S ou Cmd+S), puis dans le Terminal :

```bash
git add .
git commit -m "Ajout déploiement automatique"
git push origin main
```

---

## ÉTAPE 8 — Attendre le déploiement

1. Va sur `https://github.com/TON_USERNAME/fintrack-haiti/actions`
2. Tu verras un processus en cours (icône orange ⏳)
3. Attend 2-3 minutes qu'il devienne vert ✅
4. Si rouge ❌ → clique dessus pour voir l'erreur (souvent un espace ou une faute de frappe)

---

## ÉTAPE 9 — Accéder à ton application ! 🎉

Ton application est en ligne à :

```
https://TON_USERNAME.github.io/fintrack-haiti
```

**Exemple :** `https://emmanueldub.github.io/fintrack-haiti`

📌 **Marque cette URL en favori sur ton téléphone et ton ordinateur !**

---

## 🔄 Comment mettre à jour l'application plus tard

Chaque fois que tu veux changer quelque chose dans le code :

```bash
# Dans le dossier fintrack :
git add .
git commit -m "Description de ta modification"
git push origin main
```

GitHub recompile automatiquement et met à jour l'URL en 2-3 minutes.

---

## 💾 Sauvegarde de tes données

L'application stocke tout dans ton navigateur. Pour ne pas perdre tes données :

1. Dans l'app, clique sur **"💾 Backup"** en haut à droite
2. Un fichier `.json` se télécharge automatiquement
3. Garde-le dans Google Drive ou sur une clé USB

Pour **restaurer** : va dans **Paramètres → Importer un backup** et sélectionne ton fichier.

---

## ❓ Problèmes fréquents

| Problème | Solution |
|---|---|
| `git: command not found` | Git n'est pas installé → Étape 3b |
| `node: command not found` | Node.js n'est pas installé → Étape 3a |
| `remote: Permission denied` | Utilise un token GitHub → Étape 5b |
| La page affiche `404` | Attends 5 min, vérifie que GitHub Pages est activé → Étape 6 |
| L'app est blanche | Ouvre la console (F12) et envoie le message d'erreur |
| `git push` demande un mdp | Utilise le token personnel → Étape 5b |

---

## 📞 Résumé visuel

```
Ton ordinateur                    GitHub                         Internet
─────────────                     ──────                         ───────
[Dossier fintrack]  ──git push──▶ [Repo fintrack-haiti]
                                        │
                                        ▼
                                  [GitHub Actions]
                                  compile l'app
                                        │
                                        ▼
                                  [GitHub Pages]  ──────────▶  🌐 URL publique
                                                         https://TON_USERNAME.github.io/fintrack-haiti
```

---

*Guide créé pour Emmanuel J. Dubuisson — FinTrack Haiti v1.0*
