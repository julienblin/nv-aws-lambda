// tslint:disable-next-line:no-implicit-dependencies
import * as lambda from "aws-lambda";
import { parse as parseQS } from "querystring";
import { InternalServerError, NotFoundError, BadRequestError } from "./errors";
import { isAPIGatewayProxyResultProvider, OKResult } from "./results";
import { defaultConfidentialityReplacer } from "./utils";

export interface LambdaProxyFunctionArgs {
  context: lambda.Context;
  event: lambda.APIGatewayEvent;
  parseBody<T>(): T | undefined;
}

export type LambdaProxyFunction =
  (args: LambdaProxyFunctionArgs) => Promise<object | undefined>;

export interface LambdaProxyError {
  context: lambda.Context;
  // tslint:disable-next-line:no-any
  error: any;
  event: lambda.APIGatewayEvent;
  result?: lambda.APIGatewayProxyResult;
}

export interface LambdaProxyOptions {
  /**
   * If true, adds Access-Control-Allow-Origin: * to the response headers
   * If a string, set the Access-Control-Allow-Origin to the string value.
   */
  cors?: boolean | string;

  /**
   * The custom error logger to use.
   * If not provided, will use console.error.
   */
  errorLogger?(lambdaProxyError: LambdaProxyError): void | Promise<void>;
}

const defaultErrorLogger = async (lambdaProxyError: LambdaProxyError) => {

  let parsedBody;

  if (lambdaProxyError.event.body) {
    try {
      parsedBody = JSON.parse(lambdaProxyError.event.body);
    } catch (parseError) {
      try {
        parsedBody = parseQS(lambdaProxyError.event.body);
      } catch (parseError) {
        console.error(parseError);
      }
    }
  }

  const payload = {
    error: lambdaProxyError.error.toString(),
    errorStackTrace: lambdaProxyError.error.stack,
    headers: lambdaProxyError.event.headers,
    httpMethod: lambdaProxyError.event.httpMethod,
    parsedBody,
    path: lambdaProxyError.event.path,
    requestContext: lambdaProxyError.event.requestContext,
    response: lambdaProxyError.result,
  };

  const JSON_STRINGIFY_SPACE = 2;

  console.error(JSON.stringify(payload, defaultConfidentialityReplacer, JSON_STRINGIFY_SPACE));
};

/**
 * Parses the body of a request. Form or JSON.
 */
const parseBody = <T>(event: lambda.APIGatewayProxyEvent): T | undefined => {
  if (event.httpMethod === "GET") {
    return undefined;
  }

  if (!event.body) {
    return undefined;
  }

  let contentType: string | undefined;

  if (event.headers) {
    if (event.headers["Content-Type"]) {
      contentType = event.headers["Content-Type"].toLowerCase();
    } else {
      if (event.headers["content-type"]) {
        contentType = event.headers["content-type"].toLowerCase();
      }
    }
  }

  if (!contentType) {
    contentType = "application/json";
  }

  switch (contentType) {
    case "application/json":
    case "text/json":
      try {
        return JSON.parse(event.body) as T;
      } catch (jsonParseError) {
        throw new BadRequestError(jsonParseError.message);
      }

    case "application/x-www-form-urlencoded":
      try {
        return parseQS<T>(event.body);
      } catch (formParseError) {
        throw new BadRequestError(formParseError.message);
      }

    default:
      throw new BadRequestError(`Unrecognized content-type: ${contentType}.`);
  }
};

/**
 * Creates a wrapper for a Lambda function bound to API Gateway using PROXY.
 * @param func - The function to wrap.
 * @param options - various options.
 */
export const lambdaProxy =
  (func: LambdaProxyFunction, options: LambdaProxyOptions = {}): lambda.APIGatewayProxyHandler =>
    async (event: lambda.APIGatewayProxyEvent, context: lambda.Context, callback: lambda.ProxyCallback)
      : Promise<lambda.APIGatewayProxyResult> => {

      let proxyResult: lambda.APIGatewayProxyResult | undefined;

      try {
        const funcResult = await func({
          context,
          event,
          parseBody: () => parseBody(event),
        });

        if (funcResult) {
          proxyResult = funcResult && isAPIGatewayProxyResultProvider(funcResult)
          ? funcResult.getAPIGatewayProxyResult()
          : new OKResult(funcResult).getAPIGatewayProxyResult();
        } else {
          proxyResult = new NotFoundError(event.path).getAPIGatewayProxyResult();
        }

      } catch (error) {
        // tslint:disable:no-unsafe-any
        proxyResult = isAPIGatewayProxyResultProvider(error)
          ? error.getAPIGatewayProxyResult()
          : new InternalServerError(error.message ? error.message : error.toString()).getAPIGatewayProxyResult();
        // tslint:enable:no-unsafe-any

        if (!options.errorLogger) {
          options.errorLogger = defaultErrorLogger;
        }

        try {
          const loggerPromise = options.errorLogger({ event, context, error, result: proxyResult });
          if (loggerPromise) {
            await loggerPromise;
          }
        } catch (loggerError) {
          console.error(loggerError);
        }
      }

      if (!proxyResult) {
        throw new Error("Internal error in createLambdaProxy - proxyResult should not be null.");
      }

      if (options.cors) {
        proxyResult.headers = {
          ...proxyResult.headers,
          "Access-Control-Allow-Origin": typeof(options.cors) === "string" ? options.cors : "*",
        };
      }

      return proxyResult;
    };
