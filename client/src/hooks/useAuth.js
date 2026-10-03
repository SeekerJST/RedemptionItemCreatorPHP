import { useCallback, useEffect, useState } from 'react';
import { fetchMe, verifyEmail } from '../api/authApi.js';

/**
 * Reads and clears a one-time token the API's emails put in the page address (?verify=... to
 * confirm an account, ?reset=... to choose a new password), so a reload doesn't reuse it.
 */
function takeUrlToken() {
    const params = new URLSearchParams(window.location.search);
    for (const kind of ['verify', 'reset']) {
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
 *   notice: { kind: 'ok' | 'error', text: string } | null,   the result of a confirmation link
 *   resetToken: string | null,         a password-reset link's token, for the account panel
 *   clearLink: () => void,
 * }}
 */
export function useAuth() {
    const [user, setUser] = useState(undefined);
    const [link] = useState(takeUrlToken);
    const [notice, setNotice] = useState(null);
    const [resetToken, setResetToken] = useState(link?.kind === 'reset' ? link.token : null);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            if (link?.kind === 'verify') {
                try {
                    const { user: verified } = await verifyOnce(link.token);
                    setUser(verified);
                    setNotice({ kind: 'ok', text: `Welcome, ${verified.displayName}: your email is confirmed.` });
                    return;
                } catch (e) {
                    setNotice({ kind: 'error', text: e.message });
                }
            }
            const { user: current } = await fetchMe(controller.signal);
            setUser(current);
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

    return { user, setUser, notice, resetToken, clearLink };
}
