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
import { X, Search } from "lucide-react-native";
import { supabase } from "../../integrations/supabase/client";
import { formatCurrency } from "../../lib/utils";

interface Lancamento {
  id_lancamento: number;
  descricao: string;
  data: string;
  valor: number;
  tipo: string;
}

interface NFEDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  nfe?: {
    id_nfe: number;
    numero: string;
    serie: string;
    valor: number;
    data_emissao: string;
    xml: string;
    id_lancamento: number;
  } | null;
}

export function NFEDialog({ visible, onClose, onSuccess, nfe }: NFEDialogProps) {
  const [numero, setNumero] = useState("");
  const [serie, setSerie] = useState("");
  const [valor, setValor] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [xml, setXml] = useState("");
  const [idLancamento, setIdLancamento] = useState<number | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLancamentos, setFetchingLancamentos] = useState(false);
  const [showLancamentoSelector, setShowLancamentoSelector] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchLancamentos();
      if (nfe) {
        setNumero(nfe.numero || "");
        setSerie(nfe.serie || "");
        setValor(nfe.valor?.toString() || "");
        setDataEmissao(nfe.data_emissao || "");
        setXml(nfe.xml || "");
        setIdLancamento(nfe.id_lancamento || null);
      } else {
        setNumero("");
        setSerie("");
        setValor("");
        setDataEmissao(new Date().toISOString().split('T')[0]);
        setXml("");
        setIdLancamento(null);
      }
    }
  }, [nfe, visible]);

  const fetchLancamentos = async () => {
    try {
      setFetchingLancamentos(true);
      const { data, error } = await supabase
        .from('lancamento')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;
      setLancamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
    } finally {
      setFetchingLancamentos(false);
    }
  };

  const handleSubmit = async () => {
    if (!numero || !serie) {
      Alert.alert("Erro", "Os campos Número e Série são obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      const nfeData = {
        numero: numero.replace(/\D/g, ""),
        serie: serie.replace(/\D/g, ""),
        valor: parseFloat(valor.replace(',', '.')),
        data_emissao: dataEmissao,
        xml,
        id_lancamento: idLancamento,
      };

      if (nfe) {
        const { error } = await supabase
          .from('nfe')
          .update(nfeData)
          .eq('id_nfe', nfe.id_nfe);

        if (error) throw error;
        Alert.alert("Sucesso", "NFe atualizada com sucesso");
      } else {
        const { error } = await supabase
          .from('nfe')
          .insert([nfeData]);

        if (error) throw error;
        Alert.alert("Sucesso", "NFe cadastrada com sucesso");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar NFe:", error);
      Alert.alert("Erro", "Não foi possível salvar a NFe");
    } finally {
      setLoading(false);
    }
  };

  const selectedLancamento = lancamentos.find(l => l.id_lancamento === idLancamento);

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
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{nfe ? "Editar NFe" : "Nova NFe"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
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

        {/* Lancamento Selector Modal */}
        <Modal
          visible={showLancamentoSelector}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowLancamentoSelector(false)}
        >
          <View style={styles.selectorOverlay}>
            <View style={styles.selectorContent}>
              <View style={styles.selectorHeader}>
                <Text style={styles.selectorTitle}>Selecionar Lançamento</Text>
                <TouchableOpacity onPress={() => setShowLancamentoSelector(false)}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              {fetchingLancamentos ? (
                <ActivityIndicator size="large" color="#2563EB" style={{ margin: 20 }} />
              ) : (
                <ScrollView style={styles.selectorList}>
                  {lancamentos.map((l) => (
                    <TouchableOpacity
                      key={l.id_lancamento}
                      style={[
                        styles.selectorItem,
                        idLancamento === l.id_lancamento && styles.selectorItemActive
                      ]}
                      onPress={() => {
                        setIdLancamento(l.id_lancamento);
                        setShowLancamentoSelector(false);
                      }}
                    >
                      <View>
                        <Text style={styles.itemTitle}>{l.descricao}</Text>
                        <Text style={styles.itemSubtitle}>
                          {new Date(l.data).toLocaleDateString('pt-BR')} • {formatCurrency(l.valor)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {lancamentos.length === 0 && (
                    <Text style={styles.emptyText}>Nenhum lançamento encontrado</Text>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
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
  selectorOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  selectorContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxHeight: "80%",
    padding: 20,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  selectorList: {
    flex: 1,
  },
  selectorItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectorItemActive: {
    backgroundColor: '#EFF6FF',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 20,
    fontSize: 14,
  },
});
