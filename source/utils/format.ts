export function relativeDate(dateStr: string): string {
	const date = new Date(dateStr);
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	let hours = date.getHours();
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12 || 12;
	return `${y}-${m}-${d} ${hours}:${minutes}${ampm}`;
}

export function formatTime(dateStr: string): string {
	return new Date(dateStr).toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	});
}

export function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

export function truncate(str: string, maxLen: number): string {
	if (str.length <= maxLen) return str;
	return str.slice(0, maxLen - 2) + '… ';
}
