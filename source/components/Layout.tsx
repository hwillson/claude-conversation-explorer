import {Box, Text, useStdout} from 'ink';
import type {SessionSummary, ConversationDetail} from '../data/types.js';
import {SessionList} from './SessionList.js';
import {ConversationView} from './ConversationView.js';
import {SearchBar} from './SearchBar.js';
import {StatusBar} from './StatusBar.js';

interface LayoutProps {
	sessions: SessionSummary[];
	cursorIndex: number;
	conversation: ConversationDetail | null;
	activePane: 'sidebar' | 'detail';
	searchActive: boolean;
	searchQuery: string;
	onSearchChange: (query: string) => void;
	onSearchSubmit: () => void;
	dataLoading: boolean;
	detailLoading: boolean;
	detailScrollOffset: number;
}

const SIDEBAR_WIDTH = 42;
const SIDEBAR_CONTENT = SIDEBAR_WIDTH - 1; // Content area inside the border

export function Layout({
	sessions,
	cursorIndex,
	conversation,
	activePane,
	searchActive,
	searchQuery,
	onSearchChange,
	onSearchSubmit,
	dataLoading,
	detailLoading,
	detailScrollOffset,
}: LayoutProps) {
	const {stdout} = useStdout();
	const termWidth = stdout?.columns ?? 80;
	const termHeight = stdout?.rows ?? 24;
	const contentHeight = termHeight - 4; // Status bar + borders
	const detailWidth = termWidth - SIDEBAR_WIDTH - 1; // -1 for sidebar border

	if (dataLoading) {
		return (
			<Box flexDirection="column" height={termHeight}>
				<Box justifyContent="center" alignItems="center" flexGrow={1}>
					<Text color="yellow">Loading Claude sessions...</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" height={termHeight}>
			{/* Main content area */}
			<Box flexGrow={1}>
				{/* Sidebar */}
				<Box
					flexDirection="column"
					width={SIDEBAR_WIDTH}
					flexShrink={0}
					overflow="hidden"
					borderStyle="single"
					borderRight
					borderTop={false}
					borderBottom={false}
					borderLeft={false}
				>
					<SearchBar
						active={searchActive}
						query={searchQuery}
						onChange={onSearchChange}
						onSubmit={onSearchSubmit}
					/>
					<Text>{'─'.repeat(SIDEBAR_CONTENT)}</Text>
					<SessionList
						sessions={sessions}
						cursorIndex={cursorIndex}
						isFocused={activePane === 'sidebar'}
						width={SIDEBAR_CONTENT}
						height={contentHeight - 2}
					/>
				</Box>

				{/* Detail pane */}
				<Box flexDirection="column" flexGrow={1}>
					<ConversationView
						conversation={conversation}
						loading={detailLoading}
						scrollOffset={detailScrollOffset}
						height={contentHeight}
						width={detailWidth}
					/>
				</Box>
			</Box>

			{/* Status bar */}
			<StatusBar
				searchActive={searchActive}
				sessionCount={sessions.length}
			/>
		</Box>
	);
}
