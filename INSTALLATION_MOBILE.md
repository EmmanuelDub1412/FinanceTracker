# Installer FinTrack sur ton téléphone

FinTrack est maintenant une PWA (Progressive Web App). Une fois déployée, tu peux l'installer comme une vraie app, avec icône et plein écran, sans passer par l'App Store ou le Play Store.

## Après le déploiement

Le déploiement suit ton workflow habituel :

```
git add .
git commit -m "Ajout support PWA (installable iOS/Android)"
git push
```

Attends ~2 min que GitHub Actions termine le build, puis vide le cache une fois sur le site (`Ctrl+Shift+R` sur desktop) pour être sûr de récupérer le nouveau `manifest.json` et le service worker.

## Sur iPhone (Safari uniquement — pas Chrome)

1. Ouvre `emmanueldub1412.github.io/FinanceTracker` dans **Safari**.
2. Appuie sur l'icône de partage (carré avec flèche vers le haut).
3. Fais défiler et choisis **"Sur l'écran d'accueil"**.
4. Confirme le nom "FinTrack" et appuie sur **Ajouter**.

L'app apparaît maintenant comme une icône normale, s'ouvre en plein écran sans barre d'adresse Safari.

## Sur Android (Chrome)

1. Ouvre le site dans **Chrome**.
2. Chrome affiche automatiquement une bannière **"Installer l'application"** en bas — appuie dessus.
   - Si la bannière n'apparaît pas : menu ⋮ (trois points) → **"Installer l'application"** ou **"Ajouter à l'écran d'accueil"**.
3. Confirme.

## Points importants

- La connexion Google (compte, Sheets) fonctionne normalement dans l'app installée — le flux OAuth ouvre une fenêtre popup standard, pas de changement nécessaire.
- Le service worker met en cache l'interface pour un chargement plus rapide et un accès partiel hors-ligne, mais les données viennent toujours de Google Sheets donc une connexion internet reste nécessaire pour lire/écrire les transactions.
- Toute mise à jour poussée sur GitHub Pages sera automatiquement récupérée à la prochaine ouverture de l'app (peut nécessiter de fermer et rouvrir l'app une fois).
- Aucun compte développeur Apple/Google requis avec cette approche — c'est gratuit et immédiat. Si un jour tu veux publier sur les stores officiels, il faudra passer par une étape supplémentaire (Capacitor + comptes développeurs).
