import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen.js';
import AdminDashboardScreen from '../screens/AdminDashboardScreen.js';
import UsersScreen from '../screens/UsersScreen.js';
import OrdersScreen from '../screens/OrdersScreen.js';
import PaymentsScreen from '../screens/PaymentsScreen.js';
import InvoicesScreen from '../screens/InvoicesScreen.js';
import CashScreen from '../screens/CashScreen.js';
import SettingsScreen from '../screens/SettingsScreen.js';
import UserProfileScreen from '../screens/UserProfileScreen.js';
import UserOrdersScreen from '../screens/UserOrdersScreen.js';
import UserPaymentsScreen from '../screens/UserPaymentsScreen.js';
import ChangePasswordScreen from '../screens/ChangePasswordScreen.js';
import { authState } from '../services/authService.js';

const Stack = createNativeStackNavigator();

const AdminStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    <Stack.Screen name="Users" component={UsersScreen} />
    <Stack.Screen name="Orders" component={OrdersScreen} />
    <Stack.Screen name="Payments" component={PaymentsScreen} />
    <Stack.Screen name="Invoices" component={InvoicesScreen} />
    <Stack.Screen name="Cash" component={CashScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

const UserStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Profile" component={UserProfileScreen} />
    <Stack.Screen name="MyOrders" component={UserOrdersScreen} />
    <Stack.Screen name="MyPayments" component={UserPaymentsScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const isAuthed = Boolean(authState.token);
  const isUser = authState.role === 'USER';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {!isAuthed ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : isUser ? (
          <Stack.Screen name="User" component={UserStack} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="Admin" component={AdminStack} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
