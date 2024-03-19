import {expect} from "detox"
import {expect as jestExpect} from "@jest/globals";

describe('Example', () => {
    beforeAll(async () => {
        await device.launchApp();
    });

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it('can view "Track a trip"', async () => {

        const tripTrackerButton = element(by.text('Track a trip'))

        await expect(tripTrackerButton).toBeVisible()

        await tripTrackerButton.tap()

        await expect(element(by.text('Trip Tracker'))).toBeVisible()

        await expect(element(by.text('Origin location name'))).toBeVisible()

        await element(by.label('create-location-input')).atIndex(0).typeText('Daycare')

        await element(by.text('Create location')).tap()

        await expect(element(by.text('Start trip'))).toBeVisible()

        await element(by.text('Home')).tap()

        const tripHistoryButton = element(by.text('View past trips'));

        await expect(tripHistoryButton).toBeVisible()

        await tripHistoryButton.tap()

        await expect(element(by.text('Trip History'))).toBeVisible()

        await expect(element(by.text('Daycare'))).toBeVisible()

        await element(by.text('Home')).atIndex(0).tap()

        await element(by.text('Track a trip')).tap()

        await element(by.text('Cancel trip')).tap()

        await element(by.text('Home')).tap()

        await element(by.text('View past trips')).tap()

        const attributes = await element(by.id('row')).atIndex(0).getAttributes();

        const maybeText = 'elements' in attributes && attributes.elements[0].label;

        jestExpect(maybeText).not.toBeUndefined()
        jestExpect(typeof maybeText).toBe('string')
        const text = maybeText as string
        jestExpect(text).toContain('Daycare')
        jestExpect(text).toContain('Cancelled')
    })
})
