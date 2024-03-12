import {safelyExecute, safelyExecuteAsync} from "../otherTransforms";
import {doOnError, doOnSuccess} from "../resultCurriers";

describe("Other transforms", () => {
    describe("safelyExecute", () => {
        test("it can turn throw exceptions into failure results", () => {
            safelyExecute(() => {
                throw Error("HELLO!")
            })
                .doOnError(e => expect(e).toEqual("HELLO!"))
                .doOnSuccess(_ => fail("Should have resulted in an error"))
        })

        test("it can turn thrown strings into failure results", () => {
            safelyExecute(() => {
                throw "HELLO!"
            })
                .doOnError(e => expect(e).toEqual("HELLO!"))
                .doOnSuccess(_ => fail("Should have resulted in an error"))
        })

        test("it can turn thrown objects into failure results", () => {
            safelyExecute(() => {
                throw { a: "HELLO!" }
            })
                .doOnError(e => expect(e).toEqual("Threw an unexpected object"))
                .doOnSuccess(_ => fail("Should have resulted in an error"))
        })

        test("it can return the result of a successful execution", () => {
            safelyExecute(() => "SUCCESS!")
                .doOnSuccess(result => expect(result).toEqual("SUCCESS!"))
                .doOnError(_ => fail("Should not have resulted in an error"))
        })

        test("can it handle promises?", () => {
            safelyExecuteAsync(() => Promise.resolve("SUCCESS!"))
                .then(doOnSuccess(result => expect(result).toEqual("SUCCESS!")))
                .then(doOnError(_ => fail("Should not have resulted in an error")))
        })
    })

    describe("safelyExecuteAsync", () => {
        test("it can turn throw exceptions into failure results", () => {
            safelyExecuteAsync(() => {
                throw Error("HELLO!")
            })
                .then(doOnSuccess(_ => fail("Should have resulted in an error")))
                .then(doOnError(e => expect(e).toEqual("HELLO!")))
        })

        test("it can turn thrown strings into failure results", () => {
            safelyExecuteAsync(() => {
                throw "HELLO!"
            })
                .then(doOnSuccess(_ => fail("Should have resulted in an error")))
                .then(doOnError(e => expect(e).toEqual("HELLO!")))
        })

        test("it can turn thrown objects into failure results", () => {
            safelyExecuteAsync(() => { throw { a: "HELLO!" } })
                .then(doOnSuccess(_ => fail("Should have resulted in an error")))
                .then(doOnError(e => expect(e).toEqual("Threw an unexpected object")))
        })

        test("it can turn rejected promises into failure results", () => {
            safelyExecuteAsync(() => Promise.reject("HELLO!"))
                .then(doOnSuccess(_ => fail("Should have resulted in an error")))
                .then(doOnError(e => expect(e).toEqual("HELLO!")))
        })

        test("it can return the result of a successful execution", () => {
            safelyExecuteAsync(() => Promise.resolve("SUCCESS!"))
                .then(doOnSuccess(result => expect(result).toEqual("SUCCESS!")))
                .then(doOnError(_ => fail("Should not have resulted in an error")))
        })
    })
})
