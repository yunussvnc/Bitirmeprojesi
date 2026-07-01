import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_KEY = 'has_requested_review';
const ACTION_COUNT_KEY = 'review_action_count';
const TARGET_ACTIONS = 5; // Kaç olumlu aksiyondan sonra mağaza yorumu istenecek

export function useStoreReview() {
  const triggerReviewAction = async () => {
    try {
      // Daha önce inceleme istendiyse tekrar sorma
      const hasRequested = await AsyncStorage.getItem(REVIEW_KEY);
      if (hasRequested === 'true') return;

      const currentCountStr = await AsyncStorage.getItem(ACTION_COUNT_KEY);
      let currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
      currentCount += 1;

      if (currentCount >= TARGET_ACTIONS) {
        if (await StoreReview.hasAction()) {
          // Geliştirici ortamında test edilemez, sadece TestFlight veya App Store sürümünde gerçek pop-up çıkar.
          await StoreReview.requestReview();
          // Pop-up gösterildikten sonra bir daha sormamak için flag ekle
          await AsyncStorage.setItem(REVIEW_KEY, 'true');
        }
      } else {
        await AsyncStorage.setItem(ACTION_COUNT_KEY, currentCount.toString());
      }
    } catch (e) {
      console.log('Store review error', e);
    }
  };

  return { triggerReviewAction };
}
