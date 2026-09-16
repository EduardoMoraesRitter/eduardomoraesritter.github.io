/* Read the SDK's current authorization state; never copy credentials into UI or logs. */
(function (root) {
  const resolvedEvent = 'chat-messenger-access-token-resolved';

  function isAuthorized(state, now = Date.now()) {
    if (!state || typeof state.accessToken !== 'string' || !state.accessToken) return false;
    const expiresAt = typeof state.accessTokenExpiresAt === 'number'
      ? state.accessTokenExpiresAt
      : Date.parse(state.accessTokenExpiresAt);
    return Number.isFinite(expiresAt) && expiresAt > now;
  }

  function waitForAuthorization({ readState, eventTarget, reset, timeoutMs = 20000, pollMs = 100 }) {
    return new Promise((resolve, reject) => {
      let timeout, poll, settled = false;
      const finish = failure => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        clearInterval(poll);
        eventTarget.removeEventListener(resolvedEvent, check);
        if (failure) reject(failure); else resolve();
      };
      const check = () => {
        // The CES SDK restores cached tokens without dispatching resolvedEvent.
        // Also re-check expiry on each request: an earlier event is not proof
        // that the credential is still valid.
        try { if (isAuthorized(readState())) finish(); }
        catch { finish({ kind: 'authorization-unavailable' }); }
      };
      eventTarget.addEventListener(resolvedEvent, check);
      timeout = setTimeout(() => finish({ kind: 'authorization-timeout' }), timeoutMs);
      poll = setInterval(check, pollMs);
      try { if (reset) reset(); }
      catch { finish({ kind: 'authorization-unavailable' }); }
      if (!settled) check();
    });
  }

  root.GecxSessionAuth = Object.freeze({ isAuthorized, waitForAuthorization });
})(globalThis);
