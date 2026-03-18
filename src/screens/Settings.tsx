import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  TextInput,
  Dimensions,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Palette, 
  Shield, 
  Pencil, 
  Trash2, 
  Check, 
  RefreshCcw,
  X,
  Mail,
  Lock,
  User as UserIcon,
  ChevronRight
} from 'lucide-react-native';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { useUserRole } from '../hooks/useUserRole';

const { width } = Dimensions.get('window');

interface Usuario {
  id_usuario: number;
  nome: string;
  login: string;
  email: string;
  perfil: string;
  created_at: string;
  auth_id?: string;
}

const PERFIS = [
  { label: 'Administrador', description: 'Acesso total ao sistema', value: 'Administrador' },
  { label: 'Analista', description: 'Dashboard, Lançamentos, Caixa...', value: 'Analista' },
  { label: 'Caixa', description: 'Dashboard, Lançamentos, Caixa...', value: 'Caixa' },
  { label: 'Contador', description: 'Dashboard, NFes, Impostos...', value: 'Contador' }
];

export default function SettingsScreen() {
  const { user } = useAuth();
  const { role, loading: loadingRole } = useUserRole();
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'theme'>('list');
  
  // User List State
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Create User State
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    nome: "",
    login: "",
    perfil: "Analista",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit User Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [editData, setEditData] = useState({
    nome: "",
    login: "",
    perfil: "",
  });

  // Appearance State
  const [colors, setColors] = useState({
    primary: "220 90% 56%",
    secondary: "210 40% 96%",
    accent: "220 90% 56%",
    success: "142 76% 36%",
    warning: "38 92% 50%",
    destructive: "0 84% 60%",
  });

  useEffect(() => {
    loadTheme();
    if (role === 'admin') {
      fetchUsuarios();
    }
  }, [role]);

  const loadTheme = async () => {
    try {
      const savedColors = await AsyncStorage.getItem('finansys-colors');
      if (savedColors) {
        setColors(JSON.parse(savedColors));
      }
    } catch (e) {
      console.error('Error loading theme:', e);
    }
  };

  const fetchUsuarios = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSignup = async () => {
    if (!signupData.email || !signupData.password || !signupData.nome || !signupData.login) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    try {
      const roleMap: Record<string, string> = {
        'Administrador': 'admin',
        'Analista': 'analista',
        'Caixa': 'caixa',
        'Contador': 'contador',
      };

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: signupData.email,
          password: signupData.password,
          nome: signupData.nome,
          login: signupData.login,
          perfil: signupData.perfil,
          role: roleMap[signupData.perfil]
        }
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Erro ao criar usuário");
      }

      Alert.alert("Sucesso", "Usuário cadastrado com sucesso!");
      setSignupData({
        email: "",
        password: "",
        nome: "",
        login: "",
        perfil: "Analista",
      });
      setActiveTab('list');
      fetchUsuarios();
    } catch (error: any) {
      Alert.alert("Erro no cadastro", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveColors = async () => {
    try {
      await AsyncStorage.setItem('finansys-colors', JSON.stringify(colors));
      Alert.alert("Cores atualizadas", "As cores foram salvas com sucesso!");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar as cores");
    }
  };

  const handleResetColors = async () => {
    const defaultColors = {
      primary: "220 90% 56%",
      secondary: "210 40% 96%",
      accent: "220 90% 56%",
      success: "142 76% 36%",
      warning: "38 92% 50%",
      destructive: "0 84% 60%",
    };
    setColors(defaultColors);
    await AsyncStorage.removeItem('finansys-colors');
    Alert.alert("Sucesso", "Cores restauradas para o padrão!");
  };

  const openEdit = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setEditData({
      nome: usuario.nome,
      login: usuario.login,
      perfil: usuario.perfil,
    });
    setEditModalVisible(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      setIsSubmitting(true);
      const roleMap: Record<string, string> = {
        'Administrador': 'admin',
        'Analista': 'analista',
        'Caixa': 'caixa',
        'Contador': 'contador',
      };

      const { data, error } = await supabase.functions.invoke('update-user', {
        body: {
          id_usuario: selectedUser.id_usuario,
          nome: editData.nome,
          login: editData.login,
          perfil: editData.perfil,
          role: roleMap[editData.perfil]
        }
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Erro ao atualizar usuário");
      }

      Alert.alert("Sucesso", "Usuário atualizado com sucesso!");
      setEditModalVisible(false);
      fetchUsuarios();
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (usuario: Usuario) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir o usuário ${usuario.nome}? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive", 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('usuario')
                .delete()
                .eq('id_usuario', usuario.id_usuario);

              if (error) throw error;
              
              if (usuario.auth_id) {
                // Se o usuário tiver auth_id, ele deve ser deletado via Admin API ou Edge Function
                // Para este exemplo, apenas removemos da tabela pública
              }

              Alert.alert("Sucesso", "Usuário removido com sucesso.");
              fetchUsuarios();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o usuário.");
            }
          } 
        }
      ]
    );
  };

  if (loadingRole || (role === 'admin' && loadingUsers && activeTab === 'list')) {
    return (
      <AppLayout title="Configurações">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </AppLayout>
    );
  }

  if (role !== 'admin') {
    return (
      <AppLayout title="Configurações">
        <View style={styles.forbiddenContainer}>
          <Shield size={64} color="#EF4444" />
          <Text style={styles.forbiddenTitle}>Acesso Restrito</Text>
          <Text style={styles.forbiddenSubtitle}>
            Esta área é exclusiva para administradores do sistema.
          </Text>
        </View>
      </AppLayout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Usuários Ativos</Text>
            {usuarios.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>Nenhum usuário cadastrado</Text>
              </View>
            ) : (
              usuarios.map((item) => (
                <Card key={item.id_usuario} style={styles.userCard}>
                  <CardContent style={styles.userCardContent}>
                    <View style={styles.userInfo}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.avatarText}>{item.nome.substring(0, 1).toUpperCase()}</Text>
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{item.nome}</Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                        <View style={styles.roleContainer}>
                          <Badge variant="outline" style={styles.roleBadge}>
                            <Text style={styles.roleText}>{item.perfil}</Text>
                          </Badge>
                        </View>
                      </View>
                    </View>
                    <View style={styles.userActions}>
                      <TouchableOpacity 
                        style={styles.actionButton} 
                        onPress={() => openEdit(item)}
                      >
                        <Pencil size={20} color="#6366F1" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton} 
                        onPress={() => handleDeleteUser(item)}
                      >
                        <Trash2 size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        );
      case 'create':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Novo Usuário</Text>
            <Card style={styles.formCard}>
              <CardContent style={styles.formContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nome Completo</Text>
                  <View style={styles.inputWrapper}>
                    <UserIcon size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Nome do usuário"
                      value={signupData.nome}
                      onChangeText={(t) => setSignupData(p => ({ ...p, nome: t }))}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Login</Text>
                  <View style={styles.inputWrapper}>
                    <Shield size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="login_usuario"
                      value={signupData.login}
                      onChangeText={(t) => setSignupData(p => ({ ...p, login: t }))}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="usuario@email.com"
                      value={signupData.email}
                      onChangeText={(t) => setSignupData(p => ({ ...p, email: t }))}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Senha</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Mínimo 6 caracteres"
                      value={signupData.password}
                      onChangeText={(t) => setSignupData(p => ({ ...p, password: t }))}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Perfil / Acesso</Text>
                  <View style={styles.perfilGrid}>
                    {PERFIS.map((p) => (
                      <TouchableOpacity
                        key={p.value}
                        style={[
                          styles.perfilOption,
                          signupData.perfil === p.value && styles.perfilOptionActive
                        ]}
                        onPress={() => setSignupData(prev => ({ ...prev, perfil: p.value }))}
                      >
                        <Text style={[
                          styles.perfilLabel,
                          signupData.perfil === p.value && styles.perfilLabelActive
                        ]}>
                          {p.label}
                        </Text>
                        <Text style={styles.perfilDesc} numberOfLines={1}>
                          {p.description}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Button 
                  style={styles.submitButton}
                  onPress={handleSignup}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? "Cadastrando..." : "Cadastrar Usuário"}
                  </Text>
                </Button>
              </CardContent>
            </Card>
          </View>
        );
      case 'theme':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Personalização</Text>
            <Card style={styles.formCard}>
              <CardContent style={styles.formContent}>
                <View style={styles.colorGrid}>
                  {Object.entries(colors).map(([key, value]) => (
                    <View key={key} style={styles.colorItem}>
                      <Text style={styles.colorLabel}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Text>
                      <TextInput
                        style={styles.colorInput}
                        value={value}
                        onChangeText={(t) => setColors(p => ({ ...p, [key]: t }))}
                      />
                      <View style={[styles.colorPreview, { backgroundColor: `hsl(${value})` }]} />
                    </View>
                  ))}
                </View>

                <View style={styles.themeActions}>
                  <Button style={styles.saveThemeButton} onPress={handleSaveColors}>
                    <Check size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Salvar Cores</Text>
                  </Button>
                  <TouchableOpacity style={styles.resetButton} onPress={handleResetColors}>
                    <RefreshCcw size={20} color="#6B7280" style={{ marginRight: 8 }} />
                    <Text style={styles.resetButtonText}>Restaurar</Text>
                  </TouchableOpacity>
                </View>
              </CardContent>
            </Card>
          </View>
        );
    }
  };

  return (
    <AppLayout title="Configurações">
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'list' && styles.activeTab]} 
            onPress={() => setActiveTab('list')}
          >
            <Users size={20} color={activeTab === 'list' ? '#6366F1' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>Usuários</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'create' && styles.activeTab]} 
            onPress={() => setActiveTab('create')}
          >
            <UserPlus size={20} color={activeTab === 'create' ? '#6366F1' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>Novo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'theme' && styles.activeTab]} 
            onPress={() => setActiveTab('theme')}
          >
            <Palette size={20} color={activeTab === 'theme' ? '#6366F1' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'theme' && styles.activeTabText]}>Tema</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {renderTabContent()}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Edit User Modal */}
        <Modal
          visible={editModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Usuário</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <X size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>

              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nome Completo</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editData.nome}
                    onChangeText={(t) => setEditData(p => ({ ...p, nome: t }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Login</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editData.login}
                    onChangeText={(t) => setEditData(p => ({ ...p, login: t }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Perfil</Text>
                  <View style={styles.perfilGrid}>
                    {PERFIS.map((p) => (
                      <TouchableOpacity
                        key={p.value}
                        style={[
                          styles.perfilOption,
                          editData.perfil === p.value && styles.perfilOptionActive,
                          { minWidth: '100%' }
                        ]}
                        onPress={() => setEditData(prev => ({ ...prev, perfil: p.value }))}
                      >
                        <Text style={[
                          styles.perfilLabel,
                          editData.perfil === p.value && styles.perfilLabelActive
                        ]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Button 
                  style={styles.updateButton}
                  onPress={handleUpdateUser}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? "Atualizando..." : "Salvar Alterações"}
                  </Text>
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forbiddenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  forbiddenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
  },
  forbiddenSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#6366F1',
  },
  tabContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  userCard: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 0,
    elevation: 2,
    shadowOpacity: 0.05,
  },
  userCardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  roleContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: '#F3F4F6',
    borderColor: 'transparent',
    paddingVertical: 0,
  },
  roleText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 0,
    elevation: 3,
    shadowOpacity: 0.1,
  },
  formContent: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  perfilGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  perfilOption: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  perfilOptionActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  perfilLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  perfilLabelActive: {
    color: '#6366F1',
  },
  perfilDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#6366F1',
    height: 56,
    borderRadius: 16,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  colorGrid: {
    gap: 16,
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  colorInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  themeActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  saveThemeButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#6366F1',
    height: 50,
    borderRadius: 12,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  resetButtonText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '90%',
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
  editForm: {
    gap: 20,
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  updateButton: {
    backgroundColor: '#6366F1',
    height: 56,
    borderRadius: 16,
  },
});
