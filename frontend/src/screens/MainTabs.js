import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import CatchesScreen from './CatchesScreen';
import ForumScreen from './ForumScreen';
import EncyclopediaScreen from './EncyclopediaScreen';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs({ navigation }) {
  const { user } = useAuth();
  const fullName = user?.name || 'Uživatel';
  const firstName = fullName.split(' ')[0];
  const initials = fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.topBarContainer}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brandTitle}>
              <Text style={styles.brandPrimary}>Rybář</Text>
              <Text style={styles.brandAccent}>App</Text>
            </Text>
            <Text style={styles.brandSubtitle}>Přehled úlovků</Text>
          </View>
          <TouchableOpacity style={styles.userPanel} onPress={() => navigation.navigate('Profil')}>
            <Text style={styles.userName}>{firstName}</Text>
            <View style={styles.userBadge}>
              <Text style={styles.userInitials}>{initials}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <View style={styles.contentContainer}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#1a5c3a',
            tabBarInactiveTintColor: '#5a5a55',
            tabBarStyle: {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              borderTopColor: '#ddd',
              borderTopWidth: 0.5,
              height: 62,
              paddingBottom: 15,
              backgroundColor: '#fff',
            },
tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '700',
            marginTop: -2,
          },
          tabBarIconStyle: {
            marginTop: -4,
          },
          }}
        >
          <Tab.Screen name="Úlovky" component={CatchesScreen} />
          <Tab.Screen name="Fórum" component={ForumScreen} />
          <Tab.Screen name="Encyklopedie" component={EncyclopediaScreen} />
          <Tab.Screen name="Profil" component={ProfileScreen} />
        </Tab.Navigator>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3ee',
  },
  topBarContainer: {
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e4dd',
  },
  contentContainer: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a5c3a',
  },
  brandPrimary: {
    color: '#1a5c3a',
  },
  brandAccent: {
    color: '#b37a18',
  },
  brandSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#5a5a55',
  },
  userPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#f2f4f0',
  },
  userName: {
    marginRight: 12,
    fontSize: 14,
    color: '#1a1a18',
    fontWeight: '600',
  },
  userBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a5c3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitials: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
