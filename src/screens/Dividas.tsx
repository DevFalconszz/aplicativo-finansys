import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Plus, Edit, Trash2, CheckCircle, AlertTriangle, Filter, Calendar } from 'lucide-react-native';
import { supabase } from '../integrations/supabase/client';
import { formatCurrency } from '../lib/utils';
import { DividaDialog } from '../components/dividas/DividaDialog';

interface Divida {
  id_divida: number;
  descricao: string;
  valor_total: number;
  data_vencimento: string;
  status: string;
}

export default function Dividas() {
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [filteredDividas, setFilteredDividas] = useState<Divida[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedDivida, setSelectedDivida] = useState<Divida | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  const fetchDividas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('divida')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      setDividas(data || []);
    } catch (error) {
      console.error('Erro ao carregar dívidas:', error);
      Alert.alert("Erro", "Não foi possível carregar as dívidas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDividas();
  }, [fetchDividas]);

  useEffect(() => {
    applyFilters();
  }, [dividas, filterStatus]);

  const applyFilters = () => {
    let filtered = [...dividas];
    const hoje = new Date().toISOString().split('T')[0];

    if (filterStatus === "paga") {
      filtered = filtered.filter(d => d.status === 'paga');
    } else if (filterStatus === "pendente") {
      filtered = filtered.filter(d => d.status !== 'paga' && d.data_vencimento >= hoje);
    } else if (filterStatus === "vencida") {
      filtered = filtered.filter(d => d.status !== 'paga' && d.data_vencimento < hoje);
    }

    setFilteredDividas(filtered);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja excluir esta dívida? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('divida')
                .delete()
                .eq('id_divida', id);

              if (error) throw error;
              Alert.alert("Sucesso", "Dívida excluída com sucesso");
              fetchDividas();
            } catch (error) {
              console.error('Erro ao excluir dívida:', error);
              Alert.alert("Erro", "Não foi possível excluir a dívida");
            }
          }
        }
      ]
    );
  };

  const handleMarcarPaga = async (id: number) => {
    try {
      const { error } = await supabase
        .from('divida')
        .update({ status: 'paga' })
        .eq('id_divida', id);

      if (error) throw error;
      Alert.alert("Sucesso", "Dívida marcada como paga");
      fetchDividas();
    } catch (error) {
      console.error('Erro ao atualizar dívida:', error);
      Alert.alert("Erro", "Não foi possível atualizar a dívida");
    }
  };

  const getStatusColor = (status: string, dataVencimento: string) => {
    const hoje = new Date().toISOString().split('T')[0];
    if (status === 'paga') return '#10B981'; // success
    if (dataVencimento < hoje) return '#EF4444'; // destructive
    return '#F59E0B'; // warning
  };

  const getStatusText = (status: string, dataVencimento: string) => {
    const hoje = new Date().toISOString().split('T')[0];
    if (status === 'paga') return 'Paga';
    if (dataVencimento < hoje) return 'Vencida';
    return 'Pendente';
  };

  const totalDividas = dividas.reduce((sum, d) => sum + Number(d.valor_total || 0), 0);
  const dividasPendentes = dividas.filter(d => d.status !== 'paga');
  const totalPendentes = dividasPendentes.reduce((sum, d) => sum + Number(d.valor_total || 0), 0);
  const dividasVencidas = dividas.filter(d => {
    const hoje = new Date().toISOString().split('T')[0];
    return d.data_vencimento < hoje && d.status !== 'paga';
  });
  const totalVencidas = dividasVencidas.reduce((sum, d) => sum + Number(d.valor_total || 0), 0);

  return (
    <AppLayout title="Dívidas">
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statsCard, { borderLeftColor: '#F59E0B', borderLeftWidth: 4 }]}>
            <CardContent style={styles.statsContent}>
              <Text style={styles.statsLabel}>Total</Text>
              <Text style={[styles.statsValue, { color: '#F59E0B' }]}>{formatCurrency(totalDividas)}</Text>
              <Text style={styles.statsSub}>{dividas.length} dívidas</Text>
            </CardContent>
          </Card>

          <View style={styles.statsRow}>
            <Card style={[styles.statsCard, { flex: 1, borderLeftColor: '#2563EB', borderLeftWidth: 4 }]}>
              <CardContent style={styles.statsContent}>
                <Text style={styles.statsLabel}>Pendentes</Text>
                <Text style={[styles.statsValue, { color: '#2563EB', fontSize: 16 }]}>{formatCurrency(totalPendentes)}</Text>
                <Text style={styles.statsSub}>{dividasPendentes.length} pendentes</Text>
              </CardContent>
            </Card>

            <Card style={[styles.statsCard, { flex: 1, borderLeftColor: '#EF4444', borderLeftWidth: 4 }]}>
              <CardContent style={styles.statsContent}>
                <View style={styles.labelWithIcon}>
                  <AlertTriangle size={12} color="#EF4444" />
                  <Text style={styles.statsLabel}> Vencidas</Text>
                </View>
                <Text style={[styles.statsValue, { color: '#EF4444', fontSize: 16 }]}>{formatCurrency(totalVencidas)}</Text>
                <Text style={styles.statsSub}>{dividasVencidas.length} vencidas</Text>
              </CardContent>
            </Card>
          </View>
        </View>

        {/* Filters and Action */}
        <View style={styles.actionsHeader}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {['todos', 'pendente', 'vencida', 'paga'].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setFilterStatus(status)}
                style={[
                  styles.filterBadge,
                  filterStatus === status && styles.filterBadgeActive
                ]}
              >
                <Text style={[
                  styles.filterText,
                  filterStatus === status && styles.filterTextActive
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Button
            onPress={() => {
              setSelectedDivida(null);
              setDialogVisible(true);
            }}
            style={styles.addButton}
          >
            <Plus size={20} color="#FFFFFF" />
          </Button>
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
        ) : filteredDividas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma dívida encontrada</Text>
          </View>
        ) : (
          filteredDividas.map((item) => (
            <Card key={item.id_divida} style={styles.dividaCard}>
              <CardContent style={styles.dividaCardContent}>
                <View style={styles.dividaInfo}>
                  <View style={styles.titleRow}>
                    <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status, item.data_vencimento) }]} />
                    <Text style={styles.dividaTitle} numberOfLines={1}>{item.descricao}</Text>
                  </View>
                  <View style={styles.dateRow}>
                    <Calendar size={12} color="#6B7280" />
                    <Text style={styles.dividaDate}> Venc: {new Date(item.data_vencimento).toLocaleDateString('pt-BR')}</Text>
                    {new Date(item.data_vencimento) < new Date() && item.status !== 'paga' && (
                      <Text style={styles.vencidaText}> • VENCIDA</Text>
                    )}
                  </View>
                  <Text style={styles.dividaValue}>{formatCurrency(Number(item.valor_total))}</Text>
                </View>

                <View style={styles.dividaActions}>
                  <Badge style={{ backgroundColor: getStatusColor(item.status, item.data_vencimento), marginBottom: 8 }}>
                    <Text style={styles.badgeText}>{getStatusText(item.status, item.data_vencimento)}</Text>
                  </Badge>
                  <View style={styles.iconButtons}>
                    {item.status !== 'paga' && (
                      <TouchableOpacity onPress={() => handleMarcarPaga(item.id_divida)} style={styles.iconBtn}>
                        <CheckCircle size={20} color="#10B981" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => {
                      setSelectedDivida(item);
                      setDialogVisible(true);
                    }} style={styles.iconBtn}>
                      <Edit size={20} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id_divida)} style={styles.iconBtn}>
                      <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))
        )}
      </ScrollView>

      <DividaDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        onSuccess={fetchDividas}
        divida={selectedDivida}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statsContent: {
    padding: 12,
  },
  statsLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 4,
  },
  statsSub: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
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
  dividaCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  dividaCardContent: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  dividaInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dividaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dividaDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  vencidaText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
  },
  dividaValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  dividaActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
