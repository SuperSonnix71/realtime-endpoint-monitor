const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'monitor_token';
const USER_KEY = 'monitor_user';

export type AuthUser = {
    id: string;
    username: string;
    mustChangePassword: boolean;
};

export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
}

export function isAuthenticated(): boolean {
    return getToken() !== null;
}

export function logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
}

export async function login(username: string, password: string): Promise<AuthUser> {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Login failed');
    }

    const data = await res.json();
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user as AuthUser;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to change password');
    }

    // Update stored user to reflect mustChangePassword = false
    const user = getUser();
    if (user) {
        user.mustChangePassword = false;
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const token = getToken();
    const headers = new Headers(init?.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(input, { ...init, headers });

    if (res.status === 401) {
        logout();
    }

    return res;
}
