import { z, ZodError } from 'zod';
import { ArgumentsHost, ExceptionFilter, Injectable, PipeTransform } from './nest-compat';
import { getCurrentTenantContext } from './tenant-context';

export class ErpRpcException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ErpRpcException';
  }
}

@Injectable()
export class ZodValidationPipe<TSchema extends z.ZodTypeAny>
  implements PipeTransform<unknown, z.infer<TSchema>>
{
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): z.infer<TSchema> {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      throw new ErpRpcException(
        'VALIDATION_FAILED',
        'Payload failed @zynveo/contracts Zod validation',
        422,
        parsed.error.flatten(),
      );
    }
    return parsed.data;
  }
}

export interface FormattedErpError {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
    correlationId?: string;
  };
}

@Injectable()
export class RpcValidationFilter implements ExceptionFilter {
  catch(exception: unknown, _host?: ArgumentsHost): FormattedErpError {
    const correlationId = getCurrentTenantContext()?.correlationId;

    if (exception instanceof ErpRpcException) {
      return {
        success: false,
        error: {
          code: exception.code,
          message: exception.message,
          statusCode: exception.statusCode,
          details: exception.details,
          correlationId,
        },
      };
    }

    if (exception instanceof ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Schema validation error',
          statusCode: 422,
          details: exception.flatten(),
          correlationId,
        },
      };
    }

    const message =
      exception instanceof Error ? exception.message : 'Internal microservice error';

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
        statusCode: 500,
        correlationId,
      },
    };
  }
}

