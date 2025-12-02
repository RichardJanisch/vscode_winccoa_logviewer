# WinCC OA LogViewer

A VS Code extension for viewing and analyzing WinCC OA log files in real-time.

## Features

- Real-time log file monitoring
- Syntax highlighting for log events
- Filter and search capabilities
- Click on file paths to open files directly in editor

## Usage

### As standalone extension:
- Open Command Palette (`Ctrl+Shift+P`)
- Run `WinCC OA: Open LogViewer`

### From other extensions:
```typescript
vscode.commands.executeCommand('winccoa-logviewer.open', logPath);
```

## API

The extension exposes a command that can be called from other extensions:

**Command:** `winccoa-logviewer.open`

**Parameters:**
- `logPath` (optional): Path to the log directory to watch. If not provided, the viewer opens without auto-watching.

## Development

```bash
npm install
npm run compile
```

Press F5 to debug the extension.
