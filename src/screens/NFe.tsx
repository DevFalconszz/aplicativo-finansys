import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Platform, Modal } from 'react-native';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Plus, FileText, Eye, Edit, Trash2, Search, Calendar, Download, X } from 'lucide-react-native';
import { supabase } from '../integrations/supabase/client';
import { formatCurrency } from '../lib/utils';
import { NFEDialog } from '../components/nfe/NFEDialog';

interface NFe {
  id_nfe: number | string;
  id?: string;
  numero: string;
  serie: string;
  valor: number;
  data_emissao?: string;
  data?: string;
  xml?: string;
  id_lancamento?: number | string | null;
}

const normalizeNFe = (item: any): NFe => ({
  ...item,
  id_nfe: item.id_nfe ?? item.id,
  numero: item.numero ?? '',
  serie: item.serie ?? '',
  valor: Number(item.valor ?? 0),
  data_emissao: item.data_emissao ?? item.data ?? '',
  xml: item.xml ?? '',
  id_lancamento: item.id_lancamento ?? null,
});

export default function NFe() {
  const [nfes, setNfes] = useState<NFe[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedNfe, setSelectedNfe] = useState<NFe | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [xmlVisible, setXmlVisible] = useState(false);
  const [viewingNfe, setViewingNfe] = useState<NFe | null>(null);

  const fetchNFes = useCallback(async () => {
    try {
      setLoading(true);
      let { data, error } = await (supabase.from('nfe') as any)
        .select('*')
        .order('data_emissao', { ascending: false });

      if (error) {
        const fallback = await (supabase.from('nfe') as any)
          .select('*')
          .order('data', { ascending: false });

        data = fallback.data;
        error = fallback.error;
      }

      if (error) throw error;
      setNfes((data || []).map(normalizeNFe));
    } catch (error) {
      console.error('Erro ao carregar NFes:', error);
      Alert.alert("Erro", "Não foi possível carregar as NFes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNFes();
  }, [fetchNFes]);

  const handleDelete = (id: number | string, numero: string) => {
    Alert.alert(
      "Confirmar exclusão",
      `Deseja realmente excluir a NFe ${numero}? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              let { error } = await (supabase.from('nfe') as any)
                .delete()
                .eq('id_nfe', id);

              if (error) {
                const fallback = await (supabase.from('nfe') as any)
                  .delete()
                  .eq('id', id);

                error = fallback.error;
              }

              if (error) throw error;
              Alert.alert("Sucesso", "NFe excluída com sucesso");
              fetchNFes();
            } catch (error) {
              console.error('Erro ao excluir NFe:', error);
              Alert.alert("Erro", "Não foi possível excluir a NFe");
            }
          }
        }
      ]
    );
  };

  const handleViewXml = (nfe: NFe) => {
    setViewingNfe(nfe);
    setXmlVisible(true);
  };

  const filteredNFes = nfes.filter(nfe =>
    nfe.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nfe.serie?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValor = nfes.reduce((sum, nfe) => sum + Number(nfe.valor || 0), 0);
  const nfesEsteMes = nfes.filter(nfe => {
    const nfeDate = new Date(nfe.data_emissao || nfe.data || '');
    const currentDate = new Date();
    return nfeDate.getMonth() === currentDate.getMonth() && 
           nfeDate.getFullYear() === currentDate.getFullYear();
  }).length;

  return (
    <AppLayout title="NFe">
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statsCard, { borderLeftColor: '#2563EB', borderLeftWidth: 4 }]}>
            <CardContent style={styles.statsContent}>
              <Text style={styles.statsLabel}>Total NFes</Text>
              <Text style={[styles.statsValue, { color: '#2563EB' }]}>{nfes.length}</Text>
              <Text style={styles.statsSub}>Notas emitidas</Text>
            </CardContent>
          </Card>

          <View style={styles.statsRow}>
            <Card style={[styles.statsCard, { flex: 1, borderLeftColor: '#10B981', borderLeftWidth: 4 }]}>
              <CardContent style={styles.statsContent}>
                <Text style={styles.statsLabel}>Valor Total</Text>
                <Text style={[styles.statsValue, { color: '#10B981', fontSize: 16 }]}>{formatCurrency(totalValor)}</Text>
                <Text style={styles.statsSub}>Total acumulado</Text>
              </CardContent>
            </Card>

            <Card style={[styles.statsCard, { flex: 1, borderLeftColor: '#F59E0B', borderLeftWidth: 4 }]}>
              <CardContent style={styles.statsContent}>
                <Text style={styles.statsLabel}>Este Mês</Text>
                <Text style={[styles.statsValue, { color: '#F59E0B', fontSize: 16 }]}>{nfesEsteMes}</Text>
                <Text style={styles.statsSub}>Notas no mês</Text>
              </CardContent>
            </Card>
          </View>
        </View>

        {/* Search and Action */}
        <View style={styles.searchHeader}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por número ou série..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          
          <Button
            onPress={() => {
              setSelectedNfe(null);
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
        ) : filteredNFes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {searchTerm ? "Nenhuma NFe encontrada" : "Nenhuma NFe registrada"}
            </Text>
          </View>
        ) : (
          filteredNFes.map((item) => (
            <Card key={item.id_nfe} style={styles.nfeCard}>
              <CardContent style={styles.nfeCardContent}>
                <View style={styles.nfeInfo}>
                  <View style={styles.titleRow}>
                    <FileText size={18} color="#2563EB" style={{ marginRight: 8 }} />
                    <Text style={styles.nfeTitle} numberOfLines={1}>NFe {item.numero} - Série {item.serie}</Text>
                  </View>
                  <View style={styles.dateRow}>
                    <Calendar size={12} color="#6B7280" />
                    <Text style={styles.nfeDate}> {new Date(item.data_emissao || item.data || '').toLocaleDateString('pt-BR')}</Text>
                  </View>
                  <Text style={styles.nfeValue}>{formatCurrency(Number(item.valor))}</Text>
                </View>

                <View style={styles.nfeActions}>
                  <Badge style={styles.emitidaBadge}>
                    <Text style={styles.badgeText}>Emitida</Text>
                  </Badge>
                  <View style={styles.iconButtons}>
                    <TouchableOpacity onPress={() => handleViewXml(item)} style={styles.iconBtn}>
                      <Eye size={20} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      setSelectedNfe(item);
                      setDialogVisible(true);
                    }} style={styles.iconBtn}>
                      <Edit size={20} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id_nfe, item.numero)} style={styles.iconBtn}>
                      <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))
        )}
      </ScrollView>

      {/* XML Viewer Modal */}
      <Modal
        visible={xmlVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setXmlVisible(false)}
      >
        <View style={styles.xmlOverlay}>
          <View style={styles.xmlContent}>
            <View style={styles.xmlHeader}>
              <Text style={styles.xmlTitle}>Conteúdo XML</Text>
              <TouchableOpacity onPress={() => setXmlVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.xmlScroll}>
              <Text style={styles.xmlText}>{viewingNfe?.xml || "Nenhum conteúdo XML disponível."}</Text>
            </ScrollView>
            <Button 
              title="Fechar" 
              onPress={() => setXmlVisible(false)}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>

      <NFEDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        onSuccess={fetchNFes}
        nfe={selectedNfe}
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
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
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
  nfeCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  nfeCardContent: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  nfeInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nfeTitle: {
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
  nfeDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  nfeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  nfeActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  emitidaBadge: {
    backgroundColor: '#D1FAE5',
    marginBottom: 8,
  },
  badgeText: {
    color: '#065F46',
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
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  xmlOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  xmlContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '80%',
    padding: 20,
  },
  xmlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  xmlTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  xmlScroll: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
  },
  xmlText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#374151',
  },
});
