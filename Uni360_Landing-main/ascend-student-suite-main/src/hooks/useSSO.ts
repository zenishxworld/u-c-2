import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ACCESS_TOKEN_KEY = 'uni360_access_token';
const USER_KEY = 'uni360_user';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.uni360degree.com';

/**
 * SSO Auto-Login Hook
 *
 * Reads the `sso_token` from the URL hash fragment on page load.
 * Hash fragments are NEVER sent to servers — they are client-only.
 *
 * Flow:
 *  1. Landing page (uni360degree.com) opens:
 *     https://students.uni360degree.com/#sso_token=<JWT>
 *  2. This hook fires, extracts the token
 *  3. Stores token in localStorage under the portal's native keys
 *  4. Wipes the hash from the address bar immediately
 *  5. Fetches /students/profile to get user data
 *  6. Stores user → reloads page (triggering AuthContext to restore session)
 *     or redirects to /login if token is invalid
 */
export const useSSO = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash; // e.g. "#sso_token=eyJhbGci..."

    if (!hash || !hash.includes('sso_token=')) return;

    console.log('[SSO] Detected sso_token in URL hash — processing...');

    try {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const token = params.get('sso_token');

      if (!token) {
        console.warn('[SSO] sso_token param found but empty');
        return;
      }

      // ✅ Immediately wipe the hash from the address bar
      // replaceState does NOT add to browser history
      window.history.replaceState(null, '', window.location.pathname);

      // ✅ Store token using the exact key the portal's utils.js uses
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      console.log('[SSO] Token stored in localStorage');

      // ✅ Fetch profile to build user object that AuthContext expects
      fetch(`${BASE_URL}/api/v1/students/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          // The profile API returns { data: { basic_info, ... } } or { user: ... }
          const profileData = data.data || data;
          const basicInfo = profileData.basic_info || profileData;

          // Build a user object matching the portal's User type
          const user = {
            id: basicInfo.id || basicInfo.student_id || null,
            name: basicInfo.full_name || basicInfo.name || '',
            email: basicInfo.email || '',
            firstName: basicInfo.first_name || basicInfo.full_name?.split(' ')[0] || '',
            lastName: basicInfo.last_name || basicInfo.full_name?.split(' ').slice(1).join(' ') || '',
            phone: basicInfo.phone || basicInfo.phone_number || '',
            authProvider: 'SSO',
            isVerified: true,
            ssoLogin: true,
          };

          // ✅ Store user using the exact key the portal's utils.js uses
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          console.log('[SSO] User stored, redirecting to dashboard...');

          // ✅ Full page reload so AuthContext picks up the new localStorage values
          // This triggers initializeAuth() in AuthContext which reads getUser() + getToken()
          window.location.href = '/dashboard';
        })
        .catch((err) => {
          console.error('[SSO] Profile fetch failed, clearing token:', err);
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          navigate('/login');
        });

    } catch (e) {
      console.error('[SSO] Parse error:', e);
      navigate('/login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
