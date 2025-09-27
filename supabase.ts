// lib/supabase.ts
import 'react-native-url-polyfill/auto'; // must be first
import 'react-native-get-random-values'; // for uuid, etc.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://paofbpjvizauxpiyawbz.supabase.co';      // replace
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhb2ZicGp2aXphdXhwaXlhd2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjY4NzYsImV4cCI6MjA3NDU0Mjg3Nn0.vjXtTLO05oEvKy3zadI7kgtJMFv14J1qNRGxcZuBl4g';                  // replace

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    // RN has no location.href; disable url session detection:
    detectSessionInUrl: false
  },
});
