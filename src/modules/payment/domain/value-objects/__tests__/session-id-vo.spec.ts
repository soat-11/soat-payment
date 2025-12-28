import { SessionIdInvalidException } from '@payment/domain/exceptions/payment.exception';

import { SessionIdVO } from '@/modules/payment/domain/value-objects/session-id.vo';

describe('SessionIdVO', () => {
  describe('create', () => {
    it('should create a valid SessionIdVO with UUID v4', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';

      const sessionId = SessionIdVO.create(validUuid);

      expect(sessionId).toBeInstanceOf(SessionIdVO);
      expect(sessionId.value).toBe(validUuid);
    });

    it('should throw SessionIdInvalidException when sessionId is empty', () => {
      expect(() => SessionIdVO.create('')).toThrow(SessionIdInvalidException);
    });

    it('should throw SessionIdInvalidException when sessionId is only spaces', () => {
      expect(() => SessionIdVO.create('   ')).toThrow(
        SessionIdInvalidException,
      );
    });

    it('should throw SessionIdInvalidException when sessionId is not a valid UUID', () => {
      expect(() => SessionIdVO.create('invalid-uuid')).toThrow(
        SessionIdInvalidException,
      );
    });

    it('should throw SessionIdInvalidException when sessionId is a random string', () => {
      expect(() => SessionIdVO.create('abc-123-def')).toThrow(
        SessionIdInvalidException,
      );
    });
  });

  describe('toString', () => {
    it('should return the session ID value as string', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = SessionIdVO.create(validUuid);

      expect(sessionId.toString()).toBe(validUuid);
    });
  });

  describe('equals', () => {
    it('should return true when comparing two SessionIdVO with same value', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId1 = SessionIdVO.create(validUuid);
      const sessionId2 = SessionIdVO.create(validUuid);

      expect(sessionId1.equals(sessionId2)).toBe(true);
    });

    it('should return false when comparing two SessionIdVO with different values', () => {
      const uuid1 = '550e8400-e29b-41d4-a716-446655440000';
      const uuid2 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      const sessionId1 = SessionIdVO.create(uuid1);
      const sessionId2 = SessionIdVO.create(uuid2);

      expect(sessionId1.equals(sessionId2)).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = SessionIdVO.create(validUuid);

      expect(sessionId.equals(undefined)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should be immutable after creation', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = SessionIdVO.create(validUuid);

      expect(() => {
        // @ts-expect-error - Trying to modify immutable object
        sessionId.value = 'another-value';
      }).toThrow();
    });
  });
});
