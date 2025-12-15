import { useRouter } from 'expo-router';
import React, { useContext, useEffect } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { AuthContext } from './context/AuthContext';

export default function HomeScreen() {
  const { user, loading, logout } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/(auth)/login');
  }, [loading, user]);

  if (loading || !user) {
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, backgroundColor: 'red' }}
      />
    );
  }

  return (
    <View
      style={styles.container}
    >
      <Text  allowFontScaling={false}>Welcome, {user.name}</Text>
      <Button  title="Logout" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,                
    justifyContent: 'center', 
    alignItems: 'center', 
    padding:20,  
  },
});