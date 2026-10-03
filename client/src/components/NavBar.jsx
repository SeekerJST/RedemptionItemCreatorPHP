import { Button } from '@svar-ui/react-core';
import logo from '../../icons/SSGSLogo.png';

/**
 * Where the bar's links go. The logo goes to the current SilentSpirits Games site, which what we're
 * building here will eventually replace. Redemption's own page doesn't exist yet, so it points at
 * the site root for now; change it here when it does.
 */
const NAV_LINKS = {
    home: 'https://www.silentspiritsgames.com/',
    redemption: '/',
};

/**
 * The site's navigation bar, across the top of the three panels:
 *   [SilentSpirits logo] Redemption › Gear Creator          [Login] or name [Profile] [Logout]
 *
 * user: the signed-in user ({ displayName, verified }), null for nobody, or undefined while
 * that's still loading (no buttons yet).
 */
export default function NavBar({ user = null, onLogin, onLogout, onProfile }) {
    return (
        <nav className="rd-panel nav_bar" aria-label="Site">
            <div className="nav_left">
                <a href={NAV_LINKS.home} className="nav_logo" title="SilentSpirits Games">
                    <img src={logo} alt="SilentSpirits Games" />
                </a>
                <a href={NAV_LINKS.redemption} className="rd-title nav_game">Redemption</a>
                <span className="nav_separator" aria-hidden="true">›</span>
                <span className="nav_tool" aria-current="page">Gear Creator</span>
            </div>
            <div className="nav_right">
                {user === undefined ? null : user ? (
                    <>
                        <span className="nav_user">{user.displayName}</span>
                        {!user.verified && (
                            <span className="nav_unverified" title="Confirm your email to save items: see [Profile]">unconfirmed</span>
                        )}
                        <Button type="primary" onClick={onProfile}>[Profile]</Button>
                        <Button type="primary" onClick={onLogout}>[Logout]</Button>
                    </>
                ) : (
                    <Button type="primary" title="Sign in, or create an account" onClick={onLogin}>
                        [Login]
                    </Button>
                )}
            </div>
        </nav>
    );
}
