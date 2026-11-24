# Générer le véritable installeur Windows (`.exe`) — CHREIN DPI

Le projet intègre la configuration complète **Electron + NSIS** (`electron/main.cjs`, `electron/preload.cjs`, `electron-builder.yml`, icônes `build/icon.ico` et `build/icon.png`) permettant de produire un véritable assistant d'installation Windows (`CHREIN-DPI-Setup-1.0.0.exe`).

## Option 1 : Compiler le `.exe` directement sur un PC Windows

Prérequis : **Node.js 20+** installé sur Windows.

```bash
# 1. Installer les dépendances de l'application
npm install

# 2. Installer Electron et Electron Builder (si non encore présents localement)
npm install --save-dev electron@35.1.5 electron-builder@26.0.12

# 3. Compiler l'application web + serveur et générer l'installeur NSIS (.exe)
npm run dist:win
```

Le fichier d'installation généré se trouve dans :
`dist-electron/CHREIN-DPI-Setup-1.0.0.exe`

## Option 2 : Générer le `.exe` dans le cloud via GitHub Actions (sans PC Windows)

1. Poussez ce dépôt sur GitHub.
2. Ouvrez l'onglet **Actions → Build Windows Installer (.exe)** puis cliquez sur **Run workflow**.
3. Téléchargez l'artefact **`CHREIN-DPI-Windows-Installer`** contenant le fichier `.exe` prêt à installer.

## Configuration Hostinger MySQL & Gemini API sur le poste installé

Lors du premier lancement sur Windows, l'application crée automatiquement un fichier `.env` dans :
`%APPDATA%\CHREIN DPI Pneumologie\.env` (ou lit un fichier `.env` placé à côté de l'exécutable).
Renseignez-y `GEMINI_API_KEY` et vos paramètres `HOSTINGER_DB_*`. Le microphone est autorisé nativement sans blocage navigateur.
