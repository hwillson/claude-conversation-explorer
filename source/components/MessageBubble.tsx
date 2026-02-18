import {Box, Text} from 'ink';
import type {ConversationMessage} from '../data/types.js';
import {formatTime} from '../utils/format.js';

interface MessageBubbleProps {
	message: ConversationMessage;
	width?: number;
}

export function MessageBubble({message, width}: MessageBubbleProps) {
	const isUser = message.role === 'user';
	const roleColor = isUser ? 'green' : 'blue';
	const roleLabel = isUser ? 'You' : 'Claude';
	const innerWidth = width ? width - 2 : undefined; // account for marginLeft={2}

	return (
		<Box flexDirection="column" marginBottom={1} width={width} overflow="hidden">
			<Box gap={1}>
				<Text bold color={roleColor}>
					{roleLabel}
				</Text>
				{message.timestamp && (
					<Text dimColor>{formatTime(message.timestamp)}</Text>
				)}
			</Box>

			<Box marginLeft={2} flexDirection="column" width={innerWidth} overflow="hidden">
				<Text wrap="wrap">{message.content || '(no text content)'}</Text>

				{message.toolUse && message.toolUse.length > 0 && (
					<Box marginTop={0} gap={1}>
						{message.toolUse.map((tool, i) => (
							<Text key={i} color="yellow" dimColor>
								[{tool}]
							</Text>
						))}
					</Box>
				)}
			</Box>
		</Box>
	);
}
