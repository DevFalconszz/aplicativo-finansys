import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Plus, Wallet, TrendingUp, TrendingDown, Trash2 } from 'lucide-react-native';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../lib/utils';
import { useRouter } from 'expo-router';

interface Movimentacao {
  id_movimentacao: string;
  descricao: string | null;
  valor: number;
  tipo: 'receita' | 'despesa';
  categoria: string | null;
  data: string;
}

export default function Caixa() {
  const router = useRouter();
  const { user } = useAuth();
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [novaMovimentacao, setNovaMovimentacao] = useState({
    descricao: '',
    valor: '',
    tipo: 'despesa' as 'receita' | 'despesa',
    categoria: '',
  });

  useEffect(() => {
    const fetchMovimentacoes = async () => {
      try {
        const { data, error } = await supabase
          .from('movimentacao_caixa')
          .select('*')
          .order('data', { ascending: false });

        if (error) throw error;
        if (data) setMovimentacoes(data);
      } catch (error) {
        console.error('Erro ao carregar movimentações:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovimentacoes();
  }, []);

  const handleNovaMovimentacao = async () => {
    if (!novaMovimentacao.descricao || !novaMovimentacao.valor) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (!user?.id) {
        Alert.alert('Erro', 'Usuário não autenticado');
        return;
      }

      // Buscar o id_usuario numérico correspondente ao auth_id do Supabase
      const { data: userData, error: userError } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('Erro ao buscar ID numérico do usuário:', userError);
        Alert.alert('Erro', 'Não foi possível identificar seu perfil de usuário no sistema.');
        return;
      }

      console.log('Tentando salvar movimentação:', {
        descricao: novaMovimentacao.descricao,
        valor: parseFloat(novaMovimentacao.valor.replace(',', '.')),
        tipo: novaMovimentacao.tipo,
        categoria: novaMovimentacao.categoria || 'Outros',
        data: new Date().toISOString().split('T')[0],
        id_usuario: userData.id_usuario,
      });

      const { data: insertData, error } = await supabase.from('movimentacao_caixa').insert({
        descricao: novaMovimentacao.descricao,
        valor: parseFloat(novaMovimentacao.valor.replace(',', '.')),
        tipo: novaMovimentacao.tipo,
        categoria: novaMovimentacao.categoria || 'Outros',
        data: new Date().toISOString().split('T')[0],
        id_usuario: userData.id_usuario,
      }).select();

      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw error;
      }

      console.log('Dados inseridos com sucesso:', insertData);

      Alert.alert('Sucesso', 'Movimentação registrada com sucesso');
      setShowForm(false);
      setNovaMovimentacao({
        descricao: '',
        valor: '',
        tipo: 'despesa',
        categoria: '',
      });

      // Recarregar dados
      const { data } = await supabase
        .from('movimentacao_caixa')
        .select('*')
        .order('data', { ascending: false });

      if (data) setMovimentacoes(data);
    } catch (error: any) {
      console.error('Erro ao registrar movimentação:', error);
      Alert.alert('Erro', `Não foi possível registrar a movimentação: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const renderMovimentacao = ({ item }: { item: Movimentacao }) => (
    <Card style={styles.movimentacaoCard}>
      <CardHeader>
        <View style={styles.movimentacaoHeader}>
          <View style={styles.movimentacaoLeft}>
            <View
              style={[
                styles.tipoIndicator,
                { backgroundColor: item.tipo === 'receita' ? '#10B981' : '#EF4444' },
              ]}
            />
            <View style={styles.movimentacaoTextContainer}>
              <Text style={styles.movimentacaoDescricao} numberOfLines={1}>
                {item.descricao || 'Sem descrição'}
              </Text>
              <Text style={styles.movimentacaoMeta}>
                {item.categoria} • {new Date(item.data).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.movimentacaoValor,
              { color: item.tipo === 'receita' ? '#10B981' : '#EF4444' },
            ]}
          >
            {item.tipo === 'receita' ? '+' : '-'}
            {formatCurrency(Number(item.valor))}
          </Text>
        </View>
      </CardHeader>
    </Card>
  );

  return (
    <AppLayout title="Caixa">
      <View style={styles.container}>
        <View style={styles.header}>
          <Button
            title={showForm ? "Fechar" : "Nova Movimentação"}
            onPress={() => setShowForm(!showForm)}
            size="lg"
            style={styles.headerButton}
          />
        </View>

        {showForm && (
          <Card style={styles.formCard}>
            <CardHeader>
              <CardTitle>Nova Movimentação</CardTitle>
            </CardHeader>
            <CardContent style={styles.formContent}>
              <Input
                label="Descrição"
                placeholder="Descrição da movimentação"
                value={novaMovimentacao.descricao}
                onChangeText={(text) =>
                  setNovaMovimentacao((prev) => ({ ...prev, descricao: text }))
                }
              />
              <Input
                label="Valor"
                placeholder="0,00"
                value={novaMovimentacao.valor}
                onChangeText={(text) =>
                  setNovaMovimentacao((prev) => ({ ...prev, valor: text }))
                }
                keyboardType="numeric"
              />
              <View style={styles.tipoContainer}>
                <Text style={styles.tipoLabel}>Tipo</Text>
                <View style={styles.tipoButtons}>
                  <Button
                    title="Receita"
                    onPress={() =>
                      setNovaMovimentacao((prev) => ({ ...prev, tipo: 'receita' }))
                    }
                    variant={novaMovimentacao.tipo === 'receita' ? 'default' : 'outline'}
                    style={[
                      styles.tipoButton,
                      novaMovimentacao.tipo === 'receita' && styles.tipoButtonActive,
                    ]}
                  />
                  <Button
                    title="Despesa"
                    onPress={() =>
                      setNovaMovimentacao((prev) => ({ ...prev, tipo: 'despesa' }))
                    }
                    variant={novaMovimentacao.tipo === 'despesa' ? 'default' : 'outline'}
                    style={[
                      styles.tipoButton,
                      novaMovimentacao.tipo === 'despesa' && styles.tipoButtonActive,
                    ]}
                  />
                </View>
              </View>
              <Input
                label="Categoria"
                placeholder="Categoria"
                value={novaMovimentacao.categoria}
                onChangeText={(text) =>
                  setNovaMovimentacao((prev) => ({ ...prev, categoria: text }))
                }
              />
              <Button title="Salvar" onPress={handleNovaMovimentacao} style={styles.saveButton} />
            </CardContent>
          </Card>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            {[...Array(5)].map((_, i) => (
              <Card key={i} style={styles.card}>
                <CardHeader>
                  <Skeleton width={200} height={20} />
                </CardHeader>
                <CardContent>
                  <Skeleton width={100} height={24} />
                </CardContent>
              </Card>
            ))}
          </View>
        ) : movimentacoes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <Wallet size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Nenhuma movimentação</Text>
              <Text style={styles.emptyText}>
                Você não possui movimentações registradas
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View style={styles.listContainer}>
            {movimentacoes.map((item) => (
              <React.Fragment key={item.id_movimentacao}>
                {renderMovimentacao({ item })}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerButton: {
    width: '100%',
    borderRadius: 12,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  formContent: {
    paddingTop: 8,
  },
  tipoContainer: {
    marginBottom: 16,
  },
  tipoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  tipoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  tipoButton: {
    flex: 1,
    borderRadius: 8,
  },
  tipoButtonActive: {
    backgroundColor: '#7C3AED',
  },
  saveButton: {
    marginTop: 8,
  },
  loadingContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    padding: 40,
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
  listContainer: {
    gap: 0,
  },
  movimentacaoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12,
  },
  movimentacaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movimentacaoLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  movimentacaoTextContainer: {
    flex: 1,
  },
  tipoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  movimentacaoDescricao: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  movimentacaoMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  movimentacaoValor: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
});
