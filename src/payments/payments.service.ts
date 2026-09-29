import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  findByUser(userId: string) {
    return {
      userId,
      payments: [],
    };
  }
}
