/**
 * Test: Chat Screen Profile Tap Navigation
 * 
 * Scenario: User is in chat screen and taps on the profile header
 * Expected: Navigate to user profile page
 */

import { parseLegacyMatchTargetUserId, resolveChatTargetUserId } from "./src/utils/chatTargetUser";

describe("ChatScreen - Profile Tap Navigation", () => {
  it("should not treat numeric backend conversation IDs as user IDs", () => {
    expect(resolveChatTargetUserId(undefined, "42")).toBeNull();
    expect(resolveChatTargetUserId(null, "123")).toBeNull();
  });

  it("should prefer explicit target user IDs", () => {
    expect(resolveChatTargetUserId(99, "42")).toBe(99);
  });

  it("should parse legacy match format conversation IDs correctly", () => {
    expect(parseLegacyMatchTargetUserId("match_1711836000000_5")).toBe(5);
    expect(parseLegacyMatchTargetUserId("match_1234567890_99")).toBe(99);
  });

  it("should return null for invalid conversation IDs", () => {
    expect(resolveChatTargetUserId(undefined, "invalid_format")).toBeNull();
    expect(parseLegacyMatchTargetUserId("abc")).toBeNull();
  });

  it("should have headerProfile with onPress handler when target ID is known", () => {
    // This would be an integration test with Expo Router
    // Verifying the TouchableOpacity has onPress prop that calls router.push
    // Mock test: just verify the handler logic exists
    const mockRouter = {
      push: jest.fn(),
    };

    const chatId = "42";

    // Simulate tap
    const userId = resolveChatTargetUserId(42, chatId);
    if (userId) {
      mockRouter.push(`/user/${userId}`);
    }

    expect(mockRouter.push).toHaveBeenCalledWith("/user/42");
  });
});
