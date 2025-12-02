/**
 * Example: How to call the LogViewer from the Core Extension
 * 
 * This demonstrates how to integrate the LogViewer extension
 * into your main WinCC OA extension.
 */

import * as vscode from 'vscode';

// Example 1: Open LogViewer from a command
export function registerOpenLogViewerCommand(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand(
        'winccoa-core.openLogs',
        async () => {
            // Get the log path from your project info service
            const logPath = await getLogPath();
            
            if (logPath) {
                // Call the LogViewer extension
                vscode.commands.executeCommand('winccoa-logviewer.open', logPath);
            } else {
                // Open without path (will show warning or mock data)
                vscode.commands.executeCommand('winccoa-logviewer.open');
            }
        }
    );
    
    context.subscriptions.push(command);
}

// Example 2: Open LogViewer from a tree view item click
export class ConsoleTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    // TreeDataProvider implementation
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }
    
    getChildren(): vscode.TreeItem[] {
        return [];
    }
    
    // Custom method to open logs
    async openLogs(item: vscode.TreeItem) {
        const projectInfo = await getProjectInfo();
        
        // Open LogViewer with specific log path
        vscode.commands.executeCommand(
            'winccoa-logviewer.open',
            projectInfo.logPath
        );
    }
}

// Example 3: Add a button to your view
// In package.json contributions:
/*
{
  "contributes": {
    "menus": {
      "view/title": [
        {
          "command": "winccoa-core.openLogs",
          "when": "view == winccoa.consoleView",
          "group": "navigation",
          "icon": "$(output)"
        }
      ]
    }
  }
}
*/

// Helper function (replace with your actual implementation)
async function getLogPath(): Promise<string | undefined> {
    // Example: Get from WinCC OA project info
    try {
        const response = await fetch('http://localhost:3000/api/projectInfo');
        const data = await response.json();
        return data.logPath;
    } catch (error) {
        console.error('Failed to get log path:', error);
        return undefined;
    }
}

async function getProjectInfo(): Promise<{ logPath?: string }> {
    // Your implementation
    return { logPath: '/path/to/logs' };
}
