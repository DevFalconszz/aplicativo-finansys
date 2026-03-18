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
import { X } from "lucide-react-native";
import { supabase } from "../../integrations/supabase/client";
import { useAuth } from "../../hooks/useAuth";

interface DividaDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  divida?: {
    id_divida: number;
    descricao: string;
    valor_total: number;
    data_vencimento: string;
    status: string;
  } | null;
}

export function DividaDialog({ visible, onClose, onSuccess, divida }: DividaDialogProps) {
  const [descricao, setDescricao] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [status, setStatus] = useState("pendente");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (divida) {
      setDescricao(divida.descricao || "");
      setValorTotal(divida.valor_total?.toString() || "");
      setDataVencimento(divida.data_vencimento || "");
      setStatus(divida.status || "pendente");
    } else {
      setDescricao("");
      setValorTotal("");
      // Default to today's date in YYYY-MM-DD format
      setDataVencimento(new Date().toISOString().split('T')[0]);
      setStatus("pendente");
    }
  }, [divida, visible]);

  const handleSubmit = async () => {
    const descricaoLimpa = descricao.trim();

    if (!descricaoLimpa || !valorTotal || !dataVencimento) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios corretamente.");
      return;
    }

    setLoading(true);

    try {
      const dividaData = {
        descricao: descricaoLimpa,
        valor_total: parseFloat(valorTotal.replace(',', '.')),
        data_vencimento: dataVencimento,
        status,
        id_usuario: 1, // Mantendo o padrão do projeto web
      };

      if (divida) {
        const { error } = await supabase
          .from('divida')
          .update(dividaData)
          .eq('id_divida', divida.id_divida);

        if (error) throw error;
        Alert.alert("Sucesso", "Dívida atualizada com sucesso");
      } else {
        const { error } = await supabase
          .from('divida')
          .insert([dividaData]);

        if (error) throw error;
        Alert.alert("Sucesso", "Dívida cadastrada com sucesso");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar dívida:", error);
      Alert.alert("Erro", "Não foi possível salvar a dívida");
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.title}>{divida ? "Editar Dívida" : "Nova Dívida"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Ex: Empréstimo bancário, Fatura cartão, etc."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Valor Total *</Text>
              <TextInput
                style={styles.input}
                value={valorTotal}
                onChangeText={setValorTotal}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Data de Vencimento (AAAA-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                value={dataVencimento}
                onChangeText={setDataVencimento}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    status === "pendente" && styles.statusButtonActive,
                  ]}
                  onPress={() => setStatus("pendente")}
                >
                  <Text
                    style={[
                      styles.statusText,
                      status === "pendente" && styles.statusTextActive,
                    ]}
                  >
                    Pendente
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    status === "paga" && styles.statusButtonActive,
                  ]}
                  onPress={() => setStatus("paga")}
                >
                  <Text
                    style={[
                      styles.statusText,
                      status === "paga" && styles.statusTextActive,
                    ]}
                  >
                    Paga
                  </Text>
                </TouchableOpacity>
              </View>
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
                  {divida ? "Atualizar" : "Cadastrar"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  statusContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },
  statusButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  statusTextActive: {
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
});
