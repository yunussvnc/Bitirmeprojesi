import { Gesture } from 'react-native-gesture-handler';

export const panGesture = Gesture.Pan()
  .activeOffsetX([-10000, 20])
  .onStart(() => {
    console.log('Back');
  })
  .runOnJS(true);

export default function Test() {
  return null;
}
