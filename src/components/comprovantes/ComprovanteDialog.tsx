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
import { X, Search, FileText } from "lucide-react-native";
import { supabase } from "../../integrations/supabase/client";

interface ComprovanteDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  comprovante?: {
    id_comprovante: number;
    tipo: string;
    data_pagamento: string;
    id_lancamento: number | null;
  } | null;
}

export function ComprovanteDialog({ visible, onClose, onSuccess, comprovante }: ComprovanteDialogProps) {
  const [tipo, setTipo] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [idLancamento, setIdLancamento] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (comprovante) {
        setTipo(comprovante.tipo || "");
        setDataPagamento(comprovante.data_pagamento || "");
        setIdLancamento(comprovante.id_lancamento?.toString() || "");
      } else {
        setTipo("");
        setDataPagamento(new Date().toISOString().split('T')[0]);
        setIdLancamento("");
      }
    }
  }, [comprovante, visible]);

  const handleSubmit = async () => {
    if (!tipo || !dataPagamento) {
      Alert.alert("Erro", "Tipo e Data de Pagamento são obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: userData } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('auth_id', user.id)
        .single();

      if (!userData) throw new Error("Usuário não encontrado");

      const comprovanteData = {
        tipo,
        data_pagamento: dataPagamento,
        id_lancamento: idLancamento ? parseInt(idLancamento) : null,
        id_usuario: userData.id_usuario,
      };

      if (comprovante) {
        const { error } = await supabase
          .from('comprovante')
          .update(comprovanteData)
          .eq('id_comprovante', comprovante.id_comprovante);

        if (error) throw error;
        Alert.alert("Sucesso", "Comprovante atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from('comprovante')
          .insert([comprovanteData]);

        if (error) throw error;
        Alert.alert("Sucesso", "Comprovante registrado com sucesso");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar comprovante:", error);
      Alert.alert("Erro", "Não foi possível salvar os dados do comprovante");
    } finally {
      setLoading(false);
    }
  };

  const tipos = [
    { label: "Recibo", value: "recibo" },
    { label: "Nota Fiscal", value: "nota_fiscal" },
    { label: "Boleto", value: "boleto" },
    { label: "PIX", value: "comprovante_pix" },
    { label: "Transferência", value: "transferencia" },
    { label: "Cartão", value: "cartao" },
  ];

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
            <Text style={styles.title}>{comprovante ? "Editar Dados" : "Novo Comprovante"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Comprovante *</Text>
              <View style={styles.tiposContainer}>
                {tipos.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.tipoButton,
                      tipo === t.value && styles.tipoButtonActive,
                    ]}
                    onPress={() => setTipo(t.value)}
                  >
                    <Text
                      style={[
                        styles.tipoText,
                        tipo === t.value && styles.tipoTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Data do Pagamento (AAAA-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                value={dataPagamento}
                onChangeText={setDataPagamento}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ID do Lançamento (opcional)</Text>
              <TextInput
                style={styles.input}
                value={idLancamento}
                onChangeText={setIdLancamento}
                placeholder="Ex: 123"
                keyboardType="numeric"
              />
            </View>

            {!comprovante && (
              <View style={styles.infoBox}>
                <FileText size={20} color="#2563EB" />
                <Text style={styles.infoText}>
                  Após registrar, você poderá visualizar o arquivo se ele estiver disponível no sistema.
                </Text>
              </View>
            )}
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
                  {comprovante ? "Salvar" : "Registrar"}
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
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#1E40AF",
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
