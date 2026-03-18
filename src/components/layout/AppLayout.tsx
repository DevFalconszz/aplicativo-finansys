import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Platform, StatusBar, BackHandler } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useUserRole } from '../../hooks/useUserRole';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  FileText,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  User,
  Target,
  Wallet,
  Calculator,
  Menu,
  X,
} from 'lucide-react-native';

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}

const navigationItems: NavigationItem[] = [
  { title: 'Dashboard', url: '/(app)', icon: LayoutDashboard },
  { title: 'Lançamentos', url: '/(app)/lancamentos', icon: TrendingDown },
  { title: 'Caixa', url: '/(app)/caixa', icon: Wallet },
  { title: 'Dívidas', url: '/(app)/dividas', icon: CreditCard },
  { title: 'NFe', url: '/(app)/nfe', icon: FileText },
  { title: 'Comprovantes', url: '/(app)/comprovantes', icon: Receipt },
  { title: 'Impostos', url: '/(app)/impostos', icon: Calculator },
  { title: 'Relatórios', url: '/(app)/relatorios', icon: BarChart3 },
  { title: 'Metas', url: '/(app)/metas', icon: Target },
];

const userItems: NavigationItem[] = [
  { title: 'Configurações', url: '/(app)/configuracoes', icon: Settings },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const { role } = useUserRole();
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Define menu permissions by role
  const menuPermissions: Record<string, string[]> = {
    admin: ['/(app)', '/(app)/lancamentos', '/(app)/caixa', '/(app)/dividas', '/(app)/nfe', '/(app)/comprovantes', '/(app)/impostos', '/(app)/relatorios', '/(app)/metas', '/(app)/configuracoes'],
    analista: ['/(app)', '/(app)/lancamentos', '/(app)/caixa', '/(app)/dividas', '/(app)/nfe', '/(app)/comprovantes', '/(app)/impostos', '/(app)/relatorios', '/(app)/metas'],
    caixa: ['/(app)', '/(app)/lancamentos', '/(app)/caixa', '/(app)/comprovantes'],
    contador: ['/(app)', '/(app)/nfe', '/(app)/impostos', '/(app)/relatorios'],
    user: ['/(app)'],
  };

  const allowedRoutes = role ? (menuPermissions[role] || menuPermissions.user) : menuPermissions.user;
  const filteredNavigationItems = navigationItems.filter(item => allowedRoutes.includes(item.url));
  const filteredUserItems = userItems.filter(item => allowedRoutes.includes(item.url));

  const handleNavigate = (url: string) => {
    router.push(url as any);
    setMenuVisible(false);
  };

  const handleSignOut = async () => {
    setMenuVisible(false);
    await signOut();
    // No Android, fecha o app. No iOS, o redirecionamento já acontece pelo RootLayoutNav.
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, height: insets.top + 60 }]}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
          <Menu size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText} numberOfLines={1}>{title || 'Finansys'}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {children}
      </ScrollView>

      {/* Sidebar Menu */}
      <Modal
        visible={menuVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.sidebar, { paddingTop: insets.top + 20 }]}>
            <View style={styles.sidebarHeader}>
              <Image
                source={require('../../../assets/icon.png')}
                style={styles.sidebarLogo}
                resizeMode="contain"
              />
              <View style={styles.sidebarTitleContainer}>
                <Text style={styles.sidebarTitle}>Finansys</Text>
                <Text style={styles.sidebarSubtitle}>Gestão Financeira</Text>
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(false)} style={styles.closeButton}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.sidebarContent}
              contentContainerStyle={styles.sidebarScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sidebarSection}>Menu Principal</Text>
              {filteredNavigationItems.map((item) => (
                <TouchableOpacity
                  key={item.title}
                  style={[
                    styles.menuItem,
                    isActive(item.url) && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigate(item.url)}
                >
                  <item.icon size={20} color={isActive(item.url) ? '#7C3AED' : '#FFFFFF'} />
                  <Text
                    style={[
                      styles.menuItemText,
                      isActive(item.url) && styles.menuItemTextActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}

              {role === 'admin' && filteredUserItems.length > 0 && (
                <>
                  <Text style={styles.sidebarSection}>Administração</Text>
                  {filteredUserItems.map((item) => (
                    <TouchableOpacity
                      key={item.title}
                      style={[
                        styles.menuItem,
                        isActive(item.url) && styles.menuItemActive,
                      ]}
                      onPress={() => handleNavigate(item.url)}
                    >
                      <item.icon size={20} color={isActive(item.url) ? '#7C3AED' : '#FFFFFF'} />
                      <Text
                        style={[
                          styles.menuItemText,
                          isActive(item.url) && styles.menuItemTextActive,
                        ]}
                      >
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  <User size={16} color="#FFFFFF" />
                </View>
                <View style={styles.userInfoText}>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user?.email}
                  </Text>
                  <Text style={styles.userRole}>{role || 'Carregando...'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                <LogOut size={20} color="#FFFFFF" />
                <Text style={styles.logoutText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: 280,
    backgroundColor: '#1a1a2e',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarLogo: {
    width: 32,
    height: 32,
  },
  sidebarTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sidebarSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  closeButton: {
    padding: 4,
  },
  sidebarContent: {
    flex: 1,
    paddingVertical: 16,
  },
  sidebarScrollContent: {
    paddingBottom: 40,
  },
  sidebarSection: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderRightWidth: 3,
    borderRightColor: '#7C3AED',
  },
  menuItemText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  menuItemTextActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoText: {
    flex: 1,
    marginLeft: 12,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  userRole: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'capitalize',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
});
