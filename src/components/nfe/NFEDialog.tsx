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

interface NFEDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  nfe?: {
    id_nfe: number | string;
    id?: string;
    numero: string;
    serie: string;
    valor: number;
    data_emissao?: string;
    data?: string;
    xml?: string;
    id_lancamento?: string | number | null;
  } | null;
}

export function NFEDialog({ visible, onClose, onSuccess, nfe }: NFEDialogProps) {
  const { user } = useAuth();
  const [numero, setNumero] = useState("");
  const [serie, setSerie] = useState("");
  const [valor, setValor] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [xml, setXml] = useState("");
  const [idLancamento, setIdLancamento] = useState<string | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLancamentos, setFetchingLancamentos] = useState(false);
  const [showLancamentoSelector, setShowLancamentoSelector] = useState(false);
  const [selectorSearchTerm, setSelectorSearchTerm] = useState("");

  const getLancamentoId = (lancamento: Lancamento) =>
    (lancamento.id_lancamento ?? lancamento.id).toString();

  const filteredLancamentos = lancamentos.filter(l => 
    l.descricao?.toLowerCase().includes(selectorSearchTerm.toLowerCase())
  );

  useEffect(() => {
    if (visible && user?.id) {
      fetchLancamentos();
      if (nfe) {
        setNumero(nfe.numero || "");
        setSerie(nfe.serie || "");
        setValor(nfe.valor?.toString() || "");
        setDataEmissao(nfe.data_emissao || nfe.data || "");
        setXml(nfe.xml || "");
        setIdLancamento(nfe.id_lancamento?.toString() || null);
      } else {
        setNumero("");
        setSerie("");
        setValor("");
        setDataEmissao(new Date().toISOString().split('T')[0]);
        setXml("");
        setIdLancamento(null);
      }
    }
  }, [nfe, visible, user?.id]);

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
    const parsedValor = valor.trim() ? Number(valor.replace(',', '.')) : null;

    if (!numero.trim() || !serie.trim()) {
      Alert.alert("Erro", "Os campos Numero e Serie sao obrigatorios.");
      return;
    }

    if (parsedValor === null || Number.isNaN(parsedValor)) {
      Alert.alert("Erro", "Informe um valor valido para a NFe.");
      return;
    }

    if (!dataEmissao.trim()) {
      Alert.alert("Erro", "Informe a data de emissao da NFe.");
      return;
    }

    if (!idLancamento) {
      Alert.alert("Erro", "Vincule a NFe a um lancamento.");
      return;
    }

    setLoading(true);

    try {
      const shouldRetryWithSimplePayload = (error: any) => {
        const message = `${error?.message ?? ''} ${error?.details ?? ''}`;
        return /schema cache|column|data_emissao|id_nfe|id_lancamento|serie|xml/i.test(message);
      };

      const nfeData = {
        numero: numero.replace(/\D/g, ""),
        serie: serie.replace(/\D/g, ""),
        valor: parsedValor,
        data_emissao: dataEmissao,
        xml,
        id_lancamento: idLancamento,
      };

      const simpleNfeData = {
        numero: nfeData.numero,
        valor: nfeData.valor,
        data_emissao: nfeData.data_emissao,
        id_lancamento: nfeData.id_lancamento,
      };

      if (nfe) {
        let { error } = await (supabase.from('nfe') as any)
          .update(nfeData)
          .eq('id_nfe', nfe.id_nfe);

        if (error && shouldRetryWithSimplePayload(error)) {
          const fallback = await (supabase.from('nfe') as any)
            .update(simpleNfeData)
            .eq('id', nfe.id ?? nfe.id_nfe);

          error = fallback.error;
        }

        if (error) throw error;
        Alert.alert("Sucesso", "NFe atualizada com sucesso");
      } else {
        let { error } = await (supabase.from('nfe') as any)
          .insert([nfeData]);

        if (error && shouldRetryWithSimplePayload(error)) {
          const fallback = await (supabase.from('nfe') as any)
            .insert([simpleNfeData]);

          error = fallback.error;
        }

        if (error) throw error;
        Alert.alert("Sucesso", "NFe cadastrada com sucesso");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Erro ao salvar NFe:", error);
      Alert.alert("Erro", `Nao foi possivel salvar a NFe: ${error.message || 'erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedLancamento = lancamentos.find(l => getLancamentoId(l) === idLancamento?.toString());

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
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity 
                  onPress={fetchLancamentos} 
                  style={styles.refreshButton}
                  disabled={fetchingLancamentos}
                >
                  <RefreshCw size={22} color={fetchingLancamentos ? "#9CA3AF" : "#2563EB"} />
                </TouchableOpacity>
              </View>
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
                    const isActive = idLancamento?.toString() === itemId;
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
                  {lancamentos.length === 0 && (
                    <View style={styles.emptyContainer}>
                      <Search size={48} color="#D1D5DB" />
                      <Text style={styles.emptyText}>Nenhum lançamento encontrado</Text>
                      <TouchableOpacity style={styles.retryButton} onPress={fetchLancamentos}>
                        <Text style={styles.retryButtonText}>Tentar novamente</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{nfe ? "Editar NFe" : "Nova NFe"}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.label}>Número *</Text>
                  <TextInput
                    style={styles.input}
                    value={numero}
                    onChangeText={setNumero}
                    placeholder="000123"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Série *</Text>
                  <TextInput
                    style={styles.input}
                    value={serie}
                    onChangeText={setSerie}
                    placeholder="001"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Valor</Text>
                <TextInput
                  style={styles.input}
                  value={valor}
                  onChangeText={setValor}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Data de Emissão (AAAA-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={dataEmissao}
                  onChangeText={setDataEmissao}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lançamento Vinculado</Text>
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
                <Text style={styles.label}>Conteúdo XML</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={xml}
                  onChangeText={setXml}
                  placeholder="Conteúdo XML da NFe..."
                  multiline
                  numberOfLines={4}
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
                    {nfe ? "Atualizar" : "Cadastrar"}
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
  row: {
    flexDirection: 'row',
    gap: 12,
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
  textArea: {
    height: 100,
    textAlignVertical: "top",
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
    fontSize: 16,
    color: "#1F2937",
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: "#9CA3AF",
    flex: 1,
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
  retryButton: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
