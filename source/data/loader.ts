import {scanProjects} from './project-scanner.js';
import {parseHistory} from './history-parser.js';
import type {SessionSummary} from './types.js';

export async function loadAllSessions(projectFilter?: string): Promise<SessionSummary[]> {
	const [projectSessions, historySessions] = await Promise.all([
		scanProjects(projectFilter),
		parseHistory(projectFilter),
	]);

	// Deduplicate: project sessions take priority
	const seen = new Set(projectSessions.map(s => s.sessionId));
	const uniqueHistory = historySessions.filter(s => !seen.has(s.sessionId));

	const all = [...projectSessions, ...uniqueHistory];

	// Sort by modified date, newest first
	all.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

	return all;
}
