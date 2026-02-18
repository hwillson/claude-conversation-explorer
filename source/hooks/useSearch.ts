import {useMemo} from 'react';
import type {SessionSummary} from '../data/types.js';

export function useSearch(sessions: SessionSummary[], query: string): SessionSummary[] {
	return useMemo(() => {
		if (!query.trim()) return sessions;

		const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

		return sessions.filter(session => {
			const searchable = [
				session.project,
				session.summary,
				session.firstPrompt,
				session.gitBranch ?? '',
				session.projectPath,
			]
				.join(' ')
				.toLowerCase();

			return terms.every(term => searchable.includes(term));
		});
	}, [sessions, query]);
}
