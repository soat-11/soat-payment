import { Transform } from 'class-transformer';

/**
 * Transformer que converte string base64 em Buffer
 * Equivalente ao transform do Zod
 */
export function Base64ToBuffer() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      throw new Error('Value must be a string');
    }

    // Validar formato base64
    const base64Pattern = /^data:image\/png;base64,/;
    if (!base64Pattern.test(value)) {
      throw new Error('Invalid base64 image format');
    }

    // Remover o prefixo e converter para Buffer
    return Buffer.from(value.replace(/^data:image\/png;base64,/, ''), 'base64');
  });
}
