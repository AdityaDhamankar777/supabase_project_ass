// components/Auth.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function signUp() {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert('Sign up error', error.message);
      return;
    }
    Alert.alert('Sign up', 'Check your email for confirmation (if enabled).');
  }

  async function signIn() {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Sign in error', error.message);
      return;
    }
    // onAuthStateChange in App will pick up session and continue
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      Alert.alert('OAuth error', error.message);
      return;
    }
    // On mobile you may need to follow the redirect flow or use expo-auth-session
    // See Supabase social-auth + Expo notes. :contentReference[oaicite:7]{index=7}
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks App — Sign in / Sign up</Text>
      <TextInput style={styles.input} placeholder="email" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="password" secureTextEntry value={password} onChangeText={setPassword} />
      <Button title="Sign In" onPress={signIn} />
      <View style={{ height: 10 }} />
      <Button title="Sign Up" onPress={signUp} />
      <View style={{ height: 10 }} />
      <Button title="Sign In with Google" onPress={signInWithGoogle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center' },
  input: { borderWidth: 1, padding: 8, marginBottom: 8, borderRadius: 6 },
  title: { fontSize: 18, marginBottom: 12, textAlign: 'center' }
});
