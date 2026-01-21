'use client';

/**
 * Utility function for downloading files.
 * Creates a temporary link element, triggers download, and cleans up.
 */
export function downloadFile(url: string, filename: string): void {
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	try {
		link.click();
	} finally {
		document.body.removeChild(link);
	}
}
