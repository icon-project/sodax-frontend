import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  submitTransaction,
  getTransactionPackets,
  getPacket,
  type IntentRelayRequest,
  type SubmitTxResponse,
  type GetTransactionPacketsResponse,
  type GetPacketResponse,
} from './IntentRelayApiService.js';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('IntentRelayApiService', () => {
  const apiUrl = 'https://api.example.com/relay';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('submitTransaction', () => {
    it('should call postRequest with submit action', async () => {
      // Arrange
      const mockResponse: SubmitTxResponse = {
        success: true,
        message: 'Transaction submitted',
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const payload = {
        action: 'submit',
        params: {
          chain_id: '1',
          tx_hash: '0x123',
        },
      } satisfies IntentRelayRequest<'submit'>;

      // Act
      const result = await submitTransaction(payload, apiUrl);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  it('should call postRequest with submit action and get failed response', async () => {
    // Arrange
    const mockResponse: SubmitTxResponse = {
      success: false,
      message: 'Invalid input parameters. must contain source_chain_id and tx_hash',
    };
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const payload: IntentRelayRequest<'submit'> = {
      action: 'submit',
      params: {
        chain_id: '1',
        tx_hash: '0x123',
      },
    };

    // Act
    const result = await submitTransaction(payload, apiUrl);

    // Assert
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResponse);
  });

  describe('getTransactionPackets', () => {
    it('should call postRequest with get_transaction_packets action', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: [
          {
            src_chain_id: 1,
            src_tx_hash: '0x123',
            src_address: '0xabc',
            status: 'executed',
            dst_chain_id: 2,
            conn_sn: 1,
            dst_address: '0xdef',
            dst_tx_hash: '0x456',
            signatures: ['sig1', 'sig2'],
            payload: 'data',
          },
        ],
      } satisfies GetTransactionPacketsResponse;
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const payload = {
        action: 'get_transaction_packets',
        params: {
          chain_id: '1',
          tx_hash: '0x123',
        },
      } satisfies IntentRelayRequest<'get_transaction_packets'>;

      // Act
      const result = await getTransactionPackets(payload, apiUrl);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPacket', () => {
    it('should call postRequest with get_packet action', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          src_chain_id: 1,
          src_tx_hash: '0x123',
          src_address: '0xabc',
          status: 'executed',
          dst_chain_id: 2,
          conn_sn: 1,
          dst_address: '0xdef',
          dst_tx_hash: '0x456',
          signatures: ['sig1', 'sig2'],
          payload: 'data',
        },
      } satisfies GetPacketResponse;

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const payload: IntentRelayRequest<'get_packet'> = {
        action: 'get_packet',
        params: {
          chain_id: '1',
          tx_hash: '0x123',
          conn_sn: '1',
        },
      };

      // Act
      const result = await getPacket(payload, apiUrl);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });
});
