import { expect } from "chai";
import { describe, it } from "mocha";
import { dependencyErrorProxy, internalServerError, StandardErrorCodes } from "../../../src/core/errors";

describe("dependencyErrorProxy", () => {

  const RESULT = 42;

  class TestTarget {

    public promiseInvoked = false;
    public standardInvoked = false;

    public managedError = () => {
      throw internalServerError("This is a managed error");
    }

    public async promiseFunc(thro?: boolean, timeout = 10) {
      return new Promise((resolve, reject) => {
        setTimeout(
          () => {
            this.promiseInvoked = true;

            if (thro) {
              reject(new Error("promiseFunc"));
            }

            resolve(RESULT);
          },
          timeout);
      });
    }

    public standardFunc(thro?: boolean) {
      this.standardInvoked = true;

      if (thro) {
        throw new Error("standardFunc");
      }

      return RESULT;
    }

  }

  it("should forward no-promise calls", () => {
    const target = new TestTarget();
    const proxy = dependencyErrorProxy(target, "TestTarget");

    const result = proxy.standardFunc();

    expect(result).to.equal(RESULT);
    expect(proxy.standardInvoked).to.be.true;
  });

  it("should keep field access", () => {
    const target = new TestTarget();
    const proxy = dependencyErrorProxy(target, "TestTarget");
    expect(proxy.standardInvoked).to.be.false;
  });

  it("should encapsulate no-promise calls errors", () => {
    const target = new TestTarget();
    const proxy = dependencyErrorProxy(target, "TestTarget");

    try {
      proxy.standardFunc(true);
      expect.fail();
    } catch (error) {
      expect(error.code).to.equal(StandardErrorCodes.DependencyError);
      expect(error.target).to.equal("TestTarget");
    }
  });

  it("should forward promise calls", async () => {
    const target = new TestTarget();
    const proxy = dependencyErrorProxy(target, "TestTarget");

    const result = await proxy.promiseFunc();

    expect(result).to.equal(RESULT);
    expect(proxy.promiseInvoked).to.be.true;
  });

  it("should encapsulate promise calls errors", async () => {
    const target = new TestTarget();
    const proxy = dependencyErrorProxy(target, "TestTarget");

    try {
      await proxy.promiseFunc(true);
      expect.fail();
    } catch (error) {
      expect(error.code).to.equal(StandardErrorCodes.DependencyError);
      expect(error.target).to.equal("TestTarget");
    }
  });

  it("should not encapsulate managed errors", async () => {
    const target = new TestTarget();
    const proxy = dependencyErrorProxy(target, "TestTarget");

    try {
      proxy.managedError();
      expect.fail();
    } catch (error) {
      expect(error.code).to.equal(StandardErrorCodes.InternalServerError);
    }
  });

});
