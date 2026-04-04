import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface QuoteState {
  quote: string;
  author: string;
  keyword: string;
  fetchedAt: number; // timestamp
  hasQuoteForToday: () => boolean;
  setQuote: (quote: string, author: string, keyword: string) => void;
}

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set, get) => ({
      quote: "Productivity is never an accident. It is always the result of a commitment to excellence.",
      author: "Paul J. Meyer",
      keyword: "minimalist architecture",
      fetchedAt: 0,
      
      hasQuoteForToday: () => {
        const now = Date.now();
        const state = get();
        // Return true if we fetched within the last 24 hours
        return (now - state.fetchedAt) < (24 * 60 * 60 * 1000);
      },

      setQuote: (quote, author, keyword) => {
        set({
          quote,
          author,
          keyword,
          fetchedAt: Date.now(),
        });
      },
    }),
    {
      name: 'twentifi-quote-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
