import {createKeyPresenceValidator, createSimpleTypeSafeMapper} from "../typesafeMapping";

describe("Typesafe Mapping", () => {
    test("simple object", async () => {
        type Foo = {
            bar: string
            baz: number
            bat: boolean
        }

        const goodInput = {
            bar: "hello",
            baz: 42,
            bat: true
        }

        const badInput = {
            bar: true,
            baz: "42",
            bat: 1
        }

        const missingInput = {
            bar: "hello",
            baz: 42,
        }

        const mapper = createSimpleTypeSafeMapper<Foo>({
            bar: 'string',
            baz: 'number',
            bat: 'boolean'
        })

        expect(mapper("hello").type).toBe("failure")
        expect(mapper(null).type).toBe("failure")
        expect(mapper(1).type).toBe("failure")
        expect(mapper(true).type).toBe("failure")

        const result = mapper(goodInput)
        expect(result.type).toBe("success")

        const badResult = mapper(badInput)
        expect(badResult.type).toBe("failure")

        const missingResult = mapper(missingInput)
        expect(missingResult.type).toBe("failure")
    })

    it("can handle nullable fields", () => {
        type Foo = {
            bar: string
            baz: number
            bat?: boolean
        }

        const input = {
            bar: "hello",
            baz: 42
        }

        const input2 = {
            bar: "hello",
            baz: 42,
            bat: true
        }

        const mapper = createSimpleTypeSafeMapper<Foo>({
            bar: 'string',
            baz: 'number',
            bat: { type: 'boolean', nullable: true }
        })

        expect(mapper(input).type).toBe("success")
        expect(mapper(input2).type).toBe("success")
    })

    it("can handle arrays without checking inner types", () => {
        type Foo = {
            bar: string[]
        }

        const input = {
            bar: ["a"],
        }

        const mapper = createSimpleTypeSafeMapper<Foo>({
            bar: 'object',
        })

        const result = mapper(input);
        expect(result.type).toBe("success")
    })

    test("key presence validator", () => {
        type Foo = {
            bar: string
            baz: number
            bat: boolean
        }

        const input = {
            bar: "hello",
            baz: 42
        }

        expect(createKeyPresenceValidator<Foo>({
            "bar": undefined,
            "baz": undefined,
            "bat": undefined
        })(input).type).toBe("failure")
    })
})
