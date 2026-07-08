import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0a0e1a' },
          headerTintColor: '#e8eaf6',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#0a0e1a' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="consultorio/index" options={{ title: 'Painel da Clínica' }} />
        <Stack.Screen name="consultorio/check-in" options={{ title: 'Novo Check-in' }} />
        <Stack.Screen name="medico/index" options={{ title: 'Fila de Pacientes' }} />
        <Stack.Screen name="medico/consulta/[id]" options={{ title: 'Teleconsulta' }} />
      </Stack>
    </>
  );
}
