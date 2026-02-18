export interface SessionSummary {
	sessionId: string;
	project: string;
	projectPath: string;
	summary: string;
	firstPrompt: string;
	messageCount: number;
	created: string;
	modified: string;
	gitBranch?: string;
	filePath?: string;
	source: 'sessions-index' | 'jsonl-header' | 'history';
}

export interface ConversationMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: string;
	uuid?: string;
	toolUse?: string[];
	thinkingDuration?: number;
	costInfo?: {
		inputTokens: number;
		outputTokens: number;
	};
}

export interface ConversationDetail {
	sessionId: string;
	project: string;
	projectPath: string;
	gitBranch?: string;
	messages: ConversationMessage[];
	created: string;
	modified: string;
}

export interface HistoryEntry {
	display: string;
	timestamp: number;
	project?: string;
	sessionId?: string;
	pastedContents?: Record<string, unknown>;
}

export interface SessionsIndexEntry {
	sessionId: string;
	fullPath: string;
	fileMtime: number;
	firstPrompt: string;
	summary: string;
	messageCount: number;
	created: string;
	modified: string;
	gitBranch?: string;
	projectPath: string;
	isSidechain: boolean;
}

export interface SessionsIndex {
	version: number;
	entries: SessionsIndexEntry[];
}

export interface RawSessionLine {
	type: string;
	parentUuid?: string | null;
	isSidechain?: boolean;
	userType?: string;
	cwd?: string;
	sessionId?: string;
	version?: string;
	gitBranch?: string;
	slug?: string;
	message?: {
		role: string;
		content: string | Array<{type: string; text?: string; thinking?: string; name?: string; input?: Record<string, unknown>}>;
		model?: string;
	};
	uuid?: string;
	timestamp?: string;
	snapshot?: unknown;
	messageId?: string;
	isSnapshotUpdate?: boolean;
}
