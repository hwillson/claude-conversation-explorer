import {homedir} from 'node:os';
import {join} from 'node:path';

export function getClaudeDir(): string {
	return join(homedir(), '.claude');
}

export function getHistoryPath(): string {
	return join(getClaudeDir(), 'history.jsonl');
}

export function getProjectsDir(): string {
	return join(getClaudeDir(), 'projects');
}

export function encodeProjectPath(projectPath: string): string {
	return projectPath.replace(/\//g, '-');
}

export function decodeProjectPath(encoded: string): string {
	// e.g. "-Users-hwillson-Documents-git-epiq-csc" -> "/Users/hwillson/Documents/git/epiq/csc"
	return encoded.replace(/^-/, '/').replace(/-/g, '/');
}

export function getProjectName(projectPath: string): string {
	const parts = projectPath.split('/').filter(Boolean);
	return parts[parts.length - 1] ?? projectPath;
}
