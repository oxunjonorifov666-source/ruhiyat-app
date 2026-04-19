/**
 * Clears tokens + premium state + user when refresh fails after 401.
 * Lives outside `authStore.ts` to avoid circular imports with `api.ts`.
 */
export async function clearClientSessionAfterAuthFailure() {
  const [{ clearTokens }, { usePremiumEntitlementStore }, { useAuthStore }] = await Promise.all([
    import('~/lib/auth-token'),
    import('~/store/premiumEntitlementStore'),
    import('~/store/authStore'),
  ]);
  await clearTokens();
  usePremiumEntitlementStore.getState().reset();
  useAuthStore.setState({ user: null });
}
