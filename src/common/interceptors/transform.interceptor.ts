import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, map, throwError } from 'rxjs';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Aplica class-transformer a TODAS las respuestas
        return instanceToPlain(data);
      }),
      catchError((err) => {
        // NO tocar el error, dejar que el HttpExceptionFilter lo maneje
        return throwError(() => err);
      }),
    );
  }
}
