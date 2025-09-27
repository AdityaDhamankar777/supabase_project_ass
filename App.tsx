// App.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import TasksScreen from './components/Tasks';

export default function App() {
  const [session, setSession] = useState<any | null>(undefined);

  useEffect(() => {
    // get initial session
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
    })();

    // listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  if (session === undefined) return <View style={{flex:1,justifyContent:'center'}}><ActivityIndicator /></View>;
  return session ? <TasksScreen /> : <Auth />;
}
