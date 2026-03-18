import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent } from '../components/ui/card';
import { Mail } from 'lucide-react-native';

export default function ConfirmEmails() {
  return (
    <AppLayout title="Confirmar Emails">
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Confirmar Emails</Text>
            <Text style={styles.subtitle}>Gerencie confirmações de email</Text>
          </View>
        </View>

        <Card style={styles.emptyCard}>
          <CardContent style={styles.emptyContent}>
            <Mail size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Confirmar Emails</Text>
            <Text style={styles.emptyText}>
              Gerencie as confirmações de email dos usuários
            </Text>
          </CardContent>
        </Card>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyContent: {
    padding: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});
