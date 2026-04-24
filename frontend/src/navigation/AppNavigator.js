import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainTabs from '../screens/MainTabs';
import AddCatchScreen from '../screens/AddCatchScreen';
import CatchDetailScreen from '../screens/CatchDetailScreen';
import AddPostScreen from '../screens/AddPostScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import FishDetailScreen from '../screens/FishDetailScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="AddCatch" component={AddCatchScreen} />
          <Stack.Screen name="CatchDetail" component={CatchDetailScreen} />
          <Stack.Screen name="AddPost" component={AddPostScreen} />
          <Stack.Screen name="PostDetail" component={PostDetailScreen} />
          <Stack.Screen name="FishDetail" component={FishDetailScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
