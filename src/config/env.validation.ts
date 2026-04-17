import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().uri().required(),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  VERIFY_TOKEN: Joi.string().required(),
  BFF_WHATSAPP_SENDER_HOST: Joi.string().hostname().required(),
  BFF_WHATSAPP_SENDER_PORT: Joi.number().required(),  
});
