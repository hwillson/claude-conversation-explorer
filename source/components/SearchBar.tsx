import {Box, Text} from 'ink';
import {TextInput} from '@inkjs/ui';

interface SearchBarProps {
	active: boolean;
	query: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
}

export function SearchBar({active, query, onChange, onSubmit}: SearchBarProps) {
	if (!active) {
		return (
			<Box paddingX={1}>
				<Text dimColor>[/] Search…</Text>
			</Box>
		);
	}

	return (
		<Box paddingX={1}>
			<Text color="yellow">/</Text>
			<Text> </Text>
			<TextInput
				defaultValue={query}
				onChange={onChange}
				onSubmit={onSubmit}
			/>
		</Box>
	);
}
