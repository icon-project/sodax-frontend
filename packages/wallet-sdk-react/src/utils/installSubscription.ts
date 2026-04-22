const INSTALL_EVENTS = ['focus', 'visibilitychange', 'eip6963:announceProvider'] as const;

let installCounter = 0;
const listeners = new Set<() => void>();
let attached = false;

function bump(): void {
  installCounter++;
  for (const listener of listeners) listener();
}

function attach(): void {
  if (attached || typeof window === 'undefined') return;
  for (const event of INSTALL_EVENTS) window.addEventListener(event, bump);
  attached = true;
}

function detach(): void {
  if (!attached || typeof window === 'undefined') return;
  for (const event of INSTALL_EVENTS) window.removeEventListener(event, bump);
  attached = false;
}

/**
 * Shared subscription for wallet install events. Used by useXConnectors,
 * useAllXConnectors, and useIsInstalled to trigger re-renders when a wallet
 * extension is installed/uninstalled without polling.
 *
 * One set of window listeners is attached regardless of how many hooks
 * subscribe — the first subscribe attaches, the last unsubscribe detaches.
 */
export function subscribeInstall(onChange: () => void): () => void {
  listeners.add(onChange);
  attach();
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) detach();
  };
}

/** Monotonically increasing counter bumped on each install event. */
export function getInstallCounter(): number {
  return installCounter;
}
