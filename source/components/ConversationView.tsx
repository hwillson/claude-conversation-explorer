import {Box, Text} from 'ink';
import type {ConversationDetail} from '../data/types.js';
import {MessageBubble} from './MessageBubble.js';
import {formatDate} from '../utils/format.js';

interface ConversationViewProps {
	conversation: ConversationDetail | null;
	loading: boolean;
	scrollOffset: number;
	height: number;
	width: number;
}

export function ConversationView({conversation, loading, scrollOffset, height, width}: ConversationViewProps) {
	if (loading) {
		return (
			<Box flexDirection="column" paddingX={1}>
				<Text color="yellow">Loading conversation...</Text>
			</Box>
		);
	}

	if (!conversation) {
		return (
			<Box flexDirection="column" paddingX={1} justifyContent="center" alignItems="center" height={height}>
				<Text dimColor>Select a session to view</Text>
				<Text dimColor>Press Enter on the sidebar</Text>
			</Box>
		);
	}

	// Header
	const headerLines = 3;
	const availableHeight = Math.max(1, height - headerLines);

	// Virtual scrolling for messages with dynamic line estimation
	const messages = conversation.messages;
	const contentWidth = Math.max(1, width - 4); // paddingX(1+1) + marginLeft(2)
	let lineBudget = availableHeight;
	let count = 0;
	for (let i = scrollOffset; i < messages.length && lineBudget > 0; i++) {
		const msg = messages[i]!;
		const headerLines = 1;
		// Count lines accounting for newlines in content
		const contentText = msg.content || '(no text content)';
		let contentLines = 0;
		for (const segment of contentText.split('\n')) {
			contentLines += Math.max(1, Math.ceil(segment.length / contentWidth));
		}
		const toolLines = msg.toolUse?.length ? 1 : 0;
		const margin = 1; // marginBottom={1}
		lineBudget -= headerLines + contentLines + toolLines + margin;
		if (lineBudget >= 0) count++;
	}
	const maxVisible = Math.max(1, count);
	const visibleMessages = messages.slice(scrollOffset, scrollOffset + maxVisible);

	return (
		<Box flexDirection="column" paddingX={1} width={width} height={height} overflow="hidden">
			{/* Header */}
			<Box flexDirection="column" marginBottom={1}>
				<Box gap={2}>
					<Text bold>
						Project: <Text color="cyan">{conversation.project}</Text>
					</Text>
					{conversation.gitBranch && (
						<Text>
							Branch: <Text color="magenta">{conversation.gitBranch}</Text>
						</Text>
					)}
				</Box>
				<Text dimColor>
					{formatDate(conversation.created)}
					{conversation.created !== conversation.modified &&
						` - ${formatDate(conversation.modified)}`}
					{'  '}
					{messages.length} messages
					{scrollOffset > 0 && ` (scrolled ${scrollOffset + 1}/${messages.length})`}
				</Text>
			</Box>

			{/* Messages */}
			{visibleMessages.map((msg, i) => (
				<MessageBubble key={msg.uuid ?? `${scrollOffset + i}`} message={msg} width={width - 2} />
			))}

			{messages.length === 0 && (
				<Text dimColor>No messages in this session</Text>
			)}
		</Box>
	);
}
