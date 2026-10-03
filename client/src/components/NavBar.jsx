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
 *   [SilentSpirits logo] Redemption › Gear Creator          [Login] or [Profile] [Logout]
 *
 * user: the signed-in user ({ name }) or null. There's no login yet (it comes with the
 * SilentSpirits site), so without onLogin the [Login] button is shown but disabled.
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
                {user ? (
                    <>
                        <span className="nav_user">{user.name}</span>
                        <Button type="primary" onClick={onProfile}>[Profile]</Button>
                        <Button type="primary" onClick={onLogout}>[Logout]</Button>
                    </>
                ) : (
                    <Button
                        type="primary"
                        disabled={!onLogin}
                        title={onLogin ? 'Sign in' : 'Accounts are coming with the SilentSpirits site'}
                        onClick={onLogin}
                    >
                        [Login]
                    </Button>
                )}
            </div>
        </nav>
    );
}
