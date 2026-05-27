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
import { X, FileText, Upload, Trash2 } from "lucide-react-native";
import { supabase } from "../../integrations/supabase/client";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

interface ComprovanteDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  comprovante?: {
    id_comprovante: number;
    tipo: string;
    data_pagamento: string;
    id_lancamento: string | number | null;
    arquivo?: string;
    arquivo_url?: string;
  } | null;
}

export function ComprovanteDialog({ visible, onClose, onSuccess, comprovante }: ComprovanteDialogProps) {
  const [tipo, setTipo] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [idLancamento, setIdLancamento] = useState("");
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
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
      setSelectedFile(null);
    }
  }, [comprovante, visible]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSelectedFile(result);
      }
    } catch (err) {
      console.error("Erro ao selecionar arquivo:", err);
      Alert.alert("Erro", "Não foi possível selecionar o arquivo.");
    }
  };

  const uploadFile = async (userId: string) => {
    if (!selectedFile || selectedFile.canceled) return null;

    const asset = selectedFile.assets[0];
    const fileExt = asset.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = asset.uri;

    try {
      // Usando FileSystem normal, ignorando o warning por enquanto para garantir que a função exista
      const base64 = await FileSystem.readAsStringAsync(filePath, {
        encoding: 'base64',
      });

      const { data, error } = await supabase.storage
        .from('comprovantes')
        .upload(fileName, decode(base64), {
          contentType: asset.mimeType ?? 'application/octet-stream',
          upsert: true
        });

      if (error) {
        console.error("Erro Supabase Storage:", error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(fileName);

      return { fileName, publicUrl };
    } catch (error: any) {
      console.error("Erro detalhado no upload:", error);
      const errorMessage = error.message || error.error_description || "Erro desconhecido no Storage";
      throw new Error(`Upload: ${errorMessage}`);
    }
  };

  const handleSubmit = async () => {
    if (!tipo || !dataPagamento) {
      Alert.alert("Erro", "Tipo e Data de Pagamento são obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar o id_usuario numérico para o sistema legado
      const { data: userData } = await (supabase.from('usuario') as any)
        .select('id_usuario')
        .eq('auth_id', user.id)
        .single();

      let fileInfo = null;
      if (selectedFile) {
        try {
          fileInfo = await uploadFile(user.id);
        } catch (uploadError: any) {
          throw uploadError;
        }
      }

      // Preparar os dados para salvar
      const comprovanteData: any = {
        tipo,
        data_pagamento: dataPagamento,
      };

      // Só envia id_lancamento se houver valor, caso contrário envia null
      const trimmedId = idLancamento.trim();
      if (trimmedId) {
        // Se parece um número, tenta enviar como número, senão como string (UUID)
        comprovanteData.id_lancamento = /^\d+$/.test(trimmedId) ? parseInt(trimmedId) : trimmedId;
      } else {
        comprovanteData.id_lancamento = null;
      }

      if (userData?.id_usuario) {
        comprovanteData.id_usuario = userData.id_usuario;
      }

      if (fileInfo) {
        comprovanteData.arquivo = fileInfo.fileName;
        comprovanteData.arquivo_url = fileInfo.fileName; // Usamos o path relativo como URL interna
      }

      console.log("Enviando dados para tabela comprovante:", comprovanteData);

      if (comprovante) {
        const { error } = await (supabase.from('comprovante') as any)
          .update(comprovanteData)
          .eq('id_comprovante', comprovante.id_comprovante);

        if (error) throw error;
        Alert.alert("Sucesso", "Comprovante atualizado com sucesso");
      } else {
        const { error } = await (supabase.from('comprovante') as any)
          .insert([comprovanteData]);

        if (error) throw error;
        Alert.alert("Sucesso", "Comprovante registrado com sucesso");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Erro ao salvar comprovante:", error);
      const details = error.details || error.hint || "";
      const message = error.message || "Erro desconhecido";
      Alert.alert("Erro ao Salvar", `${message}\n${details}`);
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

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Arquivo do Comprovante</Text>
              <TouchableOpacity 
                style={[styles.filePicker, selectedFile && styles.filePickerSelected]} 
                onPress={handlePickDocument}
              >
                {selectedFile && !selectedFile.canceled ? (
                  <View style={styles.fileSelectedInfo}>
                    <FileText size={24} color="#2563EB" />
                    <Text style={styles.fileName} numberOfLines={1}>
                      {selectedFile.assets[0].name}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedFile(null)}>
                      <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.filePickerPlaceholder}>
                    <Upload size={24} color="#9CA3AF" />
                    <Text style={styles.filePickerText}>Selecionar arquivo...</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

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
                placeholder="Ex: 123 ou UUID"
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
    marginBottom: 20,
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
  filePicker: {
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  filePickerSelected: {
    borderColor: "#2563EB",
    borderStyle: "solid",
    backgroundColor: "#EFF6FF",
  },
  filePickerPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filePickerText: {
    color: "#9CA3AF",
    fontSize: 16,
  },
  fileSelectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
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
});
