import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Mail, Lock } from 'lucide-react-native';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export default function Login() {
  const { signIn, loading, session } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const handleLogin = async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const validated = loginSchema.parse(loginData);
      const { error } = await signIn(validated.email, validated.password);

      if (error) {
        setErrors({ general: 'Email ou senha incorretos' });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Finansys</Text>
          <Text style={styles.subtitle}>Sistema de Gestão Financeira</Text>
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>Acesso ao Sistema</CardTitle>
            <CardDescription style={styles.cardDescription}>
              Entre com suas credenciais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              label="Email"
              placeholder="seu@email.com"
              value={loginData.email}
              onChangeText={(text) => setLoginData(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon={<Mail size={18} color="#9CA3AF" />}
            />

            <Input
              label="Senha"
              placeholder="******"
              value={loginData.password}
              onChangeText={(text) => setLoginData(prev => ({ ...prev, password: text }))}
              secureTextEntry
              error={errors.password}
              leftIcon={<Lock size={18} color="#9CA3AF" />}
            />

            {errors.general && (
              <Text style={styles.errorText}>{errors.general}</Text>
            )}

            <Button
              title={isSubmitting ? 'Entrando...' : 'Entrar'}
              onPress={handleLogin}
              disabled={isSubmitting}
              loading={isSubmitting}
              size="lg"
              style={styles.button}
            />
          </CardContent>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 26,
    textAlign: 'center',
    color: '#1F2937',
    fontWeight: 'bold',
  },
  cardDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 6,
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});
