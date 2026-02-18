import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import type {ConversationDetail, ConversationMessage, RawSessionLine} from './types.js';
import {getProjectName} from '../utils/paths.js';

const SKIP_TYPES = new Set(['file-history-snapshot', 'progress', 'thinking']);

export async function parseSession(
	filePath: string,
	sessionId: string,
	projectPath: string,
): Promise<ConversationDetail> {
	const messages: ConversationMessage[] = [];
	let gitBranch: string | undefined;
	let created = '';
	let modified = '';

	const rl = createInterface({
		input: createReadStream(filePath, {encoding: 'utf-8'}),
		crlfDelay: Infinity,
	});

	for await (const line of rl) {
		try {
			const parsed: RawSessionLine = JSON.parse(line);

			if (SKIP_TYPES.has(parsed.type)) continue;
			if (parsed.isSidechain) continue;

			if (parsed.gitBranch && !gitBranch) {
				gitBranch = parsed.gitBranch;
			}

			if (parsed.timestamp) {
				if (!created) created = parsed.timestamp;
				modified = parsed.timestamp;
			}

			if (parsed.type === 'user' && parsed.message?.role === 'user') {
				const content = extractTextContent(parsed.message.content);
				if (content) {
					messages.push({
						role: 'user',
						content,
						timestamp: parsed.timestamp ?? '',
						uuid: parsed.uuid,
					});
				}
			}

			if (parsed.type === 'assistant' && parsed.message?.role === 'assistant') {
				const {text, toolUse} = extractAssistantContent(parsed.message.content);
				if (text || toolUse.length > 0) {
					messages.push({
						role: 'assistant',
						content: text,
						timestamp: parsed.timestamp ?? '',
						uuid: parsed.uuid,
						toolUse: toolUse.length > 0 ? toolUse : undefined,
					});
				}
			}
		} catch {
			// Skip unparseable lines
		}
	}

	rl.close();

	return {
		sessionId,
		project: getProjectName(projectPath),
		projectPath,
		gitBranch,
		messages,
		created,
		modified,
	};
}

function extractTextContent(
	content: string | Array<{type: string; text?: string; thinking?: string}>,
): string {
	if (typeof content === 'string') return content;

	return content
		.filter(c => c.type === 'text' && c.text)
		.map(c => c.text!)
		.join('\n');
}

function extractAssistantContent(
	content: string | Array<{type: string; text?: string; thinking?: string; name?: string; input?: Record<string, unknown>}>,
): {text: string; toolUse: string[]} {
	if (typeof content === 'string') return {text: content, toolUse: []};

	const textParts: string[] = [];
	const toolUse: string[] = [];

	for (const block of content) {
		if (block.type === 'text' && block.text) {
			textParts.push(block.text);
		} else if (block.type === 'tool_use' && block.name) {
			toolUse.push(block.name);
		}
		// Skip thinking blocks
	}

	return {text: textParts.join('\n'), toolUse};
}
