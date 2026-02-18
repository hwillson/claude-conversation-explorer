#!/usr/bin/env node
import meow from 'meow';
import {render} from 'ink';
import {App} from './app.js';

const cli = meow(
	`
	Usage
	  $ claude-conversation-explorer

	Options
	  --project, -p  Filter to a specific project path
	  --search, -s   Initial search query

	Examples
	  $ claude-conversation-explorer
	  $ claude-conversation-explorer --project /Users/me/my-project
	  $ claude-conversation-explorer --search "auth bug"
`,
	{
		importMeta: import.meta,
		flags: {
			project: {
				type: 'string',
				shortFlag: 'p',
			},
			search: {
				type: 'string',
				shortFlag: 's',
			},
		},
	},
);

render(
	<App projectFilter={cli.flags.project} initialSearch={cli.flags.search} />,
);
