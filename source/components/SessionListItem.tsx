import {Box, Text} from 'ink';
import type {SessionSummary} from '../data/types.js';
import {relativeDate} from '../utils/format.js';

interface SessionListItemProps {
	session: SessionSummary;
	isSelected: boolean;
	width: number;
}

export function SessionListItem({session, isSelected, width}: SessionListItemProps) {
	const label = session.summary || session.firstPrompt || session.sessionId;
	const dateStr = relativeDate(session.modified);
	const prefix = isSelected ? ' \u276F ' : '   ';

	// Build label line: prefix + truncated label, hard-clamped to width chars
	const maxLabelLen = Math.max(1, width - prefix.length);
	const truncLabel = label.length > maxLabelLen
		? label.slice(0, maxLabelLen - 1) + '\u2026'
		: label;
	const labelLine = (prefix + truncLabel).padEnd(width).slice(0, width);

	// Build date line: right-aligned date, hard-clamped to width chars
	const dateLine = dateStr.padStart(width).slice(0, width);

	return (
		<Box flexDirection="column" width={width}>
			<Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
				{labelLine}
			</Text>
			<Text dimColor>{dateLine}</Text>
			<Text>{' '}</Text>
		</Box>
	);
}
