import Animated from 'react-native-reanimated';
import { HandWaveIcon } from '@/components/icons';

export function HelloWave() {
  return (
    <Animated.View
      style={{
        marginTop: -6,
      }}>
      <HandWaveIcon size={28} color="#FFA500" />
    </Animated.View>
  );
}
