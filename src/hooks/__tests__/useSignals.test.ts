import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSignals } from '../useSignals';

const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
const mockChannel = vi.fn().mockReturnValue({ on: mockOn });
const mockRemoveChannel = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockUpdateIn = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'trading_signals') {
        return {
          select: (...args: any[]) => {
            mockSelect(...args);
            return {
              order: (...oArgs: any[]) => {
                mockOrder(...oArgs);
                return {
                  then: undefined,
                  gte: (...gArgs: any[]) => {
                    mockGte(...gArgs);
                    return {
                      lte: (...lArgs: any[]) => {
                        mockLte(...lArgs);
                        // Return the query result
                        return Promise.resolve({ data: [], error: null });
                      },
                    };
                  },
                  // Without date filter, resolve directly
                  ...Promise.resolve({ data: [], error: null }),
                };
              },
            };
          },
          update: () => ({
            in: (...args: any[]) => {
              mockUpdateIn(...args);
              return Promise.resolve({ error: null });
            },
          }),
        };
      }
      return {};
    },
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

// We need to properly mock the query chain
// Let's use a simpler approach
vi.unmock('@/integrations/supabase/client');

const mockQueryResult = { data: [] as any[], error: null };

vi.mock('@/integrations/supabase/client', () => {
  const createQueryChain = (result: { data: any[]; error: any }) => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ error: null }),
      }),
      then: (resolve: Function) => resolve(result),
      // Make it thenable
      [Symbol.toStringTag]: 'Promise',
    };
    // Make the chain work as a promise
    Object.defineProperty(chain, 'then', {
      value: (onFulfilled?: (v: any) => any, onRejected?: (r: any) => any) =>
        Promise.resolve(result).then(onFulfilled, onRejected),
    });
    Object.defineProperty(chain, 'catch', {
      value: (onRejected?: (r: any) => any) => Promise.resolve(result).catch(onRejected),
    });
    return chain;
  };

  return {
    supabase: {
      from: () => createQueryChain(mockQueryResult),
      channel: () => ({
        on: () => ({
          subscribe: vi.fn(),
        }),
      }),
      removeChannel: vi.fn(),
    },
  };
});

describe('useSignals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryResult.data = [];
    mockQueryResult.error = null;
  });

  it('starts with loading state', () => {
    const { result } = renderHook(() => useSignals());
    expect(result.current.loading).toBe(true);
    expect(result.current.signals).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('loads signals and maps DB fields to camelCase', async () => {
    mockQueryResult.data = [
      {
        id: 'sig-1',
        currency_pair: 'EUR/USD',
        datetime: new Date().toISOString(),
        status: 'active',
        probability: 85,
        trend: 'bullish',
        action: 'BUY',
        entry_price: 1.1000,
        take_profit: 1.1050,
        take_profit_2: null,
        take_profit_3: null,
        stop_loss: 1.0950,
        support: 1.0900,
        resistance: 1.1100,
        notes: 'Test note',
        session_data: null,
        analysis_data: null,
        chart_image_url: null,
        closed_price: null,
        closed_result: null,
      },
    ];

    const { result } = renderHook(() => useSignals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.signals).toHaveLength(1);
    expect(result.current.signals[0].currencyPair).toBe('EUR/USD');
    expect(result.current.signals[0].entryPrice).toBe(1.1);
    expect(result.current.signals[0].takeProfit).toBe(1.105);
    expect(result.current.signals[0].stopLoss).toBe(1.095);
    expect(result.current.signals[0].action).toBe('BUY');
    expect(result.current.signals[0].trend).toBe('bullish');
  });

  it('handles fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockQueryResult.data = null as any;
    mockQueryResult.error = { message: 'Network error' };

    const { result } = renderHook(() => useSignals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    consoleSpy.mockRestore();
  });

  it('maps completed signal with closed result', async () => {
    mockQueryResult.data = [
      {
        id: 'sig-2',
        currency_pair: 'GBP/USD',
        datetime: new Date().toISOString(),
        status: 'completed',
        probability: 75,
        trend: 'bearish',
        action: 'SELL',
        entry_price: 1.2700,
        take_profit: 1.2600,
        take_profit_2: 1.2550,
        take_profit_3: null,
        stop_loss: 1.2800,
        support: null,
        resistance: null,
        notes: null,
        session_data: null,
        analysis_data: null,
        chart_image_url: null,
        closed_price: 1.2600,
        closed_result: 'tp_hit',
      },
    ];

    const { result } = renderHook(() => useSignals());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const signal = result.current.signals[0];
    expect(signal.closedPrice).toBe(1.26);
    expect(signal.closedResult).toBe('tp_hit');
    expect(signal.takeProfit2).toBe(1.255);
    expect(signal.takeProfit3).toBeUndefined();
  });

  it('returns empty array when no data', async () => {
    mockQueryResult.data = [];

    const { result } = renderHook(() => useSignals());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.signals).toEqual([]);
  });
});
