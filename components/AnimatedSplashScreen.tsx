import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as SplashScreen from 'expo-splash-screen';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';

type Props = {
  onAnimationComplete: () => void;
};

export default function AnimatedSplashScreen({ onAnimationComplete }: Props) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const opacity = useSharedValue(1);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (!isVideoReady && status.isPlaying) {
        setIsVideoReady(true);
        // Hide the native static splash screen smoothly when video starts
        SplashScreen.hideAsync().catch(() => {});
      }
      
      // When video finishes playing, fade out
      if (status.didJustFinish) {
        opacity.value = withTiming(0, { duration: 600 }, () => {
          runOnJS(onAnimationComplete)();
        });
      }
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#242426', zIndex: 9999, justifyContent: 'center', alignItems: 'center' }, animatedStyle]}>
      <Video
        source={require('../assets/images/loadinglogo.mp4')}
        style={{ width: 200, height: 200, borderRadius: 32, overflow: 'hidden' }}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        isMuted
      />
    </Animated.View>
  );
}
