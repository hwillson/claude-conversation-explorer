import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {getHistoryPath, getProjectName} from '../utils/paths.js';
import type {HistoryEntry, SessionSummary} from './types.js';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export async function parseHistory(projectFilter?: string): Promise<SessionSummary[]> {
	const historyPath = getHistoryPath();

	const entries: HistoryEntry[] = [];

	try {
		const rl = createInterface({
			input: createReadStream(historyPath, {encoding: 'utf-8'}),
			crlfDelay: Infinity,
		});

		for await (const line of rl) {
			try {
				const entry: HistoryEntry = JSON.parse(line);
				if (projectFilter && entry.project !== projectFilter) continue;
				entries.push(entry);
			} catch {
				// Skip unparseable lines
			}
		}

		rl.close();
	} catch {
		return [];
	}

	// Entries with sessionId are already handled by project scanner
	// Group entries without sessionId by project + 2-hour time gaps
	const noSessionEntries = entries.filter(e => !e.sessionId);
	return groupByTimeGaps(noSessionEntries);
}

function groupByTimeGaps(entries: HistoryEntry[]): SessionSummary[] {
	if (entries.length === 0) return [];

	// Group by project
	const byProject = new Map<string, HistoryEntry[]>();
	for (const entry of entries) {
		const project = entry.project ?? 'unknown';
		const list = byProject.get(project) ?? [];
		list.push(entry);
		byProject.set(project, list);
	}

	const sessions: SessionSummary[] = [];

	for (const [projectPath, projectEntries] of byProject) {
		// Sort by timestamp
		projectEntries.sort((a, b) => a.timestamp - b.timestamp);

		let groupStart = 0;
		for (let i = 1; i <= projectEntries.length; i++) {
			const isEnd = i === projectEntries.length;
			const isGap =
				!isEnd &&
				projectEntries[i]!.timestamp - projectEntries[i - 1]!.timestamp > TWO_HOURS_MS;

			if (isEnd || isGap) {
				const group = projectEntries.slice(groupStart, i);
				const first = group[0]!;
				const last = group[group.length - 1]!;

				sessions.push({
					sessionId: `history-${first.timestamp}`,
					project: getProjectName(projectPath),
					projectPath,
					summary: '',
					firstPrompt: first.display.slice(0, 200),
					messageCount: group.length,
					created: new Date(first.timestamp).toISOString(),
					modified: new Date(last.timestamp).toISOString(),
					source: 'history',
				});

				groupStart = i;
			}
		}
	}

	return sessions;
}
