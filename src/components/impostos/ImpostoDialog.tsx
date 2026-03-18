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
import { X, Search, Calculator } from "lucide-react-native";
import { supabase } from "../../integrations/supabase/client";
import { formatCurrency } from "../../lib/utils";

interface Lancamento {
  id_lancamento: number;
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
    id_lancamento: number;
  } | null;
}

export function ImpostoDialog({ visible, onClose, onSuccess, imposto }: ImpostoDialogProps) {
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [idLancamento, setIdLancamento] = useState<number | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLancamentos, setFetchingLancamentos] = useState(false);
  const [showLancamentoSelector, setShowLancamentoSelector] = useState(false);

  const tiposImposto = ["ICMS", "IPI", "PIS", "COFINS", "ISS", "IRPJ", "CSLL", "Outro"];

  useEffect(() => {
    if (visible) {
      fetchLancamentos();
      if (imposto) {
        setTipo(imposto.tipo || "");
        setValor(imposto.valor?.toString() || "");
        setPeriodo(imposto.periodo || "");
        setIdLancamento(imposto.id_lancamento || null);
      } else {
        setTipo("");
        setValor("");
        // Default to current month/year YYYY-MM
        const now = new Date();
        setPeriodo(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        setIdLancamento(null);
      }
    }
  }, [imposto, visible]);

  const fetchLancamentos = async () => {
    try {
      setFetchingLancamentos(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from("usuario")
        .select("id_usuario")
        .eq("auth_id", user.id)
        .single();

      if (!usuario) return;

      const { data, error } = await supabase
        .from("lancamento")
        .select("*")
        .eq("id_usuario", usuario.id_usuario)
        .order("data", { ascending: false });

      if (error) throw error;
      setLancamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
    } finally {
      setFetchingLancamentos(false);
    }
  };

  const handleSubmit = async () => {
    const periodoLimpo = periodo.trim();
    if (!tipo || !valor || !periodoLimpo || !idLancamento) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios.");
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
        const { error } = await supabase
          .from("imposto")
          .update(impostoData)
          .eq("id_imposto", imposto.id_imposto);

        if (error) throw error;
        Alert.alert("Sucesso", "Imposto atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("imposto")
          .insert([impostoData]);

        if (error) throw error;
        Alert.alert("Sucesso", "Imposto cadastrado com sucesso");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar imposto:", error);
      Alert.alert("Erro", "Não foi possível salvar o imposto");
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
            <Text style={styles.title}>{imposto ? "Editar Imposto" : "Novo Imposto"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
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
