import { useSettingsStore } from '@/store/settingsStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// ── Slide data (unchanged) ────────────────────────────────────────────────────
const SLIDES = [
  {
    id: '1',
    title: 'Welcome to TwentiFi',
    description: 'Log your life in 20-minute pulses. Build the ultimate habit of awareness and action.',
    icon: 'pulse' as const,
  },
  {
    id: '2',
    title: 'Voice Logging & AI Insights',
    description: 'Just speak. We use AI to transcribe your entries and give you deep insights into your vibe.',
    icon: 'mic' as const,
  },
  {
    id: '3',
    title: 'Maintain Your Streak',
    description: 'Keep your momentum going. Visualize your consistency with our new streak calendar.',
    icon: 'flame' as const,
  },
  {
    id: '4',
    title: 'Powered by Gemini',
    description: 'Paste your free API key to unlock the AI.',
    icon: 'sparkles' as const,
  },
];

// ── Design tokens (light mode = Vellum Ledger, no theme toggle on onboarding) ─
const C = {
  bg: '#FAFAF8',
  card: '#F5F1EB',
  border: '#D9D5CE',
  text: '#1A1A1A',
  textDim: '#39382F',
  subtext: '#66655A',
  green: '#6B8E6F',
  greenLight: '#C6ECC8',
};

export default function OnboardingScreen() {
  // ── All existing logic preserved ──────────────────────────────────────────
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [keyFocused, setKeyFocused] = useState(false);

  const { geminiApiKey, setGeminiApiKey, setHasCompletedOnboarding } =
    useSettingsStore();

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    setHasCompletedOnboarding(true);
    router.replace('/(tabs)');
  };

  const openAiStudio = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  // ── Slide renderer ────────────────────────────────────────────────────────
  const renderItem = ({ item, index }: { item: (typeof SLIDES)[0]; index: number }) => {
    const isApiSlide = index === 3;

    const content = (
      <>
        {/* Icon block */}
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 4,
            backgroundColor: C.card,
            borderWidth: 1,
            borderColor: C.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: isApiSlide ? 16 : 32,
            marginTop: isApiSlide ? 24 : 0,
          }}
        >
          <Ionicons name={item.icon} size={40} color={C.green} />
        </View>

        {/* Title */}
        <Text
          style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 26,
            letterSpacing: -0.5,
            color: C.text,
            textAlign: 'center',
            marginBottom: isApiSlide ? 8 : 16,
          }}
        >
          {item.title}
        </Text>

        {/* Description */}
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            lineHeight: 24,
            color: C.subtext,
            textAlign: 'center',
            marginBottom: isApiSlide ? 24 : 48,
          }}
        >
          {item.description}
        </Text>

        {/* API key slide extras */}
        {isApiSlide && (
          <View style={{ width: '100%' }}>
            {/* Hint badge */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: C.card,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 4,
                paddingHorizontal: 12,
                paddingVertical: 8,
                alignSelf: 'center',
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: C.subtext,
                  marginRight: 6,
                }}
              >
                SCROLL DOWN FOR SETUP
              </Text>
              <Ionicons name="chevron-down" size={12} color={C.subtext} />
            </View>

            {/* Guide GIF */}
            <Image
              source={require('@/assets/images/aistudio-guide.gif')}
              style={{ width: '100%', height: 300, marginBottom: 24 }}
              resizeMode="contain"
            />

            {/* API Key input */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: C.bg,
                borderWidth: 1,
                borderColor: keyFocused ? C.green : C.border,
                borderRadius: 4,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 12,
              }}
            >
              <Ionicons name="key-outline" size={16} color={C.subtext} />
              <TextInput
                style={{
                  flex: 1,
                  fontFamily: 'Inter_400Regular',
                  fontSize: 14,
                  color: C.textDim,
                  marginLeft: 10,
                }}
                placeholder="Paste Gemini API Key here"
                placeholderTextColor={C.subtext}
                value={geminiApiKey}
                onChangeText={setGeminiApiKey}
                secureTextEntry
                autoCapitalize="none"
                onFocus={() => setKeyFocused(true)}
                onBlur={() => setKeyFocused(false)}
              />
            </View>

            {/* Get key link */}
            <TouchableOpacity onPress={openAiStudio} style={{ marginBottom: 32 }}>
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 12,
                  letterSpacing: 1,
                  color: C.green,
                  textAlign: 'center',
                  textDecorationLine: 'underline',
                }}
              >
                Get a free key from Google AI Studio →
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );

    if (isApiSlide) {
      return (
        <ScrollView
          style={{ width }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center', paddingTop: 20, paddingBottom: 40, paddingHorizontal: 32 }}
        >
          {content}
        </ScrollView>
      );
    }

    return (
      <View style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        {content}
      </View>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {/* Bottom bar */}
      <View style={{ paddingHorizontal: 32, paddingBottom: 40, paddingTop: 16 }}>
        {/* Progress dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 24, gap: 8 }}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={{
                height: 2,
                borderRadius: 1,
                backgroundColor: currentIndex === index ? C.text : C.border,
                width: currentIndex === index ? 24 : 8,
              }}
            />
          ))}
        </View>

        {/* Controls */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Skip */}
          <TouchableOpacity onPress={finishOnboarding} style={{ paddingVertical: 14, paddingHorizontal: 4 }}>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 13,
                letterSpacing: 1,
                color: C.subtext,
              }}
            >
              Skip
            </Text>
          </TouchableOpacity>

          {/* Next / Let's Go */}
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: C.text,
              borderRadius: 4,
              paddingHorizontal: 28,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 13,
                letterSpacing: 1.5,
                color: C.bg,
                marginRight: 8,
                textTransform: 'uppercase',
              }}
            >
              {currentIndex === SLIDES.length - 1 ? "Let's Go" : 'Next'}
            </Text>
            <Ionicons
              name={currentIndex === SLIDES.length - 1 ? 'rocket' : 'arrow-forward'}
              size={16}
              color={C.bg}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
