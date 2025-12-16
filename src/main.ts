import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // Allows all origins (URLs)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allows common methods
    credentials: true, // Allows cookies and authorization headers
  });

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are sent
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
      exceptionFactory: (errors) => {
        // Group errors by field
        const errorsByField: Record<string, string[]> = {};

        errors.forEach((error) => {
          const field = error.property;
          const constraints = error.constraints || {};

          if (!errorsByField[field]) {
            errorsByField[field] = [];
          }

          // Add all constraint messages for this field
          Object.values(constraints).forEach((message) => {
            errorsByField[field].push(message);
          });
        });

        return new BadRequestException({
          message: 'Validation failed',
          errors: errorsByField,
          statusCode: 400,
        });
      },
    }),
  );

  const port = process.env.PORT ?? 3000;
  const host = process.env.HOST ?? 'localhost';

  await app.listen(port, host);
  console.log(`🚀 Application is running on: http://${host}:${port}`);
}
bootstrap();
