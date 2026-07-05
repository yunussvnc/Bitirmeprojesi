import { Gesture, GestureDetector, FlatList } from 'react-native-gesture-handler';

export default function Test() {
  const pan = Gesture.Pan()
    .activeOffsetX([-10000, 20])
    .onStart(() => {
      console.log("Back");
    })
    .runOnJS(true);

  return null;
}
