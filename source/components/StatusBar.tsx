import {Box, Text} from 'ink';

interface StatusBarProps {
	searchActive: boolean;
	sessionCount: number;
}

export function StatusBar({searchActive, sessionCount}: StatusBarProps) {
	return (
		<Box
			borderStyle="single"
			borderTop
			borderBottom={false}
			borderLeft={false}
			borderRight={false}
			paddingX={1}
		>
			{searchActive ? (
				<Text dimColor>
					Type to filter • <Text bold>Esc</Text> cancel
				</Text>
			) : (
				<Text dimColor>
					<Text bold>j/k</Text> Navigate  <Text bold>Enter</Text> Select  <Text bold>/</Text> Search  <Text bold>Tab</Text> Pane  <Text bold>g/G</Text> Top/Bottom  <Text bold>q</Text> Quit
					<Text>  {sessionCount} sessions</Text>
				</Text>
			)}
		</Box>
	);
}
