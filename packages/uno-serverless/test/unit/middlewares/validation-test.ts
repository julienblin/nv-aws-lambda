import { expect } from "chai";
import { StandardErrorCodes } from "../../../src/core/errors";
import { JSONSchema } from "../../../src/core/json-schema";
import { testAdapter, uno } from "../../../src/core/uno";
import { randomStr } from "../../../src/core/utils";
import { parseBodyAsJSON } from "../../../src/middlewares/http";
import { validateParameters } from "../../../src/middlewares/validation";
import { validateBody, validateEvent } from "../../../src/middlewares/validation";

describe("validateEvent middleware", () => {

  it("should validate event.", async () => {
    const schema: JSONSchema = {
      properties: {
        bar: {
          type: "string",
        },
        foo: {
          type: "number",
        },
      },
      required: ["bar"],
    };

    const handler = uno(testAdapter())
      .use(validateEvent(schema))
      .handler(async () => { });

    try {
      await handler(
        {
          foo: randomStr(),
        });
      expect.fail();
    } catch (error) {
      expect(error.code).to.equal(StandardErrorCodes.ValidationError);
    }
  });

});

describe("validateBody middleware", () => {

  it("should validate body.", async () => {
    const schema: JSONSchema = {
      additionalProperties: false,
      properties: {
        bar: {
          type: "string",
        },
        foo: {
          type: "number",
        },
      },
      required: ["bar"],
    };

    const handler = uno(testAdapter())
      .use([
        parseBodyAsJSON(),
        validateBody(schema),
      ])
      .handler(async () => { });

    try {
      await handler(
        {
          httpMethod: "put",
          rawBody: JSON.stringify({ foo: "foo" }),
        });
      expect.fail();
    } catch (error) {
      expect(error.code).to.equal(StandardErrorCodes.ValidationError);
    }
  });

  it("should validate missing body.", async () => {
    const handler = uno(testAdapter())
      .use([
        parseBodyAsJSON(),
        validateBody({}),
      ])
      .handler(async () => { });

    try {
      await handler(
        {
          httpMethod: "post",
        });
      expect.fail();
    } catch (error) {
      expect(error.code).to.equal(StandardErrorCodes.BadRequest);
    }
  });

  it("should not validate if HTTP method is not compatible.", async () => {
    const handler = uno(testAdapter())
      .use([
        parseBodyAsJSON(),
        validateBody({}),
      ])
      .handler(async () => { });

    await handler(
      {
        httpMethod: "get",
      });
    expect(true);
  });

  it("should throw if missing body.", async () => {
    const handler = uno(testAdapter())
      .use(validateBody({}))
      .handler(async () => { });

    try {
      await handler(
        {
          httpMethod: "patch",
        });
      expect.fail();
    } catch (error) {
      expect(error.message).to.contain("body");
    }
  });

});

describe("validateParameters middleware", () => {

  it("should validate parameters.", async () => {
    const schema: JSONSchema = {
      additionalProperties: false,
      properties: {
        bar: {
          type: "string",
        },
      },
      required: ["bar"],
    };

    const handler = uno(testAdapter())
      .use(validateParameters(schema))
      .handler(async () => { });

    try {
      await handler(
        {
          parameters: { bar: "foo", id: "5" },
        });
      expect.fail();
    } catch (error) {
      expect(error.code).to.equal(StandardErrorCodes.ValidationError);
    }
  });

});
