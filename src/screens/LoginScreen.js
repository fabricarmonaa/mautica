import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { setAuth } from '../services/authService.js';

const LoginScreen = ({ navigation }) => {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = () => {
    const role = dni === 'owner' ? 'OWNER' : 'USER';
    setAuth({ token: 'demo-token', role, tenantId: 1 });
    navigation.reset({ index: 0, routes: [{ name: role === 'USER' ? 'User' : 'Admin' }] });
  };

  return (
    <View style={{ padding: 24 }}>
      <Text>Ingreso</Text>
      <TextInput placeholder="DNI" value={dni} onChangeText={setDni} style={{ borderWidth: 1, marginBottom: 12 }} />
      <TextInput placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, marginBottom: 12 }} />
      <Button title="Entrar" onPress={onLogin} />
    </View>
  );
};

export default LoginScreen;
