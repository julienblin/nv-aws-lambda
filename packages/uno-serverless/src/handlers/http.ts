import * as pathToRegexp from "path-to-regexp";
import { internalServerError, methodNotAllowedError, notFoundError } from "../core/errors";
import { HttpMethod, HttpUnoEvent, isHttpUnoResponse } from "../core/schemas";
import { FunctionArg, FunctionExecution } from "../core/uno";
import { ok } from "./http-responses";

const runHttp = async <TServices>(
  func: HttpFunc<TServices>,
  arg: FunctionArg<HttpUnoEvent, TServices>) => {
  const result = await func(arg);

  if (result && isHttpUnoResponse(result)) {
    return result;
  }

  if (result) {
    return ok(result);
  } else {
    throw notFoundError(arg.event.url);
  }
};

export type HttpFunc<TServices> = (arg: FunctionArg<HttpUnoEvent, TServices>) => Promise<any>;

/**
 * This handler is for http integrations.
 * Allows to return any object as a result, and also passes
 * convenience methods in services for body and parameters.
 * Throws notFoundError if result is undefined, or return ok() if result is an object.
 * If returning a HttpUnoResponse, just passes it back.
 */
export const http = <TServices = any>(func: HttpFunc<TServices>)
  : FunctionExecution<HttpUnoEvent, TServices> => {
  return async (arg: FunctionArg<HttpUnoEvent, TServices>) =>
    runHttp(func, arg);
};

export type RouterMethods<TServices> = Partial<Record<HttpMethod, HttpFunc<TServices>>>;

/**
 * Same as http handler, but allow multiple handlers to be defined and segregated by event HTTP methods.
 */
export const httpMethodRouter = <TServices = any>(methods: RouterMethods<TServices>)
  : FunctionExecution<HttpUnoEvent, TServices> => {
  return async (arg: FunctionArg<HttpUnoEvent, TServices>) => {

    const func = methods[arg.event.httpMethod] as HttpFunc<TServices> | undefined;

    if (!func) {
      throw methodNotAllowedError(`Method ${arg.event.httpMethod} is not allowed.`);
    }

    return runHttp(func, arg);
  };
};

export type HttpRoutes<TServices> = Record<string, RouterMethods<TServices>>;

/**
 * Router for http integration.
 * @param router The router configuration
 * @param parameterName The name of the pathParameter used for catch all (e.g. users/{proxy+} -> proxy).
 */
export const httpRouter = <TServices = any>(router: HttpRoutes<TServices>, parameterName = "proxy")
  : FunctionExecution<HttpUnoEvent, TServices> => {

  const routerPaths = Object.keys(router).map((spec) => ({
    methods: router[spec],
    pathEval: pathToRegexp(spec),
    pathParameters: pathToRegexp.parse(spec).filter((x) => typeof x === "object"),
    spec,
  }));

  return async (arg: FunctionArg<HttpUnoEvent, TServices>) => {
    const subPath = decodeURIComponent(arg.event.parameters[parameterName] || "");

    for (const routerPath of routerPaths) {
      const pathEvaluation = routerPath.pathEval.exec(subPath);
      if (!pathEvaluation) {
        continue;
      }

      const func = routerPath.methods[arg.event.httpMethod] as HttpFunc<TServices> | undefined;

      if (!func) {
        throw methodNotAllowedError(`Method ${arg.event.httpMethod} is not allowed.`);
      }

      for (let index = 0; index < pathEvaluation.length; index++) {
        const element = pathEvaluation[index + 1];
        if (element) {
          const pathParameter = routerPath.pathParameters[index];
          if (typeof pathParameter === "object") {
            arg.event.parameters[pathParameter.name] = element;
          }
        }
      }

      return runHttp(func, arg);
    }

    throw notFoundError(arg.event.url, "No suitable route found.", { [parameterName]: subPath });
  };

};
