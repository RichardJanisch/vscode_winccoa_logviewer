# WinCC OA LogViewer - Standalone Extension

## ✅ Fertiggestellt

Die LogViewer Extension wurde erfolgreich extrahiert und ist jetzt eigenständig.

## 📁 Struktur

```
packages/logviewer/
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── logViewerPanel.ts     # Webview panel management
│   ├── logFileWatcher.ts     # File system watching logic
│   ├── logParser.ts          # PVSS_II.log parser
│   └── logEvent.ts           # Type definitions
├── webview/                  # React frontend
│   ├── src/
│   └── vite.config.ts
├── .vscode/
│   ├── launch.json           # F5 debugging config
│   └── tasks.json            # Build tasks
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Usage

### Als eigenständige Extension:

1. Öffne den Ordner in VS Code:
   ```bash
   code packages/logviewer
   ```

2. Drücke **F5** zum Debuggen

3. In der Extension Development Host Instanz:
   - Öffne Command Palette: `Ctrl+Shift+P`
   - Run: `WinCC OA: Open LogViewer`

### Aus anderen Extensions aufrufen:

```typescript
// Mit Log-Pfad
vscode.commands.executeCommand('winccoa-logviewer.open', '/path/to/logs');

// Ohne Log-Pfad (User muss manuell Pfad wählen oder mock data wird verwendet)
vscode.commands.executeCommand('winccoa-logviewer.open');
```

### Aus der Core Extension (Button/Menu):

In `package.json` der Core Extension:

```json
{
  "contributes": {
    "commands": [{
      "command": "winccoa-core.openLogs",
      "title": "Open Logs"
    }]
  }
}
```

In der Core Extension Code:

```typescript
vscode.commands.registerCommand('winccoa-core.openLogs', async () => {
  const projectInfo = await getProjectInfo();
  
  // Call the LogViewer extension command
  vscode.commands.executeCommand(
    'winccoa-logviewer.open', 
    projectInfo.logPath
  );
});
```

## 🔧 Build

```bash
# Im packages/logviewer Ordner
npm install
npm run compile
```

Dies kompiliert sowohl die Extension (TypeScript) als auch das Webview (React/Vite).

## 📦 Als Extension Pack einbinden

Später kannst du ein Extension Pack erstellen:

**extension-pack/package.json:**
```json
{
  "name": "winccoa-extension-pack",
  "displayName": "WinCC OA Extension Pack",
  "extensionPack": [
    "winccoa-tools.winccoa-core",
    "winccoa-tools.winccoa-logviewer"
  ]
}
```

## ✅ Antwort auf deine Frage:

**Ja!** Der Command `winccoa-logviewer.open` ist derselbe Befehl, den du:
- Aus der Command Palette aufrufen kannst
- An ein Button Event in der Core Extension hängen kannst
- Programmatisch aus jeder anderen Extension aufrufen kannst

Es ist ein **öffentlicher VS Code Command**, der von überall aufgerufen werden kann.
