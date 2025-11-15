import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prsima/prisma.module';
import { EventsModule } from './events/events.module';
import { AreasModule } from './areas/areas.module';
import { VendorsModule } from './vendors/vendors.module';
import { TalModule } from './external/providers/tal/tal.module';
import { MenusModule } from './menus/menus.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { JwtGuard } from './shared/guards/jwt.guard';
import { RestaurantsModule } from './restaurants/restaurants.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    EventsModule,
    TalModule,
    AreasModule,
    VendorsModule,
    MenusModule,
    RecommendationsModule,
    RestaurantsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
  ],
})
export class AppModule {}
