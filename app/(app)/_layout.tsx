import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="lancamentos" />
      <Stack.Screen name="caixa" />
      <Stack.Screen name="dividas" />
      <Stack.Screen name="nfe" />
      <Stack.Screen name="comprovantes" />
      <Stack.Screen name="impostos" />
      <Stack.Screen name="relatorios" />
      <Stack.Screen name="metas" />
      <Stack.Screen name="configuracoes" />
      <Stack.Screen name="confirmar-emails" />
    </Stack>
  );
}
