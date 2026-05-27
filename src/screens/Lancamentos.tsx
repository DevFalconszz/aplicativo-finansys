import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Plus, FileText, Trash2 } from 'lucide-react-native';
import { supabase } from '../integrations/supabase/client';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

interface Lancamento {
  id: string;
  descricao: string | null;
  valor: number;
  data: string;
}

export default function Lancamentos() {
  const { user } = useAuth();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [novoLancamento, setNovoLancamento] = useState({
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const fetchLancamentos = async () => {
      try {
        const { data, error } = await supabase
          .from('lancamento')
          .select('*')
          .order('data', { ascending: false });

        if (error) throw error;
        if (data) setLancamentos(data);
      } catch (error) {
        console.error('Erro ao carregar lançamentos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLancamentos();
  }, []);

  const handleNovoLancamento = async () => {
    if (!novoLancamento.descricao || !novoLancamento.valor) {
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

      console.log('Tentando salvar lançamento:', {
        descricao: novoLancamento.descricao,
        valor: parseFloat(novoLancamento.valor.replace(',', '.')),
        data: novoLancamento.data,
        id_usuario: userData.id_usuario,
      });

      const { data: insertData, error } = await supabase.from('lancamento').insert({
        descricao: novoLancamento.descricao,
        valor: parseFloat(novoLancamento.valor.replace(',', '.')),
        data: novoLancamento.data,
        id_usuario: userData.id_usuario,
      }).select();

      if (error) {
        console.error('Erro detalhado do Supabase (Lançamento):', error);
        throw error;
      }

      console.log('Lançamento inserido com sucesso:', insertData);

      Alert.alert('Sucesso', 'Lançamento registrado com sucesso');
      setShowForm(false);
      setNovoLancamento({
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
      });

      const { data } = await supabase
        .from('lancamento')
        .select('*')
        .order('data', { ascending: false });

      if (data) setLancamentos(data);
    } catch (error: any) {
      console.error('Erro ao registrar lançamento:', error);
      Alert.alert('Erro', `Não foi possível registrar o lançamento: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const renderLancamento = ({ item }: { item: Lancamento }) => (
    <Card key={`lancamento-${item.id}`} style={styles.lancamentoCard}>
      <CardHeader>
        <View style={styles.lancamentoHeader}>
          <View style={styles.lancamentoLeft}>
            <FileText size={20} color="#7C3AED" />
            <View style={styles.lancamentoTextContainer}>
              <Text style={styles.lancamentoDescricao} numberOfLines={1}>
                {item.descricao || 'Sem descrição'}
              </Text>
              <Text style={styles.lancamentoMeta}>
                {new Date(item.data).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
          <Text style={styles.lancamentoValor}>
            {formatCurrency(Number(item.valor))}
          </Text>
        </View>
      </CardHeader>
    </Card>
  );

  return (
    <AppLayout title="Lançamentos">
      <View style={styles.container}>
        <View style={styles.header}>
          <Button
            title={showForm ? "Fechar" : "Novo Lançamento"}
            onPress={() => setShowForm(!showForm)}
            size="lg"
            style={styles.headerButton}
          />
        </View>

        {showForm && (
          <Card style={styles.formCard}>
            <CardHeader>
              <CardTitle>Novo Lançamento</CardTitle>
            </CardHeader>
            <CardContent style={styles.formContent}>
              <Input
                label="Descrição"
                placeholder="Descrição do lançamento"
                value={novoLancamento.descricao}
                onChangeText={(text) =>
                  setNovoLancamento((prev) => ({ ...prev, descricao: text }))
                }
              />
              <Input
                label="Valor"
                placeholder="0,00"
                value={novoLancamento.valor}
                onChangeText={(text) =>
                  setNovoLancamento((prev) => ({ ...prev, valor: text }))
                }
                keyboardType="numeric"
              />
              <Input
                label="Data"
                placeholder="YYYY-MM-DD"
                value={novoLancamento.data}
                onChangeText={(text) =>
                  setNovoLancamento((prev) => ({ ...prev, data: text }))
                }
              />
              <Button title="Salvar" onPress={handleNovoLancamento} style={styles.saveButton} />
            </CardContent>
          </Card>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            {[...Array(5)].map((_, i) => (
              <Card key={`skeleton-${i}`} style={styles.card}>
                <CardHeader>
                  <Skeleton width={200} height={20} />
                </CardHeader>
                <CardContent>
                  <Skeleton width={100} height={24} />
                </CardContent>
              </Card>
            ))}
          </View>
        ) : lancamentos.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <FileText size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Nenhum lançamento</Text>
              <Text style={styles.emptyText}>
                Você não possui lançamentos registrados
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View style={styles.listContainer}>
            {lancamentos.map((item, index) => (
              <React.Fragment key={`fragment-${item.id || index}`}>
                {renderLancamento({ item })}
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
  lancamentoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12,
  },
  lancamentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lancamentoLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lancamentoTextContainer: {
    flex: 1,
  },
  lancamentoDescricao: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  lancamentoMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  lancamentoValor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
});
