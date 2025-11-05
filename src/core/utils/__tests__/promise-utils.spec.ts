import { executeAllOrFail } from '../promise-utils';

describe('PromiseUtils', () => {
  describe('executeAllOrFail', () => {
    it('should resolve when all promises succeed', async () => {
      const promise1 = Promise.resolve(1);
      const promise2 = Promise.resolve(2);
      const promise3 = Promise.resolve(3);

      await expect(
        executeAllOrFail([promise1, promise2, promise3]),
      ).resolves.toBeUndefined();
    });

    it('should wait for all promises to complete before throwing', async () => {
      const completionOrder: string[] = [];

      const slowPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          completionOrder.push('slow');
          resolve();
        }, 50);
      });

      const fastFailingPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          completionOrder.push('fast-fail');
          reject(new Error('Fast failure'));
        }, 10);
      });

      await expect(
        executeAllOrFail([slowPromise, fastFailingPromise]),
      ).rejects.toThrow('Fast failure');

      // Ensure slow promise completed before rejection was thrown
      expect(completionOrder).toEqual(['fast-fail', 'slow']);
    });

    it('should throw the first rejection reason when one promise fails', async () => {
      const promise1 = Promise.resolve(1);
      const promise2 = Promise.reject(new Error('Promise 2 failed'));
      const promise3 = Promise.resolve(3);

      await expect(
        executeAllOrFail([promise1, promise2, promise3]),
      ).rejects.toThrow('Promise 2 failed');
    });

    it('should throw the first rejection when multiple promises fail', async () => {
      const promise1 = Promise.reject(new Error('First failure'));
      const promise2 = Promise.reject(new Error('Second failure'));
      const promise3 = Promise.resolve(3);

      await expect(
        executeAllOrFail([promise1, promise2, promise3]),
      ).rejects.toThrow('First failure');
    });

    it('should work with empty array', async () => {
      await expect(executeAllOrFail([])).resolves.toBeUndefined();
    });

    it('should preserve error types', async () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const promise = Promise.reject(new CustomError('Custom error'));

      await expect(executeAllOrFail([promise])).rejects.toThrow(CustomError);
    });
  });
});




