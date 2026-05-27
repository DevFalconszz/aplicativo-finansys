import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { X, Search, RefreshCw } from "lucide-react-native";
import { supabase } from "../../integrations/supabase/client";
import { formatCurrency } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";

interface Lancamento {
  id: string;
  id_lancamento?: string | number;
  descricao: string;
  data: string;
  valor: number;
}

interface ImpostoDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  imposto?: {
    id_imposto: number;
    tipo: string;
    valor: number;
    periodo: string;
    id_lancamento: any;
  } | null;
}

export function ImpostoDialog({ visible, onClose, onSuccess, imposto }: ImpostoDialogProps) {
  const { user } = useAuth();
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [idLancamento, setIdLancamento] = useState<string | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLancamentos, setFetchingLancamentos] = useState(false);
  const [showLancamentoSelector, setShowLancamentoSelector] = useState(false);
  const [selectorSearchTerm, setSelectorSearchTerm] = useState("");

  const tiposImposto = ["ICMS", "IPI", "PIS", "COFINS", "ISS", "IRPJ", "CSLL", "Outro"];

  const getLancamentoId = (lancamento: Lancamento) =>
    (lancamento.id_lancamento ?? lancamento.id).toString();

  const filteredLancamentos = lancamentos.filter(l => 
    l.descricao?.toLowerCase().includes(selectorSearchTerm.toLowerCase())
  );

  useEffect(() => {
    if (visible && user?.id) {
      fetchLancamentos();
      if (imposto) {
        setTipo(imposto.tipo || "");
        setValor(imposto.valor?.toString() || "");
        setPeriodo(imposto.periodo || "");
        setIdLancamento(imposto.id_lancamento?.toString() || null);
      } else {
        setTipo("");
        setValor("");
        const now = new Date();
        setPeriodo(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        setIdLancamento(null);
      }
    }
  }, [imposto, visible, user?.id]);

  const fetchLancamentos = async () => {
    try {
      setFetchingLancamentos(true);
      console.log('fetchLancamentos: Buscando lançamentos...');

      const { data, error } = await supabase
        .from('lancamento')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;

      console.log(`fetchLancamentos: ${data?.length || 0} lançamentos encontrados`);
      setLancamentos(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar lançamentos:', error);
    } finally {
      setFetchingLancamentos(false);
    }
  };

  const handleSubmit = async () => {
    const periodoLimpo = periodo.trim();
    if (!tipo || !valor || !periodoLimpo || !idLancamento) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios e vincule um lançamento.");
      return;
    }

    setLoading(true);

    try {
      const impostoData = {
        tipo,
        valor: parseFloat(valor.replace(',', '.')),
        periodo: periodoLimpo,
        id_lancamento: idLancamento,
      };

      if (imposto) {
        const { error } = await (supabase.from("imposto") as any)
          .update(impostoData)
          .eq('id_imposto', imposto.id_imposto);

        if (error) throw error;
        Alert.alert("Sucesso", "Imposto atualizado com sucesso");
      } else {
        const { error } = await (supabase.from("imposto") as any)
          .insert([impostoData]);

        if (error) throw error;
        Alert.alert("Sucesso", "Imposto cadastrado com sucesso");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Erro ao salvar imposto:", error);
      Alert.alert("Erro", "Não foi possível salvar o imposto: " + (error.message || "erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const selectedLancamento = lancamentos.find(l => getLancamentoId(l) === idLancamento);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        {showLancamentoSelector ? (
          <View style={styles.fullScreenSelector}>
            <View style={styles.fullScreenHeader}>
              <TouchableOpacity 
                onPress={() => {
                  setShowLancamentoSelector(false);
                  setSelectorSearchTerm("");
                }}
                style={styles.backButton}
              >
                <X size={24} color="#1F2937" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.fullScreenTitle}>Vincular Lançamento</Text>
                <Text style={styles.fullScreenSubtitle}>{filteredLancamentos.length} disponíveis</Text>
              </View>
              <TouchableOpacity 
                onPress={fetchLancamentos} 
                style={styles.refreshButton}
                disabled={fetchingLancamentos}
              >
                <RefreshCw size={22} color={fetchingLancamentos ? "#9CA3AF" : "#2563EB"} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarContainer}>
              <View style={styles.searchBar}>
                <Search size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Pesquisar por descrição..."
                  value={selectorSearchTerm}
                  onChangeText={setSelectorSearchTerm}
                  placeholderTextColor="#9CA3AF"
                />
                {selectorSearchTerm.length > 0 && (
                  <TouchableOpacity onPress={() => setSelectorSearchTerm("")}>
                    <X size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <View style={styles.fullScreenListContainer}>
              {fetchingLancamentos ? (
                <View style={styles.fullScreenLoader}>
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text style={styles.loaderText}>Buscando lançamentos...</Text>
                </View>
              ) : (
                <ScrollView 
                  style={styles.fullScreenList} 
                  contentContainerStyle={styles.fullScreenListContent}
                  showsVerticalScrollIndicator={true}
                >
                  {filteredLancamentos.map((l, index) => {
                    const itemId = getLancamentoId(l);
                    const isActive = idLancamento === itemId;
                    return (
                      <TouchableOpacity
                        key={`full-selector-item-${itemId}-${index}`}
                        style={[
                          styles.fullScreenItem,
                          isActive && styles.fullScreenItemActive
                        ]}
                        onPress={() => {
                          setIdLancamento(itemId);
                          setShowLancamentoSelector(false);
                          setSelectorSearchTerm("");
                        }}
                      >
                        <View style={styles.itemContent}>
                          <View style={styles.itemInfo}>
                            <Text style={[styles.itemTitle, isActive && styles.itemTitleActive]}>
                              {l.descricao || "Sem descrição"}
                            </Text>
                            <Text style={styles.itemDate}>
                              {l.data ? new Date(l.data).toLocaleDateString('pt-BR') : 'Sem data'}
                            </Text>
                          </View>
                          <View style={styles.fullScreenPriceTag}>
                            <Text style={styles.itemPrice}>
                              {formatCurrency(l.valor)}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {filteredLancamentos.length === 0 && (
                    <View style={styles.emptyContainer}>
                      <Search size={48} color="#D1D5DB" />
                      <Text style={styles.emptyText}>Nenhum lançamento encontrado</Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{imposto ? "Editar Imposto" : "Novo Imposto"}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lançamento Vinculado *</Text>
                <TouchableOpacity 
                  style={styles.selector}
                  onPress={() => setShowLancamentoSelector(true)}
                >
                  <Text style={idLancamento ? styles.selectorText : styles.placeholderText}>
                    {selectedLancamento 
                      ? `${selectedLancamento.descricao} (${formatCurrency(selectedLancamento.valor)})`
                      : "Selecione um lançamento"}
                  </Text>
                  <Search size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tipo de Imposto *</Text>
                <View style={styles.tiposContainer}>
                  {tiposImposto.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.tipoButton,
                        tipo === t && styles.tipoButtonActive,
                      ]}
                      onPress={() => setTipo(t)}
                    >
                      <Text
                        style={[
                          styles.tipoText,
                          tipo === t && styles.tipoTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Valor *</Text>
                <TextInput
                  style={styles.input}
                  value={valor}
                  onChangeText={setValor}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Período (AAAA-MM) *</Text>
                <TextInput
                  style={styles.input}
                  value={periodo}
                  onChangeText={setPeriodo}
                  placeholder="YYYY-MM"
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {imposto ? "Salvar" : "Cadastrar"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  closeButton: {
    padding: 4,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  selectorText: {
    fontSize: 14,
    color: "#1F2937",
    flex: 1,
  },
  placeholderText: {
    fontSize: 14,
    color: "#9CA3AF",
    flex: 1,
  },
  tiposContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tipoButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
  },
  tipoButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  tipoText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  tipoTextActive: {
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#2563EB",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  fullScreenSelector: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  headerTitleContainer: {
    flex: 1,
  },
  fullScreenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  fullScreenSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  refreshButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
  },
  fullScreenListContainer: {
    flex: 1,
  },
  fullScreenLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loaderText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 12,
  },
  fullScreenList: {
    flex: 1,
  },
  fullScreenListContent: {
    padding: 20,
    paddingBottom: 40,
  },
  fullScreenItem: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fullScreenItemActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F7FF',
    borderWidth: 2,
  },
  fullScreenPriceTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemTitleActive: {
    color: '#1D4ED8',
  },
  itemDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16A34A',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 15,
  },
});
