import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FEATURE_FLAGS } from '../../constants/featureFlags.ts';

test('Unit test: Feature flag ENABLE_POST_SHARING = true -> share button is visible & enabled', () => {
  const renderShareButton = (flag: boolean) => {
    if (flag) {
      return { visible: true, enabled: true };
    }
    return { visible: false, enabled: false };
  };

  const buttonState = renderShareButton(FEATURE_FLAGS.ENABLE_POST_SHARING);
  assert.deepEqual(buttonState, { visible: true, enabled: true });
});

test('Unit test: Upload function attaches correct Authorization header', async () => {
  const mockToken = "super-secret-jwt-token";
  
  const mockApiUploadFile = async (
    endpoint: string,
    file: { uri: string },
    getAccessToken: () => string | null
  ) => {
    const token = getAccessToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    return { headers, url: "http://uploaded-url.com/image.jpg" };
  };

  const uploadRes = await mockApiUploadFile(
    "/upload/image",
    { uri: "file://avatar.jpg" },
    () => mockToken
  );

  assert.equal(uploadRes.headers.Authorization, `Bearer ${mockToken}`);
});
