import { Provider } from '@nestjs/common';
import { MercadoPagoConfig } from 'mercadopago';
import { env } from 'src/config/env';

export const MP_CLIENT = 'MP_CLIENT';

export const MercadoPagoProvider: Provider = {
  provide: MP_CLIENT,
  useFactory: () => new MercadoPagoConfig({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN }),
};
