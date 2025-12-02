import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { LogViewerPanel } from './logViewerPanel';
import { logger } from './logger';

/**
 * Get default log path for testing
 * TODO: Replace with npm package for project info
 */
function getDefaultLogPath(): string {
    const isWindows = os.platform() === 'win32';
    
    if (isWindows) {
        // Windows path - adjust drive letter as needed
        return 'C:\\wincc_proj\\DevEnv\\DevEnv\\log';
    } else {
        // Linux/Unix path
        return '/home/testus/wincc_proj/DevEnv/DevEnv/log';
    }
}

export function activate(context: vscode.ExtensionContext) {
    // Initialize logger
    logger.initialize();
    
    // Register output channel
    const outputChannel = logger.getOutputChannel();
    if (outputChannel) {
        context.subscriptions.push(outputChannel);
    }
    
    logger.info('WinCC OA LogViewer Extension activated');

    // Watch for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('winccoaLogviewer.logLevel')) {
                logger.updateLogLevel();
                logger.info('Log level updated');
            }
        })
    );

    // Register the command to open the LogViewer
    // This command can be called from:
    // 1. Command Palette (Ctrl+Shift+P -> "WinCC OA: Open LogViewer")
    // 2. Other extensions (vscode.commands.executeCommand('winccoa-logviewer.open', logPath))
    // 3. Buttons/UI elements in other extensions
    const openLogViewerCommand = vscode.commands.registerCommand(
        'winccoa-logviewer.open',
        (logPath?: string) => {
            // Use provided logPath or fall back to default
            const resolvedPath = logPath || getDefaultLogPath();
            logger.info('Opening LogViewer', { logPath: resolvedPath });
            LogViewerPanel.createOrShow(context.extensionUri, resolvedPath);
        }
    );

    context.subscriptions.push(openLogViewerCommand);
    
    // Note: Logger disposal is handled by output channel subscription
}

export function deactivate() {
    logger.info('WinCC OA LogViewer Extension deactivated');
}
