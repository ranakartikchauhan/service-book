import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../i18n';

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
import NotificationCenterScreen from '../screens/shared/NotificationCenterScreen';
import NotificationPreferencesScreen from '../screens/shared/NotificationPreferencesScreen';
import EmergencyContactScreen from '../screens/shared/EmergencyContactScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HeaderNotificationBell({ navigation }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('NotificationCenter')}
      style={{ marginRight: 16, padding: 4 }}
    >
      <Text style={{ fontSize: 20 }}>🔔</Text>
    </TouchableOpacity>
  );
}

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
function WorkerTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#f1f5f9',
        headerRight: () => <HeaderNotificationBell navigation={navigation} />,
      }}
    >
      <Tab.Screen
        name="Jobs"
        component={WorkerJobBrowseScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>💼</Text>, tabBarLabel: 'Find Work' }}
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
function PosterTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#f1f5f9',
        headerRight: () => <HeaderNotificationBell navigation={navigation} />,
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
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#f1f5f9',
      }}
    >
      {user?.currentMode === 'worker' ? (
        <Stack.Screen name="WorkerTabs" component={WorkerTabs} options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="PosterTabs" component={PosterTabs} options={{ headerShown: false }} />
      )}
      {/* Screens accessible from both modes */}
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Leave a Review' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Subscriptions & Plans' }} />
      <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} options={{ title: 'Notification Settings' }} />
      <Stack.Screen name="EmergencyContact" component={EmergencyContactScreen} options={{ title: 'Emergency Contact' }} />
      <Stack.Screen name="WorkerVerification" component={WorkerVerificationScreen} options={{ title: 'ID Verification' }} />
      <Stack.Screen name="WorkerJobDetail" component={WorkerJobDetailScreen} options={{ title: 'Job Details' }} />
      <Stack.Screen name="PosterApplicants" component={PosterApplicantsScreen} options={{ title: 'Applicants' }} />
      <Stack.Screen name="PosterActiveJob" component={PosterActiveJobScreen} options={{ title: 'Active Job Session' }} />
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
    <LanguageProvider>
      <NavigationContainer>
        {user ? <AppNavigator /> : <AuthStack />}
      </NavigationContainer>
    </LanguageProvider>
  );
}
