import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  FileText,
  AlertTriangle,
  Plus,
  Receipt,
} from 'lucide-react-native';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { useUserRole } from '../hooks/useUserRole';
import { formatCurrency } from '../lib/utils';
import { useRouter } from 'expo-router';

interface DashboardStats {
  totalReceitas: number;
  totalDespesas: number;
  saldoAtual: number;
  totalDividas: number;
  dividasVencidas: number;
  movimentacoesHoje: number;
  gastosRegistrados: number;
  nfesEmitidas: number;
}

interface Transaction {
  id_movimentacao: string;
  descricao: string | null;
  valor: number;
  tipo: 'receita' | 'despesa';
  categoria: string | null;
  data: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalReceitas: 0,
    totalDespesas: 0,
    saldoAtual: 0,
    totalDividas: 0,
    dividasVencidas: 0,
    movimentacoesHoje: 0,
    gastosRegistrados: 0,
    nfesEmitidas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Buscar movimentações de caixa (receitas e despesas reais)
        const { data: movimentacoes } = await supabase
          .from('movimentacao_caixa')
          .select('*')
          .order('data', { ascending: false });

        // Buscar gastos registrados (lançamentos)
        const { data: lancamentos } = await supabase
          .from('lancamento')
          .select('*');

        // Buscar dívidas
        const { data: dividas } = await supabase
          .from('divida')
          .select('*');

        // Buscar NFes
        const { data: nfes } = await supabase
          .from('nfe')
          .select('*');

        // Calcular receitas (movimentacoes + lancamentos)
        let totalReceitas = 0;
        let totalDespesas = 0;

        if (movimentacoes) {
          const receitasCaixa = movimentacoes
            .filter(m => m.tipo === 'receita')
            .reduce((sum, m) => sum + Number(m.valor), 0);

          const despesasCaixa = movimentacoes
            .filter(m => m.tipo === 'despesa')
            .reduce((sum, m) => sum + Number(m.valor), 0);

          totalReceitas += receitasCaixa;
          totalDespesas += despesasCaixa;

          const hoje = new Date().toISOString().split('T')[0];
          const movimentacoesHoje = movimentacoes.filter(m => m.data === hoje).length;

          setStats(prev => ({
            ...prev,
            movimentacoesHoje,
          }));

          setRecentTransactions(movimentacoes.slice(0, 5) as Transaction[]);
        }

        if (lancamentos) {
          // Todos os lançamentos são considerados dívidas/despesas
          const despesasLancamentos = lancamentos
            .reduce((sum, l) => sum + Number(l.valor), 0);

          totalDespesas += despesasLancamentos;

          setStats(prev => ({
            ...prev,
            gastosRegistrados: lancamentos.length,
          }));
        }

        // Atualizar totais finais
        setStats(prev => ({
          ...prev,
          totalReceitas,
          totalDespesas,
          saldoAtual: totalReceitas - totalDespesas,
        }));

        if (dividas) {
          const totalDividas = dividas.reduce((sum, d) => sum + Number(d.valor_total || 0), 0);
          const hoje = new Date().toISOString().split('T')[0];
          const dividasVencidas = dividas.filter(d =>
            d.data_vencimento && d.data_vencimento < hoje && d.status !== 'paga'
          ).length;

          setStats(prev => ({
            ...prev,
            totalDividas,
            dividasVencidas,
          }));
        }

        if (nfes) {
          setStats(prev => ({
            ...prev,
            nfesEmitidas: nfes.length,
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <AppLayout title="Dashboard">
        <View style={styles.container}>
          <View style={styles.header}>
            <Skeleton width={150} height={32} />
            <Skeleton width={200} height={20} />
          </View>
          <View style={styles.cardsGrid}>
            {[...Array(4)].map((_, i) => (
              <Card key={i} style={styles.card}>
                <CardHeader>
                  <View style={styles.cardHeaderRow}>
                    <Skeleton width={80} height={16} />
                    <Skeleton width={20} height={20} />
                  </View>
                </CardHeader>
                <CardContent>
                  <Skeleton width={100} height={28} />
                  <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
                </CardContent>
              </Card>
            ))}
          </View>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <View style={styles.container}>
        {/* Quick Action Button */}
        {(role === 'admin' || role === 'analista' || role === 'caixa') && (
          <View style={styles.quickActionContainer}>
            <Button
              title="Nova Movimentação"
              onPress={() => router.push('/(app)/caixa' as any)}
              size="lg"
              style={styles.headerButton}
            >
              <Plus size={20} color="#FFFFFF" />
            </Button>
          </View>
        )}

        {/* Stats Cards */}
        <View style={styles.cardsGrid}>
          <View style={styles.cardsRow}>
            <Card style={styles.cardHalf}>
              <CardHeader>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>Receitas</Text>
                  <TrendingUp size={16} color="#10B981" />
                </View>
              </CardHeader>
              <CardContent>
                <Text style={[styles.cardValueSmall, styles.successText]}>
                  {formatCurrency(stats.totalReceitas)}
                </Text>
              </CardContent>
            </Card>

            <Card style={styles.cardHalf}>
              <CardHeader>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>Despesas</Text>
                  <TrendingDown size={16} color="#EF4444" />
                </View>
              </CardHeader>
              <CardContent>
                <Text style={[styles.cardValueSmall, styles.destructiveText]}>
                  {formatCurrency(stats.totalDespesas)}
                </Text>
              </CardContent>
            </Card>
          </View>

          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Saldo Atual</Text>
                <DollarSign size={16} color="#7C3AED" />
              </View>
            </CardHeader>
            <CardContent>
              <Text style={[styles.cardValue, stats.saldoAtual >= 0 ? styles.successText : styles.destructiveText]}>
                {formatCurrency(stats.saldoAtual)}
              </Text>
              <Text style={styles.cardDescription}>Receitas - Despesas</Text>
            </CardContent>
          </Card>

          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Dívidas</Text>
                <CreditCard size={16} color="#F59E0B" />
              </View>
            </CardHeader>
            <CardContent>
              <Text style={[styles.cardValue, styles.warningText]}>
                {formatCurrency(stats.totalDividas)}
              </Text>
              {stats.dividasVencidas > 0 && (
                <Badge variant="destructive" style={{ marginTop: 4 }}>
                  <Text style={styles.badgeText}>{stats.dividasVencidas} vencidas</Text>
                </Badge>
              )}
            </CardContent>
          </Card>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsGrid}>
          <Card style={styles.quickStatCard}>
            <CardHeader>
              <View style={styles.quickStatHeader}>
                <Receipt size={20} color="#7C3AED" />
                <Text style={styles.quickStatTitle}>Movimentações Hoje</Text>
              </View>
            </CardHeader>
            <CardContent>
              <Text style={styles.quickStatValue}>{stats.movimentacoesHoje}</Text>
              <Text style={styles.quickStatDescription}>Entradas e saídas</Text>
            </CardContent>
          </Card>

          <Card style={styles.quickStatCard}>
            <CardHeader>
              <View style={styles.quickStatHeader}>
                <TrendingDown size={20} color="#7C3AED" />
                <Text style={styles.quickStatTitle}>Gastos</Text>
              </View>
            </CardHeader>
            <CardContent>
              <Text style={styles.quickStatValue}>{stats.gastosRegistrados}</Text>
              <Text style={styles.quickStatDescription}>Aguardando NFe</Text>
            </CardContent>
          </Card>

          <Card style={styles.quickStatCard}>
            <CardHeader>
              <View style={styles.quickStatHeader}>
                <AlertTriangle size={20} color="#F59E0B" />
                <Text style={styles.quickStatTitle}>Alertas</Text>
              </View>
            </CardHeader>
            <CardContent>
              <Text style={[styles.quickStatValue, styles.warningText]}>
                {stats.dividasVencidas}
              </Text>
              <Text style={styles.quickStatDescription}>Dívidas vencidas</Text>
            </CardContent>
          </Card>
        </View>

        {/* Recent Transactions */}
        <Card style={styles.transactionsCard}>
          <CardHeader>
            <CardTitle>Últimas Movimentações</CardTitle>
            <CardDescription>
              Suas movimentações de caixa mais recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Nenhuma movimentação encontrada</Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {recentTransactions.map((transaction) => (
                  <View
                    key={transaction.id_movimentacao}
                    style={styles.transactionItem}
                  >
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.transactionIndicator,
                          { backgroundColor: transaction.tipo === 'receita' ? '#10B981' : '#EF4444' },
                        ]}
                      />
                      <View style={styles.transactionTextContainer}>
                        <Text style={styles.transactionDescription} numberOfLines={1}>
                          {transaction.descricao || 'Sem descrição'}
                        </Text>
                        <Text style={styles.transactionMeta}>
                          {transaction.categoria} • {new Date(transaction.data).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.transactionValue,
                        { color: transaction.tipo === 'receita' ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {transaction.tipo === 'receita' ? '+' : '-'}
                      {formatCurrency(Number(transaction.valor))}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  quickActionContainer: {
    marginBottom: 20,
  },
  headerButton: {
    width: '100%',
    borderRadius: 12,
  },
  cardsGrid: {
    gap: 16,
    marginBottom: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  cardHalf: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardValueSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  successText: {
    color: '#10B981',
  },
  destructiveText: {
    color: '#EF4444',
  },
  warningText: {
    color: '#F59E0B',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  quickStatsGrid: {
    gap: 16,
    marginBottom: 16,
  },
  quickStatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickStatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  quickStatDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  transactionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionTextContainer: {
    flex: 1,
  },
  transactionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  transactionMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
});
