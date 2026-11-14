# Accessible Object-Capability Distributed Graph Editor

I vibe-coded this application application in a matter of hours.  Thanks for the hard work that made this possible.  I can't read Braille or SignWriting, so I don't know how this will make you feel.

If someone wants to help lead this project, contact me at yottzumm@gmail.com

Translations of this README.md are welcome, or I could use AI/LLM.

## Setup

Get Node.js with NPM, Git or GitHub Desktop (no instructions, apologies).

https://nodejs.org/

```bash
git clone https://github.com/coderextreme/OCG-DDS
```
# Development
```bash
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
# go to link in terminal
```

## Production
```bash
npm run build
npm run preview
# go to link in terminal
```

The SignWriting log is on the right side or bottom of the page, depending on size and orientation of your screen.  There's a choice of language, and I don't know about translation to SignWriting.

You access Braille by pressing Braille buttons, then pressing the "Show dots."  Apparently, Braille input might be available, I don't know the status.  Please test and give feedback.

As for other accessiblity, I don't know yet.

## Caveats
I don't know if this is actually live or the graph is stored at this point.  So far, I have the front end kind of working.  The code needs to be reviewed for vulnerabilities
