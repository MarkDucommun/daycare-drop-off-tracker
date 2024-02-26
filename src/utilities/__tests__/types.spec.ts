describe("do some types stuff", () => {
    test("weird", () => {

        type TestType = {
            one: undefined
            two: undefined
            three: undefined
        }

        const a: TestType = {
            one: undefined,
            two: undefined,
            three: undefined
        }

        type TestTypeKeys = keyof TestType

        const keys = Object.keys({} as TestType)

        console.log(keys)
    })
})
