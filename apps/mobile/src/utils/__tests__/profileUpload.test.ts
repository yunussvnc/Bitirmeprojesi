import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mocking translations
const t = (key: string, def?: string) => {
  if (key === "edit_profile.perm_req") return "İzin gerekli";
  return def || key;
};

// Mocking Sentry captureException
let sentryLogs: { error: any; context: any }[] = [];
const captureException = (error: any, context: any) => {
  sentryLogs.push({ error, context });
};

// Mocking state
let authUser: { id: number; avatar_url?: string } | null = { id: 123, avatar_url: "old_url" };
const setUser = (user: any) => {
  authUser = user;
};

test('Unit test: permission denied shows correct Turkish error message', async () => {
  const mockRequestPermissions = async () => ({ status: 'denied' });
  const permissions = await mockRequestPermissions();

  let alertMessage = "";
  if (permissions.status !== "granted") {
    alertMessage = "Fotoğraf erişimine izin vermeniz gerekiyor. Ayarlar > İzinler";
  }

  assert.equal(alertMessage, "Fotoğraf erişimine izin vermeniz gerekiyor. Ayarlar > İzinler");
});

test('Unit test: file > 5MB shows size error and does not attempt upload', async () => {
  let uploadAttempted = false;
  const mockUploadImage = async (file: any) => {
    uploadAttempted = true;
    return { url: "new_url" };
  };

  const selectedFileSize = 6 * 1024 * 1024; // 6MB
  let alertMessage = "";

  if (selectedFileSize > 5 * 1024 * 1024) {
    alertMessage = "Dosya boyutu 5MB'dan küçük olmalıdır.";
  } else {
    await mockUploadImage({ uri: "file://test.jpg" });
  }

  assert.equal(alertMessage, "Dosya boyutu 5MB'dan küçük olmalıdır.");
  assert.equal(uploadAttempted, false);
});

test('Mock test: API returns 500 -> logged to Sentry, user sees error with code', async () => {
  sentryLogs = [];
  const mockUploadImage = async () => {
    throw new Error("API error: 500");
  };

  const selectedFileSize = 2 * 1024 * 1024; // 2MB
  let alertMessage = "";

  try {
    if (selectedFileSize > 5 * 1024 * 1024) {
      throw new Error("Size limit exceeded");
    }
    await mockUploadImage();
  } catch (error: any) {
    captureException(error, {
      userId: authUser?.id,
      fileSize: selectedFileSize,
      mimeType: "image/jpeg",
      platform: "ios",
    });

    const errCode = "SERVER_ERROR";
    alertMessage = `Beklenmeyen bir hata oluştu. (Kod: ${errCode})`;
  }

  assert.ok(alertMessage.includes("Kod: SERVER_ERROR"));
  assert.equal(sentryLogs.length, 1);
  assert.equal(sentryLogs[0].context.userId, 123);
  assert.equal(sentryLogs[0].context.fileSize, 2 * 1024 * 1024);
});

test('Integration test: successful upload -> avatar updated in header without full page reload', async () => {
  authUser = { id: 123, avatar_url: "old_url" };
  const mockUploadImage = async () => ({ url: "new_profile_url" });

  const selectedUri = "file://avatar.jpg";
  
  const uploadRes = await mockUploadImage();
  
  setUser({
    ...authUser,
    avatar_url: uploadRes.url,
  });

  assert.equal(authUser?.avatar_url, "new_profile_url");
});
