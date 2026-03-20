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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

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
    description: 'Enter your Gemini API key to unlock AI features. You can get one for free from Google AI Studio.',
    icon: 'sparkles' as const,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const {
    geminiApiKey,
    setGeminiApiKey,
    setHasCompletedOnboarding,
  } = useSettingsStore();

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

  const renderItem = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => {
    return (
      <View style={{ width }} className="flex-1 items-center justify-center px-8">
        <View className="w-32 h-32 rounded-full bg-brand-purple/20 items-center justify-center mb-8 border border-brand-purple/50">
          <Ionicons name={item.icon} size={64} color="#8B5CF6" />
        </View>
        <Text className="text-3xl font-black text-white mb-4 text-center tracking-wide">
          {item.title}
        </Text>
        <Text className="text-brand-subtext text-center text-lg leading-relaxed mb-12">
          {item.description}
        </Text>

        {index === 3 && (
          <View className="w-full mt-4">
            <View className="bg-brand-card p-4 rounded-2xl border border-white/5 flex-row items-center mb-4">
              <Ionicons name="key-outline" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 text-white ml-3 text-base"
                placeholder="Paste Gemini API Key here"
                placeholderTextColor="#4B5563"
                value={geminiApiKey}
                onChangeText={setGeminiApiKey}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity onPress={openAiStudio} className="mb-4">
              <Text className="text-brand-purple text-center font-bold underline">
                Get a free API key from Google AI Studio
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
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

      <View className="px-8 pb-12 pt-4">
        <View className="flex-row justify-center mb-8 gap-2">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === index ? 'w-8 bg-brand-purple' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </View>

        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={finishOnboarding}
            className="px-6 py-4"
          >
            <Text className="text-brand-subtext font-bold uppercase tracking-widest text-sm">
              Skip
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            className="bg-brand-purple px-10 py-4 rounded-full shadow-lg shadow-brand-purple/50 flex-row items-center"
          >
            <Text className="text-white font-black uppercase tracking-widest mr-2">
              {currentIndex === SLIDES.length - 1 ? "Let's Go" : 'Next'}
            </Text>
            <Ionicons
              name={currentIndex === SLIDES.length - 1 ? 'rocket' : 'arrow-forward'}
              size={18}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
