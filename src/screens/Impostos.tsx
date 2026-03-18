import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Plus, Edit, Trash2, Calculator, DollarSign, Filter, ChevronDown, ChevronUp } from 'lucide-react-native';
import { supabase } from '../integrations/supabase/client';
import { formatCurrency } from '../lib/utils';
import { ImpostoDialog } from '../components/impostos/ImpostoDialog';

interface Imposto {
  id_imposto: number;
  tipo: string;
  valor: number;
  periodo: string;
  id_lancamento: number;
  lancamento?: {
    descricao: string;
    data: string;
  };
}

export default function Impostos() {
  const [impostos, setImpostos] = useState<Imposto[]>([]);
  const [filteredImpostos, setFilteredImpostos] = useState<Imposto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedImposto, setSelectedImposto] = useState<Imposto | null>(null);
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [showResumo, setShowResumo] = useState(true);

  const fetchImpostos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('imposto')
        .select(`
          *,
          lancamento(
            descricao,
            data
          )
        `)
        .order('periodo', { ascending: false });

      if (error) throw error;
      setImpostos(data || []);
    } catch (error) {
      console.error('Erro ao carregar impostos:', error);
      Alert.alert("Erro", "Não foi possível carregar os impostos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImpostos();
  }, [fetchImpostos]);

  useEffect(() => {
    applyFilters();
  }, [impostos, filterTipo]);

  const applyFilters = () => {
    let filtered = [...impostos];
    if (filterTipo !== "todos") {
      filtered = filtered.filter(i => i.tipo === filterTipo);
    }
    setFilteredImpostos(filtered);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja excluir este imposto? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('imposto')
                .delete()
                .eq('id_imposto', id);

              if (error) throw error;
              Alert.alert("Sucesso", "Imposto excluído com sucesso");
              fetchImpostos();
            } catch (error) {
              console.error('Erro ao excluir imposto:', error);
              Alert.alert("Erro", "Não foi possível excluir o imposto");
            }
          }
        }
      ]
    );
  };

  const tipos = Array.from(new Set(impostos.map(i => i.tipo).filter(Boolean)));
  const totalImpostos = filteredImpostos.reduce((sum, i) => sum + Number(i.valor), 0);
  
  const impostosPorTipo = filteredImpostos.reduce((acc, imposto) => {
    const tipo = imposto.tipo || 'Outros';
    acc[tipo] = (acc[tipo] || 0) + Number(imposto.valor);
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppLayout title="Impostos">
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statsCard, { borderLeftColor: '#F59E0B', borderLeftWidth: 4 }]}>
            <CardContent style={styles.statsContent}>
              <View style={styles.statsHeaderRow}>
                <Text style={styles.statsLabel}>Total de Impostos</Text>
                <Calculator size={16} color="#F59E0B" />
              </View>
              <Text style={[styles.statsValue, { color: '#F59E0B' }]}>{formatCurrency(totalImpostos)}</Text>
            </CardContent>
          </Card>

          <View style={styles.statsRow}>
            <Card style={[styles.statsCard, { flex: 1, borderLeftColor: '#2563EB', borderLeftWidth: 4 }]}>
              <CardContent style={styles.statsContent}>
                <View style={styles.statsHeaderRow}>
                  <Text style={styles.statsLabel}>Quantidade</Text>
                  <DollarSign size={16} color="#2563EB" />
                </View>
                <Text style={[styles.statsValue, { color: '#2563EB', fontSize: 18 }]}>{filteredImpostos.length}</Text>
              </CardContent>
            </Card>

            <Card style={[styles.statsCard, { flex: 1, borderLeftColor: '#10B981', borderLeftWidth: 4 }]}>
              <CardContent style={styles.statsContent}>
                <View style={styles.statsHeaderRow}>
                  <Text style={styles.statsLabel}>Tipos</Text>
                  <Calculator size={16} color="#10B981" />
                </View>
                <Text style={[styles.statsValue, { color: '#10B981', fontSize: 18 }]}>{Object.keys(impostosPorTipo).length}</Text>
              </CardContent>
            </Card>
          </View>
        </View>

        {/* Resumo por Tipo */}
        {Object.keys(impostosPorTipo).length > 0 && (
          <Card style={styles.resumoCard}>
            <TouchableOpacity 
              style={styles.resumoHeader} 
              onPress={() => setShowResumo(!showResumo)}
            >
              <Text style={styles.resumoTitle}>Resumo por Tipo</Text>
              {showResumo ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
            </TouchableOpacity>
            {showResumo && (
              <CardContent style={styles.resumoContent}>
                {Object.entries(impostosPorTipo).map(([tipo, valor]) => (
                  <View key={tipo} style={styles.resumoItem}>
                    <Text style={styles.resumoTipo}>{tipo}</Text>
                    <Text style={styles.resumoValor}>{formatCurrency(valor)}</Text>
                  </View>
                ))}
              </CardContent>
            )}
          </Card>
        )}

        {/* Filters and Action */}
        <View style={styles.actionsHeader}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <TouchableOpacity
              onPress={() => setFilterTipo("todos")}
              style={[
                styles.filterBadge,
                filterTipo === "todos" && styles.filterBadgeActive
              ]}
            >
              <Text style={[styles.filterText, filterTipo === "todos" && styles.filterTextActive]}>Todos</Text>
            </TouchableOpacity>
            {tipos.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setFilterTipo(t)}
                style={[
                  styles.filterBadge,
                  filterTipo === t && styles.filterBadgeActive
                ]}
              >
                <Text style={[styles.filterText, filterTipo === t && styles.filterTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Button
            onPress={() => {
              setSelectedImposto(null);
              setDialogVisible(true);
            }}
            style={styles.addButton}
          >
            <Plus size={20} color="#FFFFFF" />
          </Button>
        </View>

        {/* List */}
        <Text style={styles.sectionTitle}>Histórico de Impostos</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
        ) : filteredImpostos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum imposto encontrado</Text>
          </View>
        ) : (
          filteredImpostos.map((item) => (
            <Card key={item.id_imposto} style={styles.impostoCard}>
              <CardContent style={styles.impostoCardContent}>
                <View style={styles.impostoInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.impostoType}>{item.tipo}</Text>
                    <Badge style={styles.periodBadge}>
                      <Text style={styles.periodText}>{item.periodo}</Text>
                    </Badge>
                  </View>
                  <Text style={styles.lancamentoDesc} numberOfLines={1}>
                    Lançamento: {item.lancamento?.descricao || '-'}
                  </Text>
                  <Text style={styles.lancamentoData}>
                    Data: {item.lancamento?.data ? new Date(item.lancamento.data).toLocaleDateString('pt-BR') : '-'}
                  </Text>
                </View>

                <View style={styles.impostoActions}>
                  <Text style={styles.impostoValue}>{formatCurrency(Number(item.valor))}</Text>
                  <View style={styles.iconButtons}>
                    <TouchableOpacity onPress={() => {
                      setSelectedImposto(item);
                      setDialogVisible(true);
                    }} style={styles.iconBtn}>
                      <Edit size={20} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id_imposto)} style={styles.iconBtn}>
                      <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))
        )}
      </ScrollView>

      <ImpostoDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        onSuccess={fetchImpostos}
        imposto={selectedImposto}
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  statsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  statsContent: {
    padding: 12,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statsValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  resumoCard: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  resumoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resumoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  resumoContent: {
    padding: 16,
  },
  resumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  resumoTipo: {
    fontSize: 14,
    color: '#4B5563',
  },
  resumoValor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  filtersScroll: {
    flex: 1,
  },
  filterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  filterBadgeActive: {
    backgroundColor: '#2563EB',
  },
  filterText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  impostoCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  impostoCardContent: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  impostoInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  impostoType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  periodBadge: {
    backgroundColor: '#FEF3C7',
  },
  periodText: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: '700',
  },
  lancamentoDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  lancamentoData: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  impostoActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  impostoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 8,
  },
  iconButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
});
