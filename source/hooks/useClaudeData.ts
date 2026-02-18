import {useState, useEffect} from 'react';
import {loadAllSessions} from '../data/loader.js';
import type {SessionSummary} from '../data/types.js';

interface UseClaudeDataResult {
	sessions: SessionSummary[];
	loading: boolean;
	error: string | null;
}

export function useClaudeData(projectFilter?: string): UseClaudeDataResult {
	const [sessions, setSessions] = useState<SessionSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			try {
				const result = await loadAllSessions(projectFilter);
				if (!cancelled) {
					setSessions(result);
					setLoading(false);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : String(err));
					setLoading(false);
				}
			}
		}

		void load();
		return () => {
			cancelled = true;
		};
	}, [projectFilter]);

	return {sessions, loading, error};
}
