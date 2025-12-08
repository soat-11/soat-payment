import { Transform } from 'class-transformer';

export function Base64ToBuffer() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      throw new Error('Value must be a string');
    }

    const base64Pattern = /^data:image\/png;base64,/;
    if (!base64Pattern.test(value)) {
      throw new Error('Invalid base64 image format');
    }

    return Buffer.from(value.replace(/^data:image\/png;base64,/, ''), 'base64');
  });
}
