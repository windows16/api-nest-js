import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    AuthModule,
    UsersModule,
    PaymentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
