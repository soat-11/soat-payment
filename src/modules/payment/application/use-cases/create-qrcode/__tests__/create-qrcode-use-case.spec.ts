import { CreateQRCodeImageUseCaseImpl } from '@payment/application/use-cases/create-qrcode/create-qrcode-impl.use-case';

describe('CreateQRCodeImageUseCase', () => {
  describe('Success', () => {
    it('should be defined', async () => {
      const response = await new CreateQRCodeImageUseCaseImpl().execute({
        qrData:
          '00020101021243650016COM.MERCADOLIBRE0201306361d9a40b3-4947-49a2-805e-9e5dc845d9075204000053039865802BR5909Test Test6009SAO PAULO62070503***6304D11D',
      });

      expect(response.isSuccess).toBeTruthy();
      expect(response.value.image).toMatch('data:image/png;base64');
    });
  });
});
