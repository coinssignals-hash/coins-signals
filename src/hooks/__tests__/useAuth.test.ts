import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';

// Mock Supabase client
const mockGetSession = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signOut: () => mockSignOut(),
      onAuthStateChange: (cb: Function) => {
        mockOnAuthStateChange(cb);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
    from: () => ({
      select: (...args: any[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: any[]) => {
            mockEq(...eqArgs);
            return { maybeSingle: () => mockMaybeSingle() };
          },
        };
      },
      update: (...args: any[]) => {
        mockUpdate(...args);
        return {
          eq: () => ({ error: null }),
        };
      },
    }),
  },
}));

describe('useAuth', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockSession = { user: mockUser, access_token: 'token-abc' };
  const mockProfile = {
    id: 'user-123',
    first_name: 'John',
    last_name: 'Doe',
    avatar_url: null,
    country: 'US',
    timezone: 'UTC',
    push_notifications_enabled: false,
    email_notifications_enabled: true,
    signal_alerts_enabled: true,
    whatsapp_number: null,
    whatsapp_notifications_enabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockSignOut.mockResolvedValue({});
  });

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('loads session and sets user on mount', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });
    mockMaybeSingle.mockResolvedValue({ data: mockProfile, error: null });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('fetches profile when session exists', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });
    mockMaybeSingle.mockResolvedValue({ data: mockProfile, error: null });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.profile).toEqual(mockProfile);
    });

    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
  });

  it('handles no session (unauthenticated)', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles profile fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });
    mockMaybeSingle.mockResolvedValue({ data: null, error: new Error('DB error') });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('signOut clears session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });
    mockMaybeSingle.mockResolvedValue({ data: mockProfile, error: null });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('subscribes to auth state changes', () => {
    renderHook(() => useAuth());
    expect(mockOnAuthStateChange).toHaveBeenCalledWith(expect.any(Function));
  });

  it('updateProfile calls supabase update', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });
    mockMaybeSingle.mockResolvedValue({ data: mockProfile, error: null });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.updateProfile({ first_name: 'Jane' });
    });

    expect(mockUpdate).toHaveBeenCalledWith({ first_name: 'Jane' });
  });
});
