import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const pan = Gesture.Pan()
  .activeOffsetX([-10000, 20])
  .failOffsetX([-20, 10000])
  .failOffsetY([-20, 20])
  .onStart(() => {
    console.log("Back");
  })
  .runOnJS(true);
