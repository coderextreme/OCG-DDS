# Éditeur de Graphes Distribués Accessible à Capacités Objet (Français)

**Projet :** Lattice · **Dépôt :** <https://github.com/coderextreme/OCG-DDS> · **Contact :** `yottzumm@gmail.com`

Cette application a été développée rapidement avec l'aide de l'IA. Merci à toutes les personnes dont les travaux ont rendu cela possible. L'auteur ne lit pas encore le Braille ni SignWriting et invite les communautés aveugles, sourdaveugles et sourdes à tester l'outil ou à co-diriger le projet.

## Accessibilité (Aveugles, Sourdaveugles, Sourds)
- **Lecteurs d'écran et clavier :** Accès direct aux modules (`Alt+1`–`Alt+4`), console d'édition (`Alt+E`), navigation linéaire (`ArrowLeft`/`ArrowRight`, `Home`/`End`), aide clavier (`?`) et annonces `aria-live`.
- **Braille (lecture & saisie) :** Tampon **Braille** 40 cellules avec **Show Dots** (Braille Unicode `⠁`–`⠿`) et clavier Perkins 6 points (`F D S` / `J K L`, `Espace`, `Retour arrière`, `Entrée`).
- **Protactile (PT) :** Sans audio, mode **High Contrast**, zones de contact (`Zone A/B/C`), tracés topographiques et cadences haptiques (**Pulse Haptics**).
- **Langues des signes & SignWriting :** Sortie **ASL** et **SignWriting** (`FSW`, `Unicode SWU`, boîtes SVG 2D) pour `LSF`, `ASL`, `BSL`, `DGS`, `LSE`, `LIBRAS`, `JSL`, `LSM`, `Auslan`, `IS` ou toute langue des signes personnalisée (ex. `LSQ`).

## Installation
Prérequis : Node.js avec `npm` (<https://nodejs.org/>) et Git.
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
Production :
```bash
npm run build
npm run preview
```

## Avertissements
L'état du graphe distribué vit actuellement en mémoire locale du navigateur (sans persistance distante pour l'instant). Une revue de sécurité du code est la bienvenue.
