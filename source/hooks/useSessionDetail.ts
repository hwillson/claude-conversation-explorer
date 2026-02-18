import {useState, useEffect} from 'react';
import {join} from 'node:path';
import {parseSession} from '../data/session-parser.js';
import {getProjectsDir, encodeProjectPath} from '../utils/paths.js';
import type {SessionSummary, ConversationDetail} from '../data/types.js';

interface UseSessionDetailResult {
	conversation: ConversationDetail | null;
	loading: boolean;
	error: string | null;
}

export function useSessionDetail(session: SessionSummary | null): UseSessionDetailResult {
	const [conversation, setConversation] = useState<ConversationDetail | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!session) {
			setConversation(null);
			return;
		}

		// History entries without real session files can't be loaded
		if (session.source === 'history') {
			setConversation({
				sessionId: session.sessionId,
				project: session.project,
				projectPath: session.projectPath,
				messages: [{
					role: 'user',
					content: session.firstPrompt,
					timestamp: session.created,
				}],
				created: session.created,
				modified: session.modified,
			});
			return;
		}

		let cancelled = false;
		setLoading(true);
		setError(null);

		async function load() {
			const filePath = session!.filePath
				?? join(getProjectsDir(), encodeProjectPath(session!.projectPath), `${session!.sessionId}.jsonl`);

			try {
				const result = await parseSession(filePath, session!.sessionId, session!.projectPath);
				if (!cancelled) {
					setConversation(result);
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
	}, [session?.sessionId]);

	return {conversation, loading, error};
}
