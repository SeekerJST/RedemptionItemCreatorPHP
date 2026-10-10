import { useCallback, useEffect, useState } from 'react';
import { fetchMe, verifyEmail } from '../api/authApi.js';

/** Why Sign in with Google came back without signing in (the API's ?signin_error=...). */
const SIGN_IN_ERRORS = {
    cancelled: 'Google sign-in was cancelled.',
    expired: 'That Google sign-in took too long or was already used. Try again.',
    unverified: "Your Google account's email address isn't verified, so it can't be used to sign in here.",
    unavailable: "Sign in with Google isn't set up on this site yet.",
    google: "Google sign-in didn't work. Try again, or sign in with your email and password.",
};

/**
 * Reads and clears a one-time value the API put in the page address, so a reload doesn't reuse
 * it: ?verify=... (confirm an account) or ?reset=... (choose a new password) from its emails, and
 * ?signin=google or ?signin_error=... on the way back from Google.
 */
function takeUrlToken() {
    const params = new URLSearchParams(window.location.search);
    for (const kind of ['verify', 'reset', 'signin', 'signin_error']) {
        const token = params.get(kind);
        if (token) {
            params.delete(kind);
            const query = params.toString();
            window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash);
            return { kind, token };
        }
    }
    return null;
}

/**
 * One confirmation call per token: a link works once, and React (in development) runs effects
 * twice, which would otherwise spend it and then report it as used.
 */
const verifications = new Map();
const verifyOnce = (token) => {
    if (!verifications.has(token)) {
        verifications.set(token, verifyEmail(token));
    }
    return verifications.get(token);
};

/**
 * Who's signed in, plus a link from an email if the page was opened with one.
 *
 * @returns {{
 *   user: object | null | undefined,   undefined until the API has answered
 *   setUser: (user: object | null) => void,
 *   providers: string[],               other ways to sign in that are set up (['google'])
 *   notice: { kind: 'ok' | 'error', text: string } | null,   the result of a confirmation link
 *   resetToken: string | null,         a password-reset link's token, for the account panel
 *   clearLink: () => void,
 * }}
 */
export function useAuth() {
    const [user, setUser] = useState(undefined);
    const [providers, setProviders] = useState([]);
    const [link] = useState(takeUrlToken);
    const [notice, setNotice] = useState(
        link?.kind === 'signin_error' ? { kind: 'error', text: SIGN_IN_ERRORS[link.token] ?? SIGN_IN_ERRORS.google } : null
    );
    const [resetToken, setResetToken] = useState(link?.kind === 'reset' ? link.token : null);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            if (link?.kind === 'verify') {
                try {
                    const { user: verified } = await verifyOnce(link.token);
                    setNotice({ kind: 'ok', text: `Welcome, ${verified.displayName}: your email is confirmed.` });
                } catch (e) {
                    setNotice({ kind: 'error', text: e.message });
                }
            }
            const { user: current, providers: available = [] } = await fetchMe(controller.signal);
            setUser(current);
            setProviders(available);
            if (link?.kind === 'signin' && current) {
                setNotice({ kind: 'ok', text: `Welcome, ${current.displayName}: you're signed in with Google.` });
            }
        };
        load().catch((e) => {
            if (e.name !== 'AbortError') {
                setUser(null);
            }
        });
        return () => controller.abort();
    }, [link]);

    const clearLink = useCallback(() => {
        setNotice(null);
        setResetToken(null);
    }, []);

    return { user, setUser, providers, notice, resetToken, clearLink };
}
