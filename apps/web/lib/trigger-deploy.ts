/**
 * Triggers a Vercel deployment via deploy hook.
 * Used to rebuild the site when CMS content changes.
 *
 * This function:
 * - Only triggers when VERCEL_DEPLOY_HOOK_URL is configured
 * - Fires asynchronously (doesn't block the API response)
 * - Logs errors but doesn't throw (non-blocking)
 */
export async function triggerVercelDeploy(reason?: string): Promise<void> {
  const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;

  if (!deployHookUrl) {
    console.log('[Deploy Hook] VERCEL_DEPLOY_HOOK_URL not configured, skipping deploy trigger');
    return;
  }

  try {
    console.log(`[Deploy Hook] Triggering deployment${reason ? `: ${reason}` : ''}`);

    const response = await fetch(deployHookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Deploy Hook] Failed to trigger deployment: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    console.log('[Deploy Hook] Deployment triggered successfully:', data.job?.id || 'queued');
  } catch (error) {
    // Log but don't throw - we don't want deploy failures to break CMS operations
    console.error('[Deploy Hook] Error triggering deployment:', error);
  }
}

/**
 * Triggers deploy only if content is published.
 * Use this for create/update operations.
 */
export async function triggerDeployIfPublished(isPublished: boolean, reason?: string): Promise<void> {
  if (isPublished) {
    await triggerVercelDeploy(reason);
  }
}
