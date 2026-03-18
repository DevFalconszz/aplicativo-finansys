import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Linking } from 'react-native';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Plus, Receipt, Eye, Trash2, Search, Calendar, FileText, Edit } from 'lucide-react-native';
import { supabase } from '../integrations/supabase/client';
import { ComprovanteDialog } from '../components/comprovantes/ComprovanteDialog';

interface Comprovante {
  id_comprovante: number;
  tipo: string;
  arquivo: string;
  arquivo_url: string | null;
  id_lancamento: number | null;
  data_pagamento: string | null;
  created_at: string;
}

export default function Comprovantes() {
  const [comprovantes, setComprovantes] = useState<Comprovante[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedComprovante, setSelectedComprovante] = useState<Comprovante | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");

  const fetchComprovantes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comprovante')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComprovantes(data || []);
    } catch (error) {
      console.error('Erro ao carregar comprovantes:', error);
      Alert.alert("Erro", "Não foi possível carregar os comprovantes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComprovantes();
  }, [fetchComprovantes]);

  const handleDelete = (id: number) => {
    Alert.alert(
      "Confirmar exclusão",
      "Deseja realmente excluir este comprovante? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('comprovante')
                .delete()
                .eq('id_comprovante', id);

              if (error) throw error;
              Alert.alert("Sucesso", "Comprovante excluído com sucesso");
              fetchComprovantes();
            } catch (error) {
              console.error('Erro ao excluir:', error);
              Alert.alert("Erro", "Não foi possível excluir o comprovante");
            }
          }
        }
      ]
    );
  };

  const handleView = async (comprovante: Comprovante) => {
    if (!comprovante.arquivo_url) {
      Alert.alert("Aviso", "Arquivo não disponível para este registro.");
      return;
    }

    try {
      const { data } = await supabase.storage
        .from('comprovantes')
        .createSignedUrl(comprovante.arquivo_url, 3600);

      if (data?.signedUrl) {
        await Linking.openURL(data.signedUrl);
      }
    } catch (error) {
      console.error('Erro ao abrir arquivo:', error);
      Alert.alert("Erro", "Não foi possível abrir o arquivo.");
    }
  };

  const filteredComprovantes = comprovantes.filter(c => {
    const matchesSearch = c.arquivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.tipo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterTipo === "todos" || c.tipo === filterTipo;
    return matchesSearch && matchesFilter;
  });

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      recibo: "Recibo",
      nota_fiscal: "Nota Fiscal",
      boleto: "Boleto",
      comprovante_pix: "PIX",
      transferencia: "Transf.",
      cartao: "Cartão",
    };
    return labels[tipo] || tipo.toUpperCase();
  };

  const stats = {
    total: comprovantes.length,
    recibos: comprovantes.filter(c => c.tipo === 'recibo').length,
    pix: comprovantes.filter(c => c.tipo === 'comprovante_pix').length,
    notas: comprovantes.filter(c => c.tipo === 'nota_fiscal').length,
  };

  return (
    <AppLayout title="Comprovantes">
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statsCard, { borderLeftColor: '#2563EB', borderLeftWidth: 4 }]}>
            <View style={styles.statsContent}>
              <Text style={styles.statsLabel}>Total</Text>
              <Text style={[styles.statsValue, { color: '#2563EB' }]}>{stats.total}</Text>
            </View>
          </Card>

          <View style={styles.statsRow}>
            <Card style={[styles.statsCard, { flex: 1, borderLeftColor: '#3B82F6', borderLeftWidth: 4 }]}>
              <View style={styles.statsContent}>
                <Text style={styles.statsLabel}>Recibos</Text>
                <Text style={[styles.statsValue, { color: '#3B82F6', fontSize: 16 }]}>{stats.recibos}</Text>
              </View>
            </Card>
            <Card style={[styles.statsCard, { flex: 1, borderLeftColor: '#A855F7', borderLeftWidth: 4 }]}>
              <View style={styles.statsContent}>
                <Text style={styles.statsLabel}>PIX</Text>
                <Text style={[styles.statsValue, { color: '#A855F7', fontSize: 16 }]}>{stats.pix}</Text>
              </View>
            </Card>
            <Card style={[styles.statsCard, { flex: 1, borderLeftColor: '#10B981', borderLeftWidth: 4 }]}>
              <View style={styles.statsContent}>
                <Text style={styles.statsLabel}>Notas</Text>
                <Text style={[styles.statsValue, { color: '#10B981', fontSize: 16 }]}>{stats.notas}</Text>
              </View>
            </Card>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={styles.actionsHeader}>
          <View style={styles.searchContainer}>
            <Search size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <Button
            onPress={() => {
              setSelectedComprovante(null);
              setDialogVisible(true);
            }}
            style={styles.addButton}
          >
            <Plus size={20} color="#FFFFFF" />
          </Button>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {['todos', 'recibo', 'nota_fiscal', 'comprovante_pix', 'boleto'].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setFilterTipo(t)}
              style={[
                styles.filterBadge,
                filterTipo === t && styles.filterBadgeActive
              ]}
            >
              <Text style={[
                styles.filterText,
                filterTipo === t && styles.filterTextActive
              ]}>
                {t === 'todos' ? 'Todos' : getTipoLabel(t)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
        ) : filteredComprovantes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Receipt size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Nenhum comprovante encontrado</Text>
          </View>
        ) : (
          filteredComprovantes.map((item) => (
            <Card key={item.id_comprovante} style={styles.itemCard}>
              <View style={styles.itemCardContent}>
                <View style={styles.itemInfo}>
                  <View style={styles.titleRow}>
                    <Receipt size={18} color="#2563EB" style={{ marginRight: 8 }} />
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.arquivo || `Comprovante #${item.id_comprovante}`}
                    </Text>
                  </View>
                  <View style={styles.dateRow}>
                    <Calendar size={12} color="#6B7280" />
                    <Text style={styles.itemDate}>
                      {item.data_pagamento ? new Date(item.data_pagamento).toLocaleDateString('pt-BR') : 'Sem data'}
                    </Text>
                    {item.id_lancamento && (
                      <Text style={styles.lancamentoText}> • Lanc. #{item.id_lancamento}</Text>
                    )}
                  </View>
                  <Badge style={styles.tipoBadge}>
                    <Text style={styles.badgeText}>{getTipoLabel(item.tipo)}</Text>
                  </Badge>
                </View>

                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => handleView(item)} style={styles.iconBtn}>
                    <Eye size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    setSelectedComprovante(item);
                    setDialogVisible(true);
                  }} style={styles.iconBtn}>
                    <Edit size={20} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id_comprovante)} style={styles.iconBtn}>
                    <Trash2 size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <ComprovanteDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        onSuccess={fetchComprovantes}
        comprovante={selectedComprovante}
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
    gap: 8,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    padding: 12,
  },
  statsContent: {
    justifyContent: 'center',
  },
  statsLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
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
  filtersScroll: {
    marginBottom: 16,
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
  itemCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  itemCardContent: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  lancamentoText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  tipoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
  },
  badgeText: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: '700',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
});
