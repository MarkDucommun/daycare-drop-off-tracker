describe("can I carousel", () => {
    test("carousel", () => {
        const events = [1,2,3]
        const [head, ...tail] = events
        const newEvents = [...tail, 4]
        expect(newEvents).toEqual([2,3,4])
    })

    test("parseFloat", () => {
        const a = parseFloat("animal")
        console.log(typeof a)
        expect(a).toBeNaN()
    })

    test("push to Array", () => {
        const array = new Array(10)

        array.unshift(1)
        array.unshift(2)

        console.log(array)
    })
})
