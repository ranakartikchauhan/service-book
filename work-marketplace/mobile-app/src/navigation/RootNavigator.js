import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Worker Screens
import WorkerJobBrowseScreen from '../screens/worker/JobBrowseScreen';
import WorkerJobDetailScreen from '../screens/worker/JobDetailScreen';
import WorkerMyApplicationsScreen from '../screens/worker/MyApplicationsScreen';
import WorkerProfileScreen from '../screens/worker/ProfileScreen';
import WorkerVerificationScreen from '../screens/worker/VerificationScreen';
import WorkerEarningsScreen from '../screens/worker/EarningsScreen';

// Poster Screens
import PosterPostJobScreen from '../screens/poster/PostJobScreen';
import PosterMyJobsScreen from '../screens/poster/MyJobsScreen';
import PosterApplicantsScreen from '../screens/poster/ApplicantsScreen';
import PosterActiveJobScreen from '../screens/poster/ActiveJobScreen';

// Shared Screens
import ChatScreen from '../screens/shared/ChatScreen';
import ReviewScreen from '../screens/shared/ReviewScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import SubscriptionScreen from '../screens/shared/SubscriptionScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Auth Stack ───────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ─── Worker Tabs ──────────────────────────────────────────────────────────────
function WorkerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#f1f5f9',
      }}
    >
      <Tab.Screen
        name="Jobs"
        component={WorkerJobBrowseScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>💼</Text>, tabBarLabel: 'Find Work' }}
      />
      <Tab.Screen
        name="MyApplications"
        component={WorkerMyApplicationsScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text>, tabBarLabel: 'Applied' }}
      />
      <Tab.Screen
        name="Earnings"
        component={WorkerEarningsScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>💰</Text>, tabBarLabel: 'Earnings' }}
      />
      <Tab.Screen
        name="Profile"
        component={WorkerProfileScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>, tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// ─── Poster Tabs ──────────────────────────────────────────────────────────────
function PosterTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#f1f5f9',
      }}
    >
      <Tab.Screen
        name="MyJobs"
        component={PosterMyJobsScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text>, tabBarLabel: 'My Jobs' }}
      />
      <Tab.Screen
        name="PostJob"
        component={PosterPostJobScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>➕</Text>, tabBarLabel: 'Post Job' }}
      />
      <Tab.Screen
        name="PosterProfile"
        component={SettingsScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text>, tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

// ─── Main App Navigator ───────────────────────────────────────────────────────
function AppNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user?.currentMode === 'worker' ? (
        <Stack.Screen name="WorkerTabs" component={WorkerTabs} />
      ) : (
        <Stack.Screen name="PosterTabs" component={PosterTabs} />
      )}
      {/* Screens accessible from both modes */}
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: 'Chat' }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ headerShown: true, title: 'Leave a Review' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings' }} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ headerShown: true, title: 'Subscriptions & Plans' }} />
      <Stack.Screen name="WorkerVerification" component={WorkerVerificationScreen} options={{ headerShown: true, title: 'ID Verification' }} />
      <Stack.Screen name="WorkerJobDetail" component={WorkerJobDetailScreen} options={{ headerShown: true, title: 'Job Details' }} />
      <Stack.Screen name="PosterApplicants" component={PosterApplicantsScreen} options={{ headerShown: true, title: 'Applicants' }} />
      <Stack.Screen name="PosterActiveJob" component={PosterActiveJobScreen} options={{ headerShown: true, title: 'Active Job' }} />
    </Stack.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}
