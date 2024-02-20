import {failure, success, traverse} from "../results";

describe("traverse", () => {
    test("returns a success of empty list when list of results is empty", () => {
        traverse([])
            .map(result => expect(result).toEqual([]))
            .mapError(() => fail("result of empty traverse should not be failure"))
    })

    test("takes a list of results containing only successes and turns it into a result of list", () => {
        traverse([
            success(1),
            success(2),
            success(3)
        ])
            .map(result => expect(result).toEqual([1, 2, 3]))
            .mapError(() => fail("result of traverse should not be failure"))
    })

    test("returns a failure with a failure in the first position of the list", () => {
        traverse([
            failure<string, number>("failed"),
            success<string, number>(1),
            success<string, number>(2)
        ])
            .mapError(message => expect(message).toEqual("failed"))
            .map(() => fail("result of traverse should not be success"))
    })

    test("returns a failure with a failure in the middle position of the list", () => {
        traverse([
            success<string, number>(1),
            failure<string, number>("failed"),
            success<string, number>(2)]
        )
            .mapError(message => expect(message).toEqual("failed"))
            .map(() => fail("result of traverse should not be success"))
    })

    test("returns a failure with a failure in the last position of the list", () => {
        traverse([
            success<string, number>(1),
            success<string, number>(2),
            failure<string, number>("failed")
        ])
            .mapError(message => expect(message).toEqual("failed"))
            .map(() => fail("result of traverse should not be success"))
    })
})

describe("async failures", () => {
    test("what happens when a promise is rejected within an async await block", async () => {
        const failingFn = (): Promise<string> => {
            return new Promise((resolve, reject) => {
                reject("Something went wrong")
            })
        }
        var valueIsReceived = false
        var caughtSomething = false

        try {
            const value = await failingFn()
            valueIsReceived = true
        } catch (e) {
            expect(e).toEqual("Something went wrong")
            caughtSomething = true
        }

        expect(valueIsReceived).toBeFalsy()
        expect(caughtSomething).toBeTruthy()
    })
})
