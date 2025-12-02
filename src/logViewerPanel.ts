import * as vscode from 'vscode';
import { LogFileWatcher } from './logFileWatcher';
import { LogEvent } from './logEvent';

export class LogViewerPanel {
    public static currentPanel: LogViewerPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _watcher: LogFileWatcher | undefined;

    // ---------- Factory ----------
    public static createOrShow(extensionUri: vscode.Uri, logPath?: string) {
        // Always open in a new column to the side
        let column: vscode.ViewColumn;
        
        if (vscode.window.activeTextEditor) {
            // If there's an active editor, open beside it
            const activeColumn = vscode.window.activeTextEditor.viewColumn || vscode.ViewColumn.One;
            
            // Determine the next column
            if (activeColumn === vscode.ViewColumn.One) {
                column = vscode.ViewColumn.Two;
            } else if (activeColumn === vscode.ViewColumn.Two) {
                column = vscode.ViewColumn.Three;
            } else {
                // If already in column 3 or beyond, open beside
                column = vscode.ViewColumn.Beside;
            }
        } else {
            // No active editor, open in column 2
            column = vscode.ViewColumn.Two;
        }

        // Wenn es schon ein Panel gibt → nur zeigen
        if (LogViewerPanel.currentPanel) {
            LogViewerPanel.currentPanel._panel.reveal(column);
            
            // If new logPath provided, update watcher
            if (logPath) {
                LogViewerPanel.currentPanel.startWatching(logPath);
            }
            return;
        }

        // Neues Panel erzeugen
        const panel = vscode.window.createWebviewPanel(
            'winccoaLogViewer',
            'WinCC OA Log Viewer',
            column,
            {
                enableScripts: true, // React Bundle braucht JS
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'dist', 'webview'),
                ],
            }
        );

        LogViewerPanel.currentPanel = new LogViewerPanel(panel, extensionUri, logPath);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, logPath?: string) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Message Handler für File-Clicks
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'openFile':
                        this._openFile(message.filePath, message.line);
                        return;
                    case 'ready':
                        // Webview is ready, start watching if logPath provided
                        if (logPath) {
                            this.startWatching(logPath);
                        }
                        return;
                    case 'setPaused':
                        this.setPaused(message.paused);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    /**
     * Set paused state of the watcher
     */
    public setPaused(paused: boolean): void {
        if (this._watcher) {
            if (paused) {
                this._watcher.pause();
            } else {
                this._watcher.resume();
            }
        }
    }

    /**
     * Start watching log directory
     */
    public async startWatching(logPath: string): Promise<void> {
        // Stop existing watcher if any
        if (this._watcher) {
            this._watcher.stop();
        }

        try {
            this._watcher = new LogFileWatcher(logPath, (event: LogEvent) => {
                // Send event to webview
                this._panel.webview.postMessage({
                    command: 'newLogEvent',
                    event: event
                });
            });

            await this._watcher.start();
            
            vscode.window.showInformationMessage(`Watching logs in: ${logPath}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to watch logs: ${error}`);
        }
    }

    private async _openFile(filePath: string, line?: number) {
        try {
            // Versuche die Datei zu öffnen
            const uri = vscode.Uri.file(filePath);
            const doc = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(doc, {
                viewColumn: vscode.ViewColumn.One,
                preview: false
            });

            // Wenn eine Zeile angegeben ist, springe dorthin
            if (line !== undefined && line > 0) {
                const position = new vscode.Position(line - 1, 0);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(
                    new vscode.Range(position, position),
                    vscode.TextEditorRevealType.InCenter
                );
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Could not open file: ${filePath}`);
        }
    }

    private _update() {
        const webview = this._panel.webview;
        const html = this._getHtmlForWebview(webview);
        this._panel.webview.html = html;
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Basis-Ordner des gebauten React-Bundles
        const webviewRoot = vscode.Uri.joinPath(
            this._extensionUri,
            'dist',
            'webview'
        );

        // Scripts and styles from vite build
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(webviewRoot, 'main.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(webviewRoot, 'index.css')
        );

        const csp = [
            "default-src 'none';",
            `img-src ${webview.cspSource} https:;`,
            `style-src ${webview.cspSource} 'unsafe-inline';`,
            `script-src ${webview.cspSource};`,
        ].join(' ');

        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WinCC OA Log Viewer</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="${scriptUri}"></script>
</body>
</html>`;
    }

    public dispose() {
        LogViewerPanel.currentPanel = undefined;

        // Stop watcher
        if (this._watcher) {
            this._watcher.dispose();
            this._watcher = undefined;
        }

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
