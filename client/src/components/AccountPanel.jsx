import { useState } from 'react';
import {
    changePassword,
    forgotPassword,
    register,
    resendVerification,
    resetPassword,
    signIn,
    signInWithGoogle,
    updateProfile,
} from '../api/authApi.js';

/** The API's rule (AuthController::MIN_PASSWORD), checked here too so the form can say so first. */
const MIN_PASSWORD = 10;

/** One labelled field. */
function Field({ label, ...input }) {
    return (
        <label className="account_field">
            <span>{label}</span>
            <input className="rd-field" {...input} />
        </label>
    );
}

/**
 * Runs a form's API call: the button is disabled meanwhile, and the result (the API's message, or
 * its error) is shown under the form.
 */
function useSubmit() {
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);
    const submit = (work) => async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage(null);
        try {
            const text = await work();
            if (text) {
                setMessage({ kind: 'ok', text });
            }
        } catch (e) {
            setMessage({ kind: 'error', text: e.message });
        } finally {
            setBusy(false);
        }
    };
    return { busy, message, setMessage, submit };
}

function Message({ message }) {
    return message ? (
        <p className={`account_message ${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>
            {message.text}
        </p>
    ) : null;
}

/** "Sign in with Google", when the site has it set up. */
function ProviderButtons({ providers }) {
    if (!providers?.includes('google')) {
        return null;
    }
    return (
        <div className="account_providers">
            <button type="button" className="rd-button account_google" onClick={signInWithGoogle}>
                [Sign in with Google]
            </button>
            <p className="account_note">Signing in with Google for the first time creates your account; an account with the same email is linked.</p>
            <p className="account_or" aria-hidden="true">or</p>
        </div>
    );
}

const tooShort = (password) =>
    password.length < MIN_PASSWORD ? `Passwords need at least ${MIN_PASSWORD} characters.` : null;

function SignInForm({ onSignedIn, onMode, providers }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { busy, message, submit } = useSubmit();
    return (
        <form
            onSubmit={submit(async () => {
                const { user } = await signIn(email, password);
                onSignedIn(user);
            })}
        >
            <h2 className="rd-heading">Sign in</h2>
            <ProviderButtons providers={providers} />
            <Field label="Email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <Message message={message} />
            <div className="account_actions">
                <button type="submit" className="rd-button" disabled={busy}>[Sign in]</button>
            </div>
            <p className="account_links">
                <button type="button" className="account_link" onClick={() => onMode('register')}>Create an account</button>
                <button type="button" className="account_link" onClick={() => onMode('forgot')}>Forgot your password?</button>
            </p>
        </form>
    );
}

function RegisterForm({ onMode, providers }) {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [sent, setSent] = useState(false);
    const { busy, message, setMessage, submit } = useSubmit();
    return (
        <form
            onSubmit={submit(async () => {
                const problem = tooShort(password);
                if (problem) {
                    setMessage({ kind: 'error', text: problem });
                    return null;
                }
                const result = await register(email, password, displayName);
                setSent(true);
                return result.message;
            })}
        >
            <h2 className="rd-heading">Create an account</h2>
            <p className="account_note">Anyone can browse the catalog. An account lets you save your own items; they stay private to you.</p>
            <ProviderButtons providers={providers} />
            <Field label="Display name" autoComplete="nickname" required maxLength={60} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field
                label={`Password (at least ${MIN_PASSWORD} characters)`}
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <Message message={message} />
            <div className="account_actions">
                <button type="submit" className="rd-button" disabled={busy || sent}>[Create account]</button>
            </div>
            <p className="account_links">
                <button type="button" className="account_link" onClick={() => onMode('signIn')}>I have an account</button>
            </p>
        </form>
    );
}

function ForgotForm({ onMode }) {
    const [email, setEmail] = useState('');
    const { busy, message, submit } = useSubmit();
    return (
        <form onSubmit={submit(async () => (await forgotPassword(email)).message)}>
            <h2 className="rd-heading">Reset your password</h2>
            <p className="account_note">We'll email you a link to choose a new one. It works for an hour.</p>
            <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Message message={message} />
            <div className="account_actions">
                <button type="submit" className="rd-button" disabled={busy}>[Send the link]</button>
            </div>
            <p className="account_links">
                <button type="button" className="account_link" onClick={() => onMode('signIn')}>Back to sign in</button>
            </p>
        </form>
    );
}

/** Reached from the reset email's link (?reset=...). */
function ResetForm({ token, onSignedIn }) {
    const [password, setPassword] = useState('');
    const { busy, message, setMessage, submit } = useSubmit();
    return (
        <form
            onSubmit={submit(async () => {
                const problem = tooShort(password);
                if (problem) {
                    setMessage({ kind: 'error', text: problem });
                    return null;
                }
                const { user } = await resetPassword(token, password);
                onSignedIn(user);
            })}
        >
            <h2 className="rd-heading">Choose a new password</h2>
            <Field
                label={`New password (at least ${MIN_PASSWORD} characters)`}
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <Message message={message} />
            <div className="account_actions">
                <button type="submit" className="rd-button" disabled={busy}>[Set password]</button>
            </div>
        </form>
    );
}

function ProfileForms({ user, onUserChange }) {
    const [displayName, setDisplayName] = useState(user.displayName);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const name = useSubmit();
    const password = useSubmit();
    const resend = useSubmit();
    return (
        <>
            <h2 className="rd-heading">Profile</h2>
            <p className="account_note">
                Signed in as <strong>{user.email}</strong>
            </p>
            {!user.verified && (
                <form className="account_unverified" onSubmit={resend.submit(async () => (await resendVerification()).message)}>
                    <p>Your email isn't confirmed yet, so you can't save items. Use the link we emailed you.</p>
                    <Message message={resend.message} />
                    <div className="account_actions">
                        <button type="submit" className="rd-button" disabled={resend.busy}>[Send it again]</button>
                    </div>
                </form>
            )}
            <form
                onSubmit={name.submit(async () => {
                    const { user: updated } = await updateProfile(displayName);
                    onUserChange(updated);
                    setDisplayName(updated.displayName);
                    return 'Your display name is saved.';
                })}
            >
                <Field label="Display name" autoComplete="nickname" required maxLength={60} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                <Message message={name.message} />
                <div className="account_actions">
                    <button type="submit" className="rd-button" disabled={name.busy || displayName.trim() === user.displayName}>[Save name]</button>
                </div>
            </form>
            <form
                onSubmit={password.submit(async () => {
                    const problem = tooShort(newPassword);
                    if (problem) {
                        password.setMessage({ kind: 'error', text: problem });
                        return null;
                    }
                    const result = await changePassword(currentPassword, newPassword);
                    setCurrentPassword('');
                    setNewPassword('');
                    if (!user.hasPassword) {
                        onUserChange({ ...user, hasPassword: true });
                    }
                    return result.message;
                })}
            >
                <h3 className="rd-heading">{user.hasPassword ? 'Change password' : 'Set a password'}</h3>
                {!user.hasPassword && (
                    <p className="account_note">You sign in with Google. A password lets you sign in with your email too.</p>
                )}
                {/* For password managers: which account this is. */}
                <input type="email" autoComplete="username" value={user.email} readOnly hidden />
                {user.hasPassword && (
                    <Field label="Current password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                )}
                <Field
                    label={`New password (at least ${MIN_PASSWORD} characters)`}
                    type="password"
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <Message message={password.message} />
                <div className="account_actions">
                    <button type="submit" className="rd-button" disabled={password.busy}>{user.hasPassword ? '[Change password]' : '[Set password]'}</button>
                </div>
            </form>
        </>
    );
}

/**
 * The account panel, opened from the nav bar: sign in, create an account, reset a password, or
 * (signed in) the profile. A panel on the page rather than a browser dialog, so nothing blocks.
 *
 * mode: 'signIn' | 'register' | 'forgot' | 'reset' | 'profile'
 * resetToken: the reset email's token, for mode 'reset'
 * onUserChange(user): someone signed in, or their details changed
 * providers: other ways to sign in that are set up (['google']), from useAuth
 */
export default function AccountPanel({ mode, user, resetToken, providers = [], onMode, onUserChange, onClose }) {
    const signedIn = (next) => {
        onUserChange(next);
        onClose();
    };
    let body;
    if (mode === 'profile' && user) {
        body = <ProfileForms user={user} onUserChange={onUserChange} />;
    } else if (mode === 'reset' && resetToken) {
        body = <ResetForm token={resetToken} onSignedIn={signedIn} />;
    } else if (mode === 'register') {
        body = <RegisterForm onMode={onMode} providers={providers} />;
    } else if (mode === 'forgot') {
        body = <ForgotForm onMode={onMode} />;
    } else {
        body = <SignInForm onSignedIn={signedIn} onMode={onMode} providers={providers} />;
    }
    return (
        <section className="rd-panel account_panel" aria-label="Account">
            <button type="button" className="account_close" title="Close" aria-label="Close" onClick={onClose}>
                ×
            </button>
            {/* A fresh form per mode, so one form's half-typed fields don't carry into the next. */}
            <div key={mode}>{body}</div>
        </section>
    );
}
