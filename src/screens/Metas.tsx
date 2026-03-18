import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Modal,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Target, 
  Plus, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Filter,
  MoreVertical,
  X,
  Calendar,
  AlertCircle
} from 'lucide-react-native';
import { supabase } from '../integrations/supabase/client';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

const { width } = Dimensions.get('window');

interface Meta {
  id_meta: number;
  descricao: string;
  valor_objetivo: number;
  valor_atual: number;
  periodo: string;
  id_usuario: number;
}

interface MetaWithProgress extends Meta {
  percentual: number;
  status: 'pendente' | 'em_andamento' | 'concluida';
}

const PERIODOS = [
  { label: 'Mensal', value: 'mensal' },
  { label: 'Trimestral', value: 'trimestral' },
  { label: 'Semestral', value: 'semestral' },
  { label: 'Anual', value: 'anual' }
];

export default function Metas() {
  const [metas, setMetas] = useState<MetaWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMeta, setSelectedMeta] = useState<MetaWithProgress | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('todos');
  
  const [formData, setFormData] = useState({
    descricao: '',
    valor_objetivo: '',
    periodo: 'mensal'
  });
  const [newProgress, setNewProgress] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    fetchMetas();
  }, []);

  const fetchMetas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meta')
        .select('*')
        .order('id_meta', { ascending: false });

      if (error) throw error;

      if (data) {
        const processed = data.map(meta => {
          const valorAtual = Number(meta.valor_atual) || 0;
          const percentual = meta.valor_objetivo > 0 ? (valorAtual / meta.valor_objetivo) * 100 : 0;
          
          let status: 'pendente' | 'em_andamento' | 'concluida' = 'pendente';
          if (percentual >= 100) status = 'concluida';
          else if (percentual > 0) status = 'em_andamento';

          return {
            ...meta,
            percentual: Math.min(percentual, 100),
            status
          };
        });
        setMetas(processed);
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as metas');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMeta = async () => {
    try {
      if (!formData.descricao.trim() || !formData.valor_objetivo) {
        Alert.alert('Aviso', 'Preencha todos os campos obrigatórios');
        return;
      }

      const { data: userData } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('auth_id', user?.id)
        .single();

      if (!userData) throw new Error('Usuário não encontrado');

      const payload = {
        descricao: formData.descricao,
        valor_objetivo: parseFloat(formData.valor_objetivo),
        periodo: formData.periodo,
        id_usuario: userData.id_usuario
      };

      if (isEditMode && selectedMeta) {
        const { error } = await supabase
          .from('meta')
          .update(payload)
          .eq('id_meta', selectedMeta.id_meta);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('meta')
          .insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      resetForm();
      fetchMetas();
      Alert.alert('Sucesso', isEditMode ? 'Meta atualizada' : 'Meta criada');
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar');
    }
  };

  const handleDeleteMeta = (meta: MetaWithProgress) => {
    Alert.alert(
      'Excluir Meta',
      `Tem certeza que deseja excluir "${meta.descricao}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('meta')
                .delete()
                .eq('id_meta', meta.id_meta);
              if (error) throw error;
              fetchMetas();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir');
            }
          }
        }
      ]
    );
  };

  const handleUpdateProgress = async () => {
    try {
      if (!newProgress || !selectedMeta) return;

      const { error } = await supabase
        .from('meta')
        .update({ valor_atual: parseFloat(newProgress) })
        .eq('id_meta', selectedMeta.id_meta);

      if (error) throw error;

      setIsProgressModalOpen(false);
      setNewProgress('');
      fetchMetas();
      Alert.alert('Sucesso', 'Progresso atualizado');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o progresso');
    }
  };

  const resetForm = () => {
    setFormData({ descricao: '', valor_objetivo: '', periodo: 'mensal' });
    setIsEditMode(false);
    setSelectedMeta(null);
  };

  const openEdit = (meta: MetaWithProgress) => {
    setFormData({
      descricao: meta.descricao,
      valor_objetivo: meta.valor_objetivo.toString(),
      periodo: meta.periodo
    });
    setSelectedMeta(meta);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const ProgressBar = ({ percent, color }: { percent: number, color: string }) => (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { width: `${percent}%`, backgroundColor: color }]} />
    </View>
  );

  const filteredMetas = metas.filter(m => filterStatus === 'todos' || m.status === filterStatus);

  if (loading && metas.length === 0) {
    return (
      <AppLayout title="Metas">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Metas Financeiras">
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Stats Header */}
        <View style={styles.statsHeader}>
          <View style={styles.mainStat}>
            <Text style={styles.mainStatLabel}>Progresso Geral</Text>
            <Text style={styles.mainStatValue}>
              {metas.length > 0 
                ? Math.round(metas.reduce((acc, m) => acc + m.percentual, 0) / metas.length) 
                : 0}%
            </Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.smallStat}>
              <Text style={styles.smallStatValue}>{metas.length}</Text>
              <Text style={styles.smallStatLabel}>Total</Text>
            </View>
            <View style={styles.smallStat}>
              <Text style={[styles.smallStatValue, { color: '#10B981' }]}>
                {metas.filter(m => m.status === 'concluida').length}
              </Text>
              <Text style={styles.smallStatLabel}>Concluídas</Text>
            </View>
            <View style={styles.smallStat}>
              <Text style={[styles.smallStatValue, { color: '#F59E0B' }]}>
                {metas.filter(m => m.status === 'em_andamento').length}
              </Text>
              <Text style={styles.smallStatLabel}>Em Curso</Text>
            </View>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {['todos', 'pendente', 'em_andamento', 'concluida'].map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setFilterStatus(s)}
              style={[
                styles.filterChip,
                filterStatus === s && styles.filterChipActive
              ]}
            >
              <Text style={[
                styles.filterChipText,
                filterStatus === s && styles.filterChipTextActive
              ]}>
                {s === 'todos' ? 'Todas' : s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Goals List - MODERN CARDS */}
        {filteredMetas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Target size={64} color="#E5E7EB" />
            <Text style={styles.emptyText}>Nenhuma meta encontrada</Text>
          </View>
        ) : (
          filteredMetas.map((meta) => (
            <View key={meta.id_meta} style={styles.goalCard}>
              <View style={styles.goalCardHeader}>
                <View style={styles.goalIconContainer}>
                  <Target size={24} color={meta.status === 'concluida' ? '#10B981' : '#6366F1'} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.goalTitle} numberOfLines={1}>{meta.descricao}</Text>
                  <View style={styles.goalBadgeRow}>
                    <Badge variant="outline" style={styles.periodBadge}>
                      <Text style={styles.periodBadgeText}>{meta.periodo}</Text>
                    </Badge>
                    {meta.status === 'concluida' && (
                      <View style={styles.successBadge}>
                        <CheckCircle2 size={12} color="#10B981" />
                        <Text style={styles.successBadgeText}>Atingida</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => {
                    setSelectedMeta(meta);
                    setNewProgress(meta.valor_atual.toString());
                    setIsProgressModalOpen(true);
                  }} style={styles.actionBtn}>
                    <TrendingUp size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openEdit(meta)} style={styles.actionBtn}>
                    <Edit2 size={18} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteMeta(meta)} style={styles.actionBtn}>
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.goalCardBody}>
                <View style={styles.goalValuesRow}>
                  <View>
                    <Text style={styles.valueLabel}>Acumulado</Text>
                    <Text style={styles.valueText}>{formatCurrency(meta.valor_atual)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.valueLabel}>Objetivo</Text>
                    <Text style={styles.valueText}>{formatCurrency(meta.valor_objetivo)}</Text>
                  </View>
                </View>

                <ProgressBar 
                  percent={meta.percentual} 
                  color={meta.status === 'concluida' ? '#10B981' : '#6366F1'} 
                />
                
                <View style={styles.percentRow}>
                  <Text style={styles.percentText}>{Math.round(meta.percentual)}% completo</Text>
                  {meta.status !== 'concluida' && (
                    <Text style={styles.remainingText}>
                      Faltam {formatCurrency(meta.valor_objetivo - meta.valor_atual)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          resetForm();
          setIsModalOpen(true);
        }}
      >
        <Plus size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Create/Edit Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditMode ? 'Editar Meta' : 'Nova Meta'}</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.inputLabel}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ex: Reserva de Emergência"
                value={formData.descricao}
                onChangeText={(t) => setFormData({...formData, descricao: t})}
                multiline
              />

              <Text style={styles.inputLabel}>Valor Objetivo</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                keyboardType="numeric"
                value={formData.valor_objetivo}
                onChangeText={(t) => setFormData({...formData, valor_objetivo: t})}
              />

              <Text style={styles.inputLabel}>Período</Text>
              <View style={styles.periodGrid}>
                {PERIODOS.map(p => (
                  <TouchableOpacity 
                    key={p.value}
                    style={[styles.periodOption, formData.periodo === p.value && styles.periodOptionActive]}
                    onPress={() => setFormData({...formData, periodo: p.value})}
                  >
                    <Text style={[styles.periodOptionText, formData.periodo === p.value && styles.periodOptionTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button 
                style={styles.saveButton}
                onPress={handleSaveMeta}
              >
                <Text style={styles.saveButtonText}>
                  {isEditMode ? 'Salvar Alterações' : 'Criar Meta'}
                </Text>
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Progress Update Modal */}
      <Modal visible={isProgressModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.miniModal}>
            <Text style={styles.modalTitle}>Atualizar Valor</Text>
            <Text style={styles.modalSubtitle}>Quanto você já poupou para esta meta?</Text>
            
            <TextInput
              style={styles.input}
              placeholder="0,00"
              keyboardType="numeric"
              value={newProgress}
              onChangeText={setNewProgress}
              autoFocus
            />

            <View style={styles.miniModalFooter}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => setIsProgressModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmBtn}
                onPress={handleUpdateProgress}
              >
                <Text style={styles.confirmBtnText}>Atualizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsHeader: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainStatLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  mainStatValue: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 20,
  },
  smallStat: {
    alignItems: 'center',
    flex: 1,
  },
  smallStatValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  smallStatLabel: {
    color: '#6B7280',
    fontSize: 12,
  },
  filterContainer: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  goalCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  goalBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodBadge: {
    backgroundColor: '#EEF2FF',
    borderColor: 'transparent',
    paddingVertical: 2,
  },
  periodBadgeText: {
    color: '#6366F1',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  successBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
  goalCardBody: {
    gap: 12,
  },
  goalValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  progressContainer: {
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  percentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  percentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  remainingText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 60,
  },
  emptyText: {
    color: '#9CA3AF',
    marginTop: 16,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '85%',
  },
  miniModal: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: -8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodOption: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  periodOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  periodOptionTextActive: {
    color: '#6366F1',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#6366F1',
    height: 56,
    borderRadius: 16,
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  miniModalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
