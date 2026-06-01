import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentRequiredException extends HttpException {
  constructor(message = 'Se requiere una suscripción activa') {
    super({ message, error: 'Payment Required' }, HttpStatus.PAYMENT_REQUIRED);
  }
}
