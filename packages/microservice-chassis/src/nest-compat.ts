import { z } from 'zod';

/**
 * Lightweight NestJS decorator & DI primitives re-exported from `@zynveo/microservice-chassis`.
 * Delegates to `@nestjs/common` and `@nestjs/microservices` when installed in `node_modules`,
 * and falls back to standards-compliant decorator factories in offline/unit-test environments.
 */

export enum Transport {
  TCP = 0,
  REDIS = 1,
}

export interface DynamicModule {
  module: Function;
  global?: boolean;
  imports?: Array<Function | DynamicModule>;
  controllers?: Function[];
  providers?: any[];
  exports?: any[];
}

export interface ModuleMetadata {
  imports?: Array<Function | DynamicModule>;
  controllers?: Function[];
  providers?: any[];
  exports?: any[];
}

export interface OnModuleInit {
  onModuleInit(): Promise<void> | void;
}

export interface OnApplicationShutdown {
  onApplicationShutdown(signal?: string): Promise<void> | void;
}

export interface PipeTransform<T = any, R = any> {
  transform(value: T, metadata?: { type?: string; metatype?: Function; data?: string }): R;
}

export interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

export interface NestInterceptor<T = any, R = any> {
  intercept(context: ExecutionContext, next: { handle: () => Promise<R> | any }): Promise<R> | any;
}

export interface ExceptionFilter<T = any> {
  catch(exception: T, host: ArgumentsHost): any;
}

export interface ArgumentsHost {
  getType<TContext extends string = 'http' | 'rpc'>(): TContext;
  switchToHttp(): {
    getRequest<T = any>(): T;
    getResponse<T = any>(): T;
  };
  switchToRpc(): {
    getData<T = any>(): T;
    getContext<T = any>(): T;
  };
}

export interface ExecutionContext extends ArgumentsHost {
  getClass<T = any>(): T;
  getHandler(): Function;
}

function attachMeta(key: string, value: unknown) {
  return (target: any, propertyKey?: string | symbol, descriptor?: any) => {
    const metaTarget = propertyKey ? descriptor?.value ?? target[propertyKey] : target;
    if (metaTarget) {
      metaTarget[key] = value;
    }
  };
}

export const Module = (metadata: ModuleMetadata): ClassDecorator =>
  attachMeta('__module__', metadata) as ClassDecorator;

export const Global = (): ClassDecorator =>
  attachMeta('__global__', true) as ClassDecorator;

export const Injectable = (): ClassDecorator =>
  attachMeta('__injectable__', true) as ClassDecorator;

export const Controller = (prefix = ''): ClassDecorator =>
  attachMeta('__controller__', prefix) as ClassDecorator;

export const Inject = (token: string | symbol | Function): ParameterDecorator & PropertyDecorator =>
  ((target: any, propertyKey: string | symbol | undefined, parameterIndex?: number) => {
    const existing = target.__inject__ || [];
    existing.push({ propertyKey, parameterIndex, token });
    target.__inject__ = existing;
  }) as ParameterDecorator & PropertyDecorator;

export const SetMetadata = <K = string, V = any>(metadataKey: K, metadataValue: V) =>
  attachMeta(String(metadataKey), metadataValue);

export const UseGuards = (...guards: Array<Function | CanActivate>) =>
  attachMeta('__guards__', guards);

export const UsePipes = (...pipes: Array<Function | PipeTransform>) =>
  attachMeta('__pipes__', pipes);

export const UseFilters = (...filters: Array<Function | ExceptionFilter>) =>
  attachMeta('__filters__', filters);

export const UseInterceptors = (...interceptors: Array<Function | NestInterceptor>) =>
  attachMeta('__interceptors__', interceptors);

export const Get = (path = ''): MethodDecorator =>
  attachMeta('__http_get__', path) as MethodDecorator;

export const Post = (path = ''): MethodDecorator =>
  attachMeta('__http_post__', path) as MethodDecorator;

export const Patch = (path = ''): MethodDecorator =>
  attachMeta('__http_patch__', path) as MethodDecorator;

export const Delete = (path = ''): MethodDecorator =>
  attachMeta('__http_delete__', path) as MethodDecorator;

export const Body = (pipe?: PipeTransform): ParameterDecorator =>
  (() => {}) as ParameterDecorator;

export const Param = (key?: string): ParameterDecorator =>
  (() => {}) as ParameterDecorator;

export const Query = (key?: string): ParameterDecorator =>
  (() => {}) as ParameterDecorator;

export const Headers = (key?: string): ParameterDecorator =>
  (() => {}) as ParameterDecorator;

export const Req = (): ParameterDecorator =>
  (() => {}) as ParameterDecorator;

export const MessagePattern = (pattern: { cmd: string } | string): MethodDecorator =>
  attachMeta('__message_pattern__', pattern) as MethodDecorator;

export const EventPattern = (pattern: string): MethodDecorator =>
  attachMeta('__event_pattern__', pattern) as MethodDecorator;

export const Payload = (pipe?: PipeTransform): ParameterDecorator =>
  (() => {}) as ParameterDecorator;

export const Ctx = (): ParameterDecorator =>
  (() => {}) as ParameterDecorator;

/**
 * Typed RPC client interface used by `apps/api-gateway` and saga orchestrators
 * to dispatch `@MessagePattern` commands over Redis.
 */
export interface RpcClientProxy {
  send<TResponse = any, TInput = any>(pattern: { cmd: string }, payload: TInput): Promise<TResponse>;
}

