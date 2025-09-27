// components/Tasks.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

type Task = {
  id: string;
  task_title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetchTasks();
    // you can set up realtime subscriptions here if you want:
    // supabase.from('tasks').on('INSERT'...).subscribe(...)
  }, []);

  async function fetchTasks(q = '') {
    setLoading(true);
    try {
      let builder = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (q && q.trim()) builder = builder.ilike('task_title', `%${q}%`);
      const { data, error } = await builder;
      if (error) throw error;
      setTasks(data ?? []);
    } catch (err: any) {
      Alert.alert('Fetch error', err.message);
    } finally {
      setLoading(false);
    }
  }

  // Optimistic add
  async function addTask() {
    const title = newTitle.trim();
    if (!title) return;
    const tempId = uuidv4();
    const optimistic: Task = {
      id: tempId,
      task_title: title,
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setTasks(prev => [optimistic, ...prev]);
    setNewTitle('');

    // Insert — because DB trigger fills user_id, we do not send user_id
    const { data, error } = await supabase
      .from('tasks')
      .insert({ task_title: title })
      .select()
      .limit(1)
      .single();

    if (error) {
      // rollback optimistic
      setTasks(prev => prev.filter(t => t.id !== tempId));
      Alert.alert('Insert failed', error.message);
      return;
    }
    // replace temp with actual DB row
    setTasks(prev => prev.map(t => (t.id === tempId ? data : t)));
  }

  // Optimistic toggle complete
  async function toggleComplete(id: string) {
    const prev = tasks.find(t => t.id === id);
    if (!prev) return;
    const optimisticNew = { ...prev, is_completed: !prev.is_completed };
    setTasks(ts => ts.map(t => (t.id === id ? optimisticNew : t)));

    const { data, error } = await supabase
      .from('tasks')
      .update({ is_completed: optimisticNew.is_completed })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // rollback
      setTasks(ts => ts.map(t => (t.id === id ? prev : t)));
      Alert.alert('Update failed', error.message);
    } else {
      setTasks(ts => ts.map(t => (t.id === id ? data : t)));
    }
  }

  // Edit title (optimistic)
  async function editTitle(id: string, newTaskTitle: string) {
    const prev = tasks.find(t => t.id === id);
    if (!prev) return;
    const optimisticNew = { ...prev, task_title: newTaskTitle };
    setTasks(ts => ts.map(t => (t.id === id ? optimisticNew : t)));

    const { data, error } = await supabase
      .from('tasks')
      .update({ task_title: newTaskTitle })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      setTasks(ts => ts.map(t => (t.id === id ? prev : t)));
      Alert.alert('Update failed', error.message);
    } else setTasks(ts => ts.map(t => (t.id === id ? data : t)));
  }

  // Optimistic delete
  async function deleteTask(id: string) {
    const before = tasks;
    setTasks(ts => ts.filter(t => t.id !== id));
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      setTasks(before);
      Alert.alert('Delete failed', error.message);
    }
  }

  // Call RPC to mark all completed
  async function markAllCompleted() {
    const { data, error } = await supabase.rpc('mark_all_completed');
    if (error) {
      Alert.alert('RPC failed', error.message);
      return;
    }
    // data is number updated (SQL function returns integer)
    setTasks(ts => ts.map(t => ({ ...t, is_completed: true })));
    Alert.alert('Marked completed', `${data} tasks updated`);
  }

  // Search helper
  async function onSearch() {
    await fetchTasks(query);
  }

  return (
    <View style={{flex:1, padding:16}}>
      <View style={{flexDirection:'row', marginBottom:8}}>
        <TextInput placeholder="Search title" value={query} onChangeText={setQuery} style={styles.input} />
        <Button title="Search" onPress={onSearch} />
      </View>

      <View style={{flexDirection:'row', marginBottom:8}}>
        <TextInput placeholder="New task title" value={newTitle} onChangeText={setNewTitle} style={styles.input} />
        <Button title="Add" onPress={addTask} />
      </View>

      <Button title="Mark all completed (RPC)" onPress={markAllCompleted} />
      <FlatList
        data={tasks}
        keyExtractor={(item)=>item.id}
        renderItem={({item})=>(
          <View style={styles.row}>
            <TouchableOpacity onPress={()=>toggleComplete(item.id)}>
              <Text style={{textDecorationLine: item.is_completed ? 'line-through' : 'none'}}>{item.task_title}</Text>
            </TouchableOpacity>
            <View style={{flexDirection:'row'}}>
              <Button title="Edit" onPress={()=> {
                const newT = prompt('New title', item.task_title);
                if (newT !== null) editTitle(item.id, newT);
              }} />
              <View style={{width:8}}/>
              <Button title="Delete" color="red" onPress={()=>deleteTask(item.id)} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth:1, padding:8, borderRadius:6, flex:1, marginRight:8 },
  row: { padding:10, borderBottomWidth:1, borderColor:'#eee', flexDirection:'row', justifyContent:'space-between', alignItems:'center' }
});
