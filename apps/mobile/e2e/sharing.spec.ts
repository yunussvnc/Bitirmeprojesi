/**
 * E2E Test Specifications for Content Sharing Flows (Detox/Maestro)
 * 
 * To run:
 * detox test -c ios.sim.debug e2e/sharing.spec.ts
 */

declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;
declare const element: any;
declare const by: any;
declare const device: any;

describe('Content Sharing E2E Flows', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('Full flow — open composer -> select image -> add caption -> post -> verify post appears in feed', async () => {
    // 1. Open create sheet from feed screen
    await element(by.id('feed-create-button')).tap();
    
    // 2. Select post option
    await element(by.text('Gönderi')).tap();
    
    // 3. Select image in media picker
    await element(by.id('gallery-image-0')).tap();
    await element(by.id('picker-next-button')).tap();
    
    // 4. Input caption on share step
    await element(by.id('caption-input')).typeText('Test caption from E2E test');
    
    // 5. Submit post
    await element(by.id('post-share-button')).tap();
    
    // 6. Verify navigated back to feed and post appears in feed
    await expect(element(by.text('Test caption from E2E test'))).toBeVisible();
  });

  it('Story creation flow — tap story button -> capture/select -> share -> verify story visible', async () => {
    // 1. Open create sheet from feed screen
    await element(by.id('feed-create-button')).tap();
    
    // 2. Select story option
    await element(by.text('Hikaye')).tap();
    
    // 3. Take photo using embedded camera
    await element(by.id('shutter-button')).tap();
    
    // 4. Tap share to story button
    await element(by.id('share-story-pill')).tap();
    
    // 5. Verify story is now visible in feed stories row
    await expect(element(by.id('story-avatar-mine'))).toBeVisible();
  });
});
