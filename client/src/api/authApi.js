// Accounts: the API's auth/ routes. The sign-in itself is a cookie the browser keeps; each of
// these resolves to the API's JSON (most to { user }, the signed-in user or null).

import { request } from './itemCreatorApi.js';

const post = (path, body = {}) =>
    request(`auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).then((response) => response.json());

/**
 * { user, providers }: who's signed in (null for nobody), and the other ways to sign in that are set
 * up (['google']). user: { id, email, displayName, role, verified, hasPassword }.
 */
export const fetchMe = (signal) => request('auth/me', { signal }).then((response) => response.json());

/**
 * Starts Sign in with Google: a full-page trip to Google and back. The API returns the browser to
 * the client with ?signin=google, or ?signin_error=<reason> (see useAuth).
 */
export function signInWithGoogle() {
    window.location.assign('itemcreator/auth/google/start');
}

export const signIn = (email, password) => post('login', { email, password });
export const signOut = () => post('logout');

/** Resolves to { message } (always the same, whether or not the email already has an account). */
export const register = (email, password, displayName) => post('register', { email, password, displayName });
export const verifyEmail = (token) => post('verifyemail', { token });
export const resendVerification = () => post('resendverification');

export const forgotPassword = (email) => post('forgotpassword', { email });
export const resetPassword = (token, password) => post('resetpassword', { token, password });

export const updateProfile = (displayName) => post('updateprofile', { displayName });
export const changePassword = (currentPassword, newPassword) => post('changepassword', { currentPassword, newPassword });
