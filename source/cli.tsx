#!/usr/bin/env node
import meow from 'meow';
import {render} from 'ink';
import {App} from './app.js';

const cli = meow(
	`
	Usage
	  $ claude-code-explorer

	Options
	  --project, -p  Filter to a specific project path
	  --search, -s   Initial search query

	Examples
	  $ claude-code-explorer
	  $ claude-code-explorer --project /Users/me/my-project
	  $ claude-code-explorer --search "auth bug"
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
