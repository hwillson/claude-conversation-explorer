import {useReducer, useCallback, useRef} from 'react';
import {useInput, useApp} from 'ink';
import {Layout} from './components/Layout.js';
import {useClaudeData} from './hooks/useClaudeData.js';
import {useSessionDetail} from './hooks/useSessionDetail.js';
import {useSearch} from './hooks/useSearch.js';
import type {SessionSummary} from './data/types.js';

type Pane = 'sidebar' | 'detail';

interface AppState {
	activePane: Pane;
	cursorIndex: number;
	selectedSession: SessionSummary | null;
	searchActive: boolean;
	searchQuery: string;
	detailScrollOffset: number;
}

type Action =
	| {type: 'MOVE_CURSOR'; delta: number; maxIndex: number}
	| {type: 'JUMP_TOP'}
	| {type: 'JUMP_BOTTOM'; maxIndex: number}
	| {type: 'SELECT_SESSION'; session: SessionSummary}
	| {type: 'SWITCH_PANE'; pane?: Pane}
	| {type: 'TOGGLE_SEARCH'}
	| {type: 'SET_SEARCH'; query: string}
	| {type: 'EXIT_SEARCH'}
	| {type: 'SCROLL_DETAIL'; delta: number; maxOffset: number};

function reducer(state: AppState, action: Action): AppState {
	switch (action.type) {
		case 'MOVE_CURSOR':
			return {
				...state,
				cursorIndex: Math.max(
					0,
					Math.min(state.cursorIndex + action.delta, action.maxIndex),
				),
			};
		case 'JUMP_TOP':
			return {...state, cursorIndex: 0};
		case 'JUMP_BOTTOM':
			return {...state, cursorIndex: action.maxIndex};
		case 'SELECT_SESSION':
			return {
				...state,
				selectedSession: action.session,
				activePane: 'detail',
				detailScrollOffset: 0,
			};
		case 'SWITCH_PANE':
			return {
				...state,
				activePane: action.pane ?? (state.activePane === 'sidebar' ? 'detail' : 'sidebar'),
			};
		case 'TOGGLE_SEARCH':
			return {
				...state,
				searchActive: !state.searchActive,
				searchQuery: state.searchActive ? '' : state.searchQuery,
				cursorIndex: 0,
			};
		case 'SET_SEARCH':
			return {...state, searchQuery: action.query, cursorIndex: 0};
		case 'EXIT_SEARCH':
			return {
				...state,
				searchActive: false,
				searchQuery: '',
				cursorIndex: 0,
			};
		case 'SCROLL_DETAIL':
			return {
				...state,
				detailScrollOffset: Math.max(
					0,
					Math.min(
						state.detailScrollOffset + action.delta,
						action.maxOffset,
					),
				),
			};
		default:
			return state;
	}
}

const initialState: AppState = {
	activePane: 'sidebar',
	cursorIndex: 0,
	selectedSession: null,
	searchActive: false,
	searchQuery: '',
	detailScrollOffset: 0,
};

interface AppProps {
	projectFilter?: string;
	initialSearch?: string;
}

export function App({projectFilter, initialSearch}: AppProps) {
	const {sessions, loading: dataLoading} = useClaudeData(projectFilter);
	const [state, dispatch] = useReducer(reducer, {
		...initialState,
		searchQuery: initialSearch ?? '',
		searchActive: !!initialSearch,
	});

	const searchedSessions = useSearch(sessions, state.searchQuery);
	const displayList = state.searchQuery ? searchedSessions : sessions;

	const {conversation, loading: detailLoading} = useSessionDetail(
		state.selectedSession,
	);

	const {exit} = useApp();

	const handleSelect = useCallback(
		(session: SessionSummary) => {
			dispatch({type: 'SELECT_SESSION', session});
		},
		[],
	);

	const handleSearchChange = useCallback((query: string) => {
		dispatch({type: 'SET_SEARCH', query});
	}, []);

	// Handler ref pattern: assign the real handler during render so it always
	// captures the latest closure values, then pass a stable wrapper to useInput.
	// This avoids both: (a) Ink re-registering the listener on every render, and
	// (b) the timing gap from useEffect-based ref syncing.
	const inputHandlerRef = useRef((_input: string, _key: any) => {});
	inputHandlerRef.current = (input: string, key: any) => {
		// Quit
		if (input === 'q' && !state.searchActive) {
			exit();
			return;
		}

		// Search toggle
		if (input === '/' && !state.searchActive) {
			dispatch({type: 'TOGGLE_SEARCH'});
			return;
		}

		if (key.escape) {
			if (state.searchActive) {
				dispatch({type: 'EXIT_SEARCH'});
			} else if (state.selectedSession) {
				dispatch({type: 'SWITCH_PANE', pane: 'sidebar'});
			}
			return;
		}

		// Don't process nav keys during search input
		if (state.searchActive) return;

		// Pane switching
		if (key.tab) {
			dispatch({type: 'SWITCH_PANE'});
			return;
		}
		if (input === 'h') {
			dispatch({type: 'SWITCH_PANE', pane: 'sidebar'});
			return;
		}
		if (input === 'l') {
			dispatch({type: 'SWITCH_PANE', pane: 'detail'});
			return;
		}

		const maxSessionIndex = Math.max(0, displayList.length - 1);

		if (state.activePane === 'sidebar') {
			// Navigation
			if (input === 'j' || key.downArrow) {
				dispatch({type: 'MOVE_CURSOR', delta: 1, maxIndex: maxSessionIndex});
				return;
			}
			if (input === 'k' || key.upArrow) {
				dispatch({type: 'MOVE_CURSOR', delta: -1, maxIndex: maxSessionIndex});
				return;
			}
			if (input === 'g') {
				dispatch({type: 'JUMP_TOP'});
				return;
			}
			if (input === 'G') {
				dispatch({type: 'JUMP_BOTTOM', maxIndex: maxSessionIndex});
				return;
			}

			// Select
			if (key.return) {
				const session = displayList[state.cursorIndex];
				if (session) {
					handleSelect(session);
				}
				return;
			}
		} else if (state.activePane === 'detail') {
			const maxOffset = conversation ? Math.max(0, conversation.messages.length - 1) : 0;
			if (input === 'j' || key.downArrow) {
				dispatch({type: 'SCROLL_DETAIL', delta: 1, maxOffset});
				return;
			}
			if (input === 'k' || key.upArrow) {
				dispatch({type: 'SCROLL_DETAIL', delta: -1, maxOffset});
				return;
			}
			if (input === 'g') {
				dispatch({type: 'SCROLL_DETAIL', delta: -99999, maxOffset});
				return;
			}
			if (input === 'G') {
				dispatch({type: 'SCROLL_DETAIL', delta: 99999, maxOffset});
				return;
			}
		}
	};

	const stableInputHandler = useCallback((input: string, key: any) => {
		inputHandlerRef.current(input, key);
	}, []);

	useInput(stableInputHandler);

	return (
		<Layout
			sessions={displayList}
			cursorIndex={state.cursorIndex}
			conversation={conversation}
			activePane={state.activePane}
			searchActive={state.searchActive}
			searchQuery={state.searchQuery}
			onSearchChange={handleSearchChange}
			onSearchSubmit={() => {
				dispatch({type: 'TOGGLE_SEARCH'});
			}}
			dataLoading={dataLoading}
			detailLoading={detailLoading}
			detailScrollOffset={state.detailScrollOffset}
		/>
	);
}
