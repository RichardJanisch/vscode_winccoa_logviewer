import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { LogParser, parseGenericLogLine } from './logParser';
import { LogEvent } from './logEvent';

export class LogFileWatcher {
    private watcher: vscode.FileSystemWatcher | undefined;
    private parsers = new Map<string, LogParser>(); // Separate parser per file
    private filePositions = new Map<string, number>(); // Track read position for each file
    private onNewEventCallback: ((event: LogEvent) => void) | undefined;
    private isPaused = false;
    private isInitialized = false; // Track if initialization is complete

    constructor(
        private logPath: string,
        onNewEvent: (event: LogEvent) => void
    ) {
        this.onNewEventCallback = onNewEvent;
    }

    /**
     * Start watching the log directory
     */
    public async start(): Promise<void> {
        // Initialize file positions to current size (skip existing content)
        await this.initializeFilePositions();
        
        // Mark as initialized BEFORE creating the watcher
        this.isInitialized = true;

        // Create file system watcher for all log files
        const pattern = new vscode.RelativePattern(this.logPath, '*.log');
        this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

        // Watch for changes (new content appended)
        this.watcher.onDidChange(async (uri) => {
            await this.handleFileChange(uri.fsPath);
        });

        // Watch for new files
        this.watcher.onDidCreate(async (uri) => {
            await this.handleFileChange(uri.fsPath);
        });
    }

    /**
     * Initialize file positions to skip existing content
     */
    private async initializeFilePositions(): Promise<void> {
        try {
            // Get all .log files in the directory
            const files = fs.readdirSync(this.logPath);

            for (const file of files) {
                if (file.endsWith('.log')) {
                    const filePath = path.join(this.logPath, file);
                    if (fs.existsSync(filePath)) {
                        const stats = fs.statSync(filePath);
                        // Use an absolute, normalized lowercase key to avoid mismatches on Windows
                        const resolved = path.resolve(filePath);
                        const key = resolved.toLowerCase();
                        this.filePositions.set(key, stats.size);
                        console.log(`Initialized ${resolved} (key=${key}) at position ${stats.size}`);
                    }
                }
            }
        } catch (error) {
            console.error(`Error initializing file positions: ${error}`);
            // Rethrow so caller can react if needed
            throw error;
        }
    }

    /**
     * Pause watching (stop processing new events)
     */
    public pause(): void {
        this.isPaused = true;
    }

    /**
     * Resume watching (continue processing new events)
     */
    public resume(): void {
        this.isPaused = false;
    }

    /**
     * Handle file change event - read new content only
     */
    private async handleFileChange(filePath: string): Promise<void> {
        // Ignore events until initialization is complete
        if (!this.isInitialized) {
            return;
        }

        try {
            // Resolve an absolute path and canonical key for maps (lowercase on Windows)
            const resolvedPath = path.resolve(filePath);
            const key = resolvedPath.toLowerCase();

            const stats = fs.statSync(resolvedPath);
            const currentSize = stats.size;

            // If we never saw this file during initialization, set its position to current size
            // and don't process older content. This avoids reading the whole file when
            // initialization missed it or paths differ in casing/format.
            if (!this.filePositions.has(key)) {
                this.filePositions.set(key, currentSize);
                console.log(`First-seen file, initializing position for ${resolvedPath} -> ${currentSize}`);
                return;
            }

            const lastPosition = this.filePositions.get(key) || 0;

            console.log(`File change: ${resolvedPath} (key=${key}), current: ${currentSize}, last: ${lastPosition}`);

            // Only read if file grew
            if (currentSize <= lastPosition) {
                return;
            }

            // If paused, just update position without processing
            if (this.isPaused) {
                this.filePositions.set(key, currentSize);
                return;
            }

            // Read only new content
            const stream = fs.createReadStream(resolvedPath, {
                start: lastPosition,
                encoding: 'utf-8'
            });

            let buffer = '';
            stream.on('data', (chunk) => {
                buffer += chunk;
            });

            stream.on('end', () => {
                // Windows uses \r\n, split by both and filter empty
                const lines = buffer.split(/\r?\n/).filter(line => line.length > 0);
                const fileName = path.basename(resolvedPath);

                console.log(`Read ${lines.length} new lines from ${fileName}`);

                if (fileName === 'PVSS_II.log') {
                    // Get or create parser for this file using the canonical key
                    let parser = this.parsers.get(key);
                    if (!parser) {
                        parser = new LogParser();
                        this.parsers.set(key, parser);
                        console.log(`Created new parser for ${resolvedPath} (key=${key})`);
                    }

                    // Parse PVSS_II.log with proper parser
                    let eventCount = 0;
                    for (const line of lines) {
                        if (line.trim()) {
                            const events = parser.parseLine(line);
                            events.forEach((event: LogEvent) => {
                                this.emitEvent(event);
                                eventCount++;
                            });
                        }
                    }

                    console.log(`Emitted ${eventCount} events from ${lines.length} lines`);
                } else {
                    // Other log files: emit as generic events
                    for (const line of lines) {
                        if (line.trim()) {
                            const event = parseGenericLogLine(line, fileName);
                            if (event) {
                                this.emitEvent(event);
                            }
                        }
                    }
                }

                // Update position using canonical key
                this.filePositions.set(key, currentSize);
            });

            stream.on('error', (error) => {
                console.error(`Error reading file ${resolvedPath}: ${error.message}`);
            });

        } catch (error) {
            console.error(`Error handling file change: ${error}`);
        }
    }

    /**
     * Emit a parsed event
     */
    private emitEvent(event: LogEvent): void {
        if (this.onNewEventCallback) {
            this.onNewEventCallback(event);
        }
    }

    /**
     * Stop watching
     */
    public stop(): void {
        this.isInitialized = false;
        if (this.watcher) {
            this.watcher.dispose();
            this.watcher = undefined;
        }
        this.filePositions.clear();
        this.parsers.clear(); // Clear all parsers
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.stop();
    }
}
