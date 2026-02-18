import {readdir, readFile, stat} from 'node:fs/promises';
import {join, basename} from 'node:path';
import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {getProjectsDir, decodeProjectPath, getProjectName} from '../utils/paths.js';
import type {SessionSummary, SessionsIndex, RawSessionLine} from './types.js';

export async function scanProjects(projectFilter?: string): Promise<SessionSummary[]> {
	const projectsDir = getProjectsDir();
	let projectDirs: string[];

	try {
		projectDirs = await readdir(projectsDir);
	} catch {
		return [];
	}

	const allSessions: SessionSummary[] = [];

	for (const dirName of projectDirs) {
		const projectPath = decodeProjectPath(dirName);

		if (projectFilter && projectPath !== projectFilter) {
			continue;
		}

		const projectDir = join(projectsDir, dirName);
		const dirStat = await stat(projectDir).catch(() => null);
		if (!dirStat?.isDirectory()) continue;

		// Try sessions-index.json first
		const indexSessions = await loadSessionsIndex(projectDir, projectPath);
		if (indexSessions.length > 0) {
			allSessions.push(...indexSessions);
			continue;
		}

		// Fall back to scanning JSONL headers
		const jsonlSessions = await scanJsonlHeaders(projectDir, projectPath);
		allSessions.push(...jsonlSessions);
	}

	return allSessions;
}

async function loadSessionsIndex(projectDir: string, projectPath: string): Promise<SessionSummary[]> {
	const indexPath = join(projectDir, 'sessions-index.json');

	try {
		const raw = await readFile(indexPath, 'utf-8');
		const index: SessionsIndex = JSON.parse(raw);

		return index.entries
			.filter(entry => !entry.isSidechain)
			.map(entry => ({
				sessionId: entry.sessionId,
				project: getProjectName(projectPath),
				projectPath,
				summary: entry.summary || '',
				firstPrompt: entry.firstPrompt || '',
				messageCount: entry.messageCount,
				created: entry.created,
				modified: entry.modified,
				gitBranch: entry.gitBranch,
				filePath: entry.fullPath,
				source: 'sessions-index' as const,
			}));
	} catch {
		return [];
	}
}

async function scanJsonlHeaders(projectDir: string, projectPath: string): Promise<SessionSummary[]> {
	let files: string[];
	try {
		files = await readdir(projectDir);
	} catch {
		return [];
	}

	const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
	const sessions: SessionSummary[] = [];

	for (const file of jsonlFiles) {
		const filePath = join(projectDir, file);
		const sessionId = basename(file, '.jsonl');
		const session = await parseJsonlHeader(filePath, sessionId, projectPath);
		if (session) {
			sessions.push(session);
		}
	}

	return sessions;
}

async function parseJsonlHeader(
	filePath: string,
	sessionId: string,
	projectPath: string,
): Promise<SessionSummary | null> {
	try {
		const rl = createInterface({
			input: createReadStream(filePath, {encoding: 'utf-8'}),
			crlfDelay: Infinity,
		});

		let firstPrompt = '';
		let gitBranch: string | undefined;
		let created = '';
		let modified = '';
		let messageCount = 0;
		let lineCount = 0;

		for await (const line of rl) {
			if (lineCount > 20) break; // Only read first 20 lines for header info
			lineCount++;

			try {
				const parsed: RawSessionLine = JSON.parse(line);

				if (parsed.timestamp) {
					if (!created) created = parsed.timestamp;
					modified = parsed.timestamp;
				}

				if (parsed.gitBranch && !gitBranch) {
					gitBranch = parsed.gitBranch;
				}

				if (parsed.type === 'user' && parsed.message?.role === 'user') {
					messageCount++;
					if (!firstPrompt) {
						const content = parsed.message.content;
						firstPrompt = typeof content === 'string'
							? content
							: content
								.filter(c => c.type === 'text')
								.map(c => c.text)
								.join(' ');
					}
				}

				if (parsed.type === 'assistant') {
					messageCount++;
				}
			} catch {
				// Skip unparseable lines
			}
		}

		rl.close();

		if (!firstPrompt && !created) return null;

		// Get file mtime for modified if no timestamp found
		if (!modified) {
			const fileStat = await stat(filePath);
			modified = fileStat.mtime.toISOString();
		}
		if (!created) created = modified;

		return {
			sessionId,
			project: getProjectName(projectPath),
			projectPath,
			summary: '',
			firstPrompt: firstPrompt.slice(0, 200),
			messageCount,
			created,
			modified,
			gitBranch,
			filePath,
			source: 'jsonl-header',
		};
	} catch {
		return null;
	}
}
