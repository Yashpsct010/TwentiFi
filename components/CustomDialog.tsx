import React from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, Easing } from 'react-native';
import { useDialogStore } from '@/store/dialogStore';
import { useTheme } from '@/hooks/use-theme';

export default function CustomDialog() {
  const t = useTheme();
  const { isVisible, title, message, buttons, hideDialog } = useDialogStore();

  const [isRendered, setIsRendered] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  React.useEffect(() => {
    if (isVisible) {
      setIsRendered(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => setIsRendered(false));
    }
  }, [isVisible, fadeAnim, scaleAnim]);

  if (!isRendered && !isVisible) return null;

  return (
    <Modal transparent visible={isRendered} animationType="none" onRequestClose={hideDialog}>
      <View
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
        <Animated.View
          className="w-full rounded-[4px] p-6 border shadow-lg max-w-[400px]"
          style={{
            backgroundColor: t.colors.card,
            borderColor: t.colors.border,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Text
            style={{ fontFamily: "Inter_700Bold", fontSize: 18 }}
            className={`${t.textPrimary} mb-2`}
          >
            {title}
          </Text>
          
          {message ? (
            <Text
              style={{ fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 }}
              className={`${t.textSubtle} mb-6`}
            >
              {message}
            </Text>
          ) : <View style={{ height: 16 }} />}

          <View
            className={buttons.length > 2 ? "flex-col" : "flex-row justify-end"}
            style={{ gap: buttons.length > 2 ? 12 : 16 }}
          >
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              
              const textColor = isDestructive 
                 ? t.colors.error 
                 : isCancel 
                   ? t.colors.subtext 
                   : t.colors.green;

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    hideDialog();
                    if (btn.onPress) {
                      setTimeout(() => btn.onPress!(), 10);
                    }
                  }}
                  className={`py-2 px-4 rounded-[4px] items-center justify-center`}
                  style={{
                    backgroundColor: buttons.length > 2 ? t.colors.bg : 'transparent',
                    borderWidth: buttons.length > 2 ? 1 : 0,
                    borderColor: buttons.length > 2 ? t.colors.border : 'transparent',
                  }}
                >
                  <Text
                    style={{ 
                      fontFamily: isCancel ? "Inter_500Medium" : "Inter_600SemiBold", 
                      fontSize: 14, 
                      color: textColor 
                    }}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
