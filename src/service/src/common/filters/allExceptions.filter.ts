import { Result } from '@/common/result';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter<T> implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // 检查异常是否是 HttpException 类型
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error'; // 默认错误消息

    if (exception instanceof HttpException) {
      const exceptionRes: any = exception.getResponse();
      message = exceptionRes?.message
        ? Array.isArray(exceptionRes.message)
          ? exceptionRes.message[0]
          : exceptionRes.message
        : exceptionRes;
    } else if (typeof exception.getResponse === 'function') {
      // 如果异常有 getResponse 方法，调用它
      const exceptionRes: any = exception.getResponse();
      message = exceptionRes?.message
        ? Array.isArray(exceptionRes.message)
          ? exceptionRes.message[0]
          : exceptionRes.message
        : exceptionRes;
    }

    // 判断是否是API请求
    const isApiRequest = request.url.includes('/api/') || 
                        request.url.includes('/official/') || 
                        request.originalUrl?.includes('/api/') || 
                        request.originalUrl?.includes('/official/');

    // 只有在状态码为404且不是API请求时才重定向
    if (status === HttpStatus.NOT_FOUND && !isApiRequest) {
      // 如果是404错误，重定向到首页
      response.redirect('/');
    } else {
      // 对于API请求或其他错误，返回JSON响应
      const statusCode = status || 400;
      response.status(statusCode);
      response.header('Content-Type', 'application/json; charset=utf-8');
      response.send(
        Result.fail(statusCode, Array.isArray(message) ? message[0] : message)
      );
    }
  }
}
