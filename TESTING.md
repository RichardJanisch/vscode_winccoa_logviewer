# Testing Guide - WinCC OA LogViewer Extension

## Quick Start

### 1. Öffne die Extension in VS Code

```bash
cd /home/testus/repos/winccoa_vscode_tools/packages/logviewer
code .
```

### 2. Drücke F5

Dies startet die Extension in einem neuen VS Code Fenster (Extension Development Host).

### 3. Öffne den LogViewer

In der neuen VS Code Instanz:
- `Ctrl+Shift+P` → `WinCC OA: Open LogViewer`

Der LogViewer sollte sich in einem neuen Panel öffnen.

## Test-Szenarien

### Szenario 1: LogViewer ohne Log-Pfad öffnen
```typescript
// Command Palette → "WinCC OA: Open LogViewer"
// Zeigt Mock-Daten oder Warning
```

### Szenario 2: LogViewer mit Log-Pfad öffnen
```typescript
// In der Developer Console (Ctrl+Shift+I):
vscode.commands.executeCommand(
  'winccoa-logviewer.open', 
  '/path/to/your/winccoa/logs'
);
```

### Szenario 3: Von einer anderen Extension aufrufen
```typescript
// In extension.ts einer anderen Extension:
vscode.commands.executeCommand('winccoa-logviewer.open', logPath);
```

## Build-Befehle

```bash
# Kompiliere alles (Extension + Webview)
npm run compile

# Watch-Modus für Extension
npm run watch

# Nur Webview bauen
npm run build:webview

# Nur Webview entwickeln (mit Hot Reload)
cd webview && npm run dev
```

## Debug-Tipps

### Extension Backend debuggen:
1. Setze Breakpoints in `src/extension.ts` oder `src/logViewerPanel.ts`
2. Drücke F5
3. Führe den Command aus

### Webview Frontend debuggen:
1. Im Extension Development Host: Öffne Developer Tools (`Ctrl+Shift+I`)
2. Im Developer Tools Fenster: `Ctrl+Shift+P` → "Developer: Open Webview Developer Tools"
3. Jetzt kannst du React Component Code debuggen

### Console Logs ansehen:
- **Extension Backend**: Developer Tools → Console Tab
- **Webview Frontend**: Webview Developer Tools → Console Tab

## Verzeichnis-Struktur nach Build

```
packages/logviewer/
├── dist/
│   ├── extension.js         # Kompilierte Extension
│   ├── logViewerPanel.js
│   ├── logFileWatcher.js
│   ├── logParser.js
│   ├── logEvent.js
│   └── webview/
│       ├── index.html       # Webview HTML
│       ├── index.css        # Webview Styles
│       └── main.js          # React Bundle
├── src/                     # Source Code
└── webview/                 # React Source
```

## Troubleshooting

### Problem: "Command not found"
- Stelle sicher, dass die Extension im Development Host aktiv ist
- Check in Output → "Extension Host": sollte "WinCC OA LogViewer Extension activated" zeigen

### Problem: Webview zeigt nichts an
- Überprüfe `dist/webview/` - sollte `main.js`, `index.css`, `index.html` enthalten
- Laufe `npm run build:webview` erneut
- Check Browser Console für Fehler

### Problem: TypeScript Fehler
- Laufe `npm install` im Root-Ordner
- Check `tsconfig.json` Pfade

## Next Steps

Nach erfolgreichem Test:
1. Package erstellen: `npm run package` (erstellt `.vsix` Datei)
2. Im Marketplace publishen oder
3. Als Teil eines Extension Packs einbinden
