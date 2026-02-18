import {useMemo, useRef} from 'react';
import {Box, Text} from 'ink';
import type {SessionSummary} from '../data/types.js';
import {SessionListItem} from './SessionListItem.js';

interface SessionListProps {
	sessions: SessionSummary[];
	cursorIndex: number;
	isFocused: boolean;
	width: number;
	height: number;
}

interface GroupedSessions {
	project: string;
	sessions: {session: SessionSummary; globalIndex: number}[];
}

export function SessionList({sessions, cursorIndex, isFocused, width, height}: SessionListProps) {
	// Group sessions by project
	const groups = useMemo(() => {
		const map = new Map<string, {session: SessionSummary; globalIndex: number}[]>();
		sessions.forEach((session, index) => {
			const list = map.get(session.project) ?? [];
			list.push({session, globalIndex: index});
			map.set(session.project, list);
		});

		const result: GroupedSessions[] = [];
		for (const [project, items] of map) {
			result.push({project, sessions: items});
		}
		return result;
	}, [sessions]);

	// Build flat list of renderable rows (headers + items)
	const rows = useMemo(() => {
		const flat: Array<{type: 'header'; project: string} | {type: 'item'; session: SessionSummary; globalIndex: number}> = [];
		for (const group of groups) {
			flat.push({type: 'header', project: group.project});
			for (const item of group.sessions) {
				flat.push({type: 'item', ...item});
			}
		}
		return flat;
	}, [groups]);

	// Find which row the cursor is on
	const cursorRowIndex = rows.findIndex(
		r => r.type === 'item' && r.globalIndex === cursorIndex,
	);

	// Virtual scrolling: show a window of rows
	// Each header takes 1 terminal line, each item takes 2 terminal lines
	const availableLines = Math.max(1, height - 2); // Leave room for padding
	const scrollOffsetRef = useRef(0);

	// Calculate how many terminal lines a range of rows occupies
	const rowHeight = (row: typeof rows[number]) => row.type === 'header' ? 1 : 3;

	// Calculate terminal lines consumed from scrollOffset to end
	const linesFromOffset = (offset: number) => {
		let lines = 0;
		for (let i = offset; i < rows.length; i++) {
			lines += rowHeight(rows[i]!);
		}
		return lines;
	};

	// Clamp scroll offset if rows array shrank
	while (scrollOffsetRef.current > 0 && linesFromOffset(scrollOffsetRef.current) < availableLines) {
		scrollOffsetRef.current--;
	}

	// Adjust scroll only when cursor goes outside visible bounds
	if (cursorRowIndex >= 0) {
		// Check if cursor row is below visible area
		let linesBeforeCursor = 0;
		for (let i = scrollOffsetRef.current; i < cursorRowIndex; i++) {
			linesBeforeCursor += rowHeight(rows[i]!);
		}
		const cursorEnd = linesBeforeCursor + rowHeight(rows[cursorRowIndex]!);
		if (cursorEnd > availableLines) {
			// Scroll down: advance offset until cursor fits
			let lines = 0;
			for (let i = cursorRowIndex; i >= 0; i--) {
				lines += rowHeight(rows[i]!);
				if (lines > availableLines) {
					scrollOffsetRef.current = i + 1;
					break;
				}
				if (i === 0) {
					scrollOffsetRef.current = 0;
				}
			}
		}
		if (cursorRowIndex < scrollOffsetRef.current) {
			scrollOffsetRef.current = cursorRowIndex;
		}
	}

	// Collect visible rows that fit within availableLines
	const visibleSlice: typeof rows = [];
	let usedLines = 0;
	for (let i = scrollOffsetRef.current; i < rows.length; i++) {
		const h = rowHeight(rows[i]!);
		if (usedLines + h > availableLines) break;
		visibleSlice.push(rows[i]!);
		usedLines += h;
	}

	return (
		<Box flexDirection="column" width={width}>
			{sessions.length === 0 ? (
				<Text dimColor>{(' No sessions found').padEnd(width).slice(0, width)}</Text>
			) : (
				visibleSlice.map((row) => {
					if (row.type === 'header') {
						const headerLine = (' ' + row.project).padEnd(width).slice(0, width);
						return (
							<Text key={`h-${row.project}`} bold color={isFocused ? 'white' : 'gray'}>
								{headerLine}
							</Text>
						);
					}

					return (
						<SessionListItem
							key={row.session.sessionId}
							session={row.session}
							isSelected={isFocused && row.globalIndex === cursorIndex}
							width={width}
						/>
					);
				})
			)}
		</Box>
	);
}
