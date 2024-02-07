import {failure, success, traverse} from "../src/results";

describe("traverse", () => {
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
            failure<String, number>("failed"),
            success<String, number>(1),
            success<String, number>(2)
        ])
            .mapError(message => expect(message).toEqual("failed"))
            .map(() => fail("result of traverse should not be success"))
    })

    test("returns a failure with a failure in the middle position of the list", () => {
        traverse([
            success<String, number>(1),
            failure<String, number>("failed"),
            success<String, number>(2)]
        )
            .mapError(message => expect(message).toEqual("failed"))
            .map(() => fail("result of traverse should not be success"))
    })

    test("returns a failure with a failure in the last position of the list", () => {
        traverse([
            success<String, number>(1),
            success<String, number>(2),
            failure<String, number>("failed")
        ])
            .mapError(message => expect(message).toEqual("failed"))
            .map(() => fail("result of traverse should not be success"))
    })
})
