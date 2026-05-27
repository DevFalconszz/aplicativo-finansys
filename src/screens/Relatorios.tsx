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
  Platform,
  Linking
} from 'react-native';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Plus, 
  Download, 
  Eye, 
  FileText, 
  PieChart, 
  Calendar,
  ChevronRight,
  Filter,
  DollarSign,
  CreditCard
} from 'lucide-react-native';
import { supabase } from '../integrations/supabase/client';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

const { width } = Dimensions.get('window');

interface Relatorio {
  id_relatorio: number;
  tipo: string;
  periodo: string;
  formato: string;
  id_usuario: number;
  created_at?: string;
}

interface RelatorioData {
  totalReceitas: number;
  totalDespesas: number;
  totalDividas: number;
  saldo: number;
  transacoesPorCategoria: { [key: string]: number };
  transacoesPorTipo: { [key: string]: number };
  evolucaoMensal: { mes: string; receitas: number; despesas: number; dividas: number }[];
}

const PERIODOS = [
  { label: 'Mês', value: 'mes_atual' },
  { label: 'Trimestre', value: 'trimestre' },
  { label: 'Ano', value: 'ano_atual' },
  { label: 'Todos', value: 'todos' }
];

export default function Relatorios() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [relatorioData, setRelatorioData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPeriodo, setSelectedPeriodo] = useState('mes_atual');
  const [downloading, setDownloading] = useState<number | null>(null);
  const [newRelatorio, setNewRelatorio] = useState({
    tipo: 'financeiro',
    periodo: 'mes_atual',
    formato: 'pdf'
  });
  
  const { user } = useAuth();

  useEffect(() => {
    loadAll();
  }, [selectedPeriodo]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchRelatorios(),
      generateRelatorioData()
    ]);
    setLoading(false);
  };

  const fetchRelatorios = async () => {
    try {
      const { data, error } = await supabase
        .from('relatorio')
        .select('*')
        .order('id_relatorio', { ascending: false });

      if (error) throw error;
      setRelatorios(data || []);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    }
  };

  const generateRelatorioData = async () => {
    try {
      const { data: lancamentos } = await supabase
        .from('lancamento')
        .select('*');

      const { data: movimentacoes } = await supabase
        .from('movimentacao_caixa')
        .select('*');

      if (lancamentos && movimentacoes) {
        let filteredLancamentos = lancamentos;
        let filteredMovimentacoes = movimentacoes;
        const hoje = new Date();
        
        if (selectedPeriodo === "mes_atual") {
          filteredLancamentos = lancamentos.filter(l => {
            const data = new Date(l.data);
            return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
          });
          filteredMovimentacoes = movimentacoes.filter(m => {
            const data = new Date(m.data);
            return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
          });
        } else if (selectedPeriodo === "trimestre") {
          const tresMesesAtras = new Date();
          tresMesesAtras.setMonth(hoje.getMonth() - 3);
          filteredLancamentos = lancamentos.filter(l => new Date(l.data) >= tresMesesAtras);
          filteredMovimentacoes = movimentacoes.filter(m => new Date(m.data) >= tresMesesAtras);
        } else if (selectedPeriodo === "ano_atual") {
          filteredLancamentos = lancamentos.filter(l => {
            const data = new Date(l.data);
            return data.getFullYear() === hoje.getFullYear();
          });
          filteredMovimentacoes = movimentacoes.filter(m => {
            const data = new Date(m.data);
            return data.getFullYear() === hoje.getFullYear();
          });
        }

        const receitas = filteredMovimentacoes
          .filter(m => m.tipo === 'receita')
          .reduce((sum, m) => sum + Number(m.valor), 0);
        
        const despesasCaixa = filteredMovimentacoes
          .filter(m => m.tipo === 'despesa')
          .reduce((sum, m) => sum + Number(m.valor), 0);

        const dividas = filteredLancamentos
          .reduce((sum, l) => sum + Number(l.valor), 0);

        const totalDespesas = despesasCaixa + dividas;

        const categorias = filteredMovimentacoes.reduce((acc, m) => {
          const categoria = m.categoria || 'Outros';
          acc[categoria] = (acc[categoria] || 0) + Number(m.valor);
          return acc;
        }, {} as { [key: string]: number });

        const tipos = filteredLancamentos.reduce((acc, l) => {
          const tipo = l.tipo || 'Outros';
          acc[tipo] = (acc[tipo] || 0) + Number(l.valor);
          return acc;
        }, {} as { [key: string]: number });

        const evolucao = [];
        for (let i = 4; i >= 0; i--) {
          const mes = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
          const mesMovimentacoes = movimentacoes.filter(m => {
            const data = new Date(m.data);
            return data.getMonth() === mes.getMonth() && data.getFullYear() === mes.getFullYear();
          });
          const mesLancamentos = lancamentos.filter(l => {
            const data = new Date(l.data);
            return data.getMonth() === mes.getMonth() && data.getFullYear() === mes.getFullYear();
          });
          
          evolucao.push({
            mes: mes.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
            receitas: mesMovimentacoes.filter(m => m.tipo === 'receita').reduce((sum, m) => sum + Number(m.valor), 0),
            despesas: mesMovimentacoes.filter(m => m.tipo === 'despesa').reduce((sum, m) => sum + Number(m.valor), 0),
            dividas: mesLancamentos.reduce((sum, l) => sum + Number(l.valor), 0)
          });
        }

        setRelatorioData({
          totalReceitas: receitas,
          totalDespesas: despesasCaixa,
          totalDividas: dividas,
          saldo: receitas - totalDespesas,
          transacoesPorCategoria: categorias,
          transacoesPorTipo: tipos,
          evolucaoMensal: evolucao
        });
      }
    } catch (error) {
      console.error('Erro ao gerar dados do relatório:', error);
    }
  };

  const handleCreateRelatorio = async () => {
    try {
      if (!user) {
        Alert.alert("Erro", "Usuário não autenticado");
        return;
      }

      const { data: userData } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('auth_id', user.id)
        .single();

      if (!userData) {
        Alert.alert("Erro", "Usuário não encontrado");
        return;
      }

      const { error } = await supabase
        .from('relatorio')
        .insert([{
          tipo: newRelatorio.tipo,
          periodo: newRelatorio.periodo,
          formato: newRelatorio.formato,
          id_usuario: userData.id_usuario
        }]);

      if (error) throw error;

      Alert.alert("Sucesso", "Relatório gerado com sucesso");
      setIsCreateModalOpen(false);
      fetchRelatorios();
    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      Alert.alert("Erro", "Não foi possível gerar o relatório");
    }
  };

  const generateCSVContent = (data: RelatorioData, tipo: string, periodo: string): string => {
    let csv = 'Relatório Finansys\n';
    csv += `Tipo: ${tipo}\n`;
    csv += `Período: ${periodo}\n`;
    csv += `Gerado em: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    
    csv += 'RESUMO FINANCEIRO\n';
    csv += 'Descrição;Valor\n';
    csv += `Total Receitas;${data.totalReceitas.toFixed(2)}\n`;
    csv += `Total Despesas;${data.totalDespesas.toFixed(2)}\n`;
    csv += `Total Dívidas;${data.totalDividas.toFixed(2)}\n`;
    csv += `Saldo;${data.saldo.toFixed(2)}\n\n`;
    
    if (Object.keys(data.transacoesPorCategoria).length > 0) {
      csv += 'DISTRIBUIÇÃO POR CATEGORIA\n';
      csv += 'Categoria;Valor\n';
      Object.entries(data.transacoesPorCategoria)
        .sort(([,a], [,b]) => b - a)
        .forEach(([cat, val]) => {
          csv += `${cat};${val.toFixed(2)}\n`;
        });
      csv += '\n';
    }
    
    if (data.evolucaoMensal.length > 0) {
      csv += 'EVOLUÇÃO MENSAL\n';
      csv += 'Mês;Receitas;Despesas;Dívidas\n';
      data.evolucaoMensal.forEach(item => {
        csv += `${item.mes};${item.receitas.toFixed(2)};${item.despesas.toFixed(2)};${item.dividas.toFixed(2)}\n`;
      });
    }
    
    return csv;
  };

  const generateExcelContent = (data: RelatorioData, tipo: string, periodo: string): string => {
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body>';
    html += '<table>';
    html += `<tr><td colspan="2"><b>Relatório Finansys - ${tipo}</b></td></tr>`;
    html += `<tr><td>Período:</td><td>${periodo}</td></tr>`;
    html += `<tr><td>Gerado em:</td><td>${new Date().toLocaleDateString('pt-BR')}</td></tr>`;
    html += '<tr><td></td><td></td></tr>';
    
    html += '<tr><td colspan="2"><b>RESUMO FINANCEIRO</b></td></tr>';
    html += '<tr><td><b>Descrição</b></td><td><b>Valor</b></td></tr>';
    html += `<tr><td>Total Receitas</td><td>${data.totalReceitas.toFixed(2)}</td></tr>`;
    html += `<tr><td>Total Despesas</td><td>${data.totalDespesas.toFixed(2)}</td></tr>`;
    html += `<tr><td>Total Dívidas</td><td>${data.totalDividas.toFixed(2)}</td></tr>`;
    html += `<tr><td>Saldo</td><td>${data.saldo.toFixed(2)}</td></tr>`;
    html += '<tr><td></td><td></td></tr>';
    
    if (Object.keys(data.transacoesPorCategoria).length > 0) {
      html += '<tr><td colspan="2"><b>DISTRIBUIÇÃO POR CATEGORIA</b></td></tr>';
      html += '<tr><td><b>Categoria</b></td><td><b>Valor</b></td></tr>';
      Object.entries(data.transacoesPorCategoria)
        .sort(([,a], [,b]) => b - a)
        .forEach(([cat, val]) => {
          html += `<tr><td>${cat}</td><td>${val.toFixed(2)}</td></tr>`;
        });
      html += '<tr><td></td><td></td></tr>';
    }
    
    if (data.evolucaoMensal.length > 0) {
      html += '<tr><td colspan="2"><b>EVOLUÇÃO MENSAL</b></td></tr>';
      html += '<tr><td><b>Mês</b></td><td><b>Receitas / Despesas / Dívidas</b></td></tr>';
      data.evolucaoMensal.forEach(item => {
        html += `<tr><td>${item.mes}</td><td>R$ ${item.receitas.toFixed(2)} / R$ ${item.despesas.toFixed(2)} / R$ ${item.dividas.toFixed(2)}</td></tr>`;
      });
    }
    
    html += '</table></body></html>';
    return html;
  };

  const generatePDFContent = (data: RelatorioData, tipo: string, periodo: string): string => {
    let html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #6366F1; font-size: 24px; margin-bottom: 5px; }
            h2 { color: #374151; font-size: 18px; margin-top: 20px; border-bottom: 2px solid #6366F1; padding-bottom: 5px; }
            .info { color: #6B7280; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #E5E7EB; }
            th { background-color: #F9FAFB; font-weight: bold; }
            .receita { color: #10B981; }
            .despesa { color: #EF4444; }
            .saldo { font-size: 20px; font-weight: bold; color: #6366F1; }
            .footer { margin-top: 30px; text-align: center; color: #9CA3AF; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Relatório Finansys</h1>
          <div class="info">
            <p><b>Tipo:</b> ${tipo} | <b>Período:</b> ${periodo.replace('_', ' ')}</p>
            <p><b>Gerado em:</b> ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          
          <h2>Resumo Financeiro</h2>
          <table>
            <tr><td>Total Receitas</td><td class="receita">R$ ${data.totalReceitas.toFixed(2)}</td></tr>
            <tr><td>Total Despesas</td><td class="despesa">R$ ${data.totalDespesas.toFixed(2)}</td></tr>
            <tr><td>Total Dívidas</td><td class="despesa">R$ ${data.totalDividas.toFixed(2)}</td></tr>
            <tr><td><b>Saldo</b></td><td class="saldo">R$ ${data.saldo.toFixed(2)}</td></tr>
          </table>
    `;
    
    if (Object.keys(data.transacoesPorCategoria).length > 0) {
      html += '<h2>Distribuição por Categoria</h2><table><tr><th>Categoria</th><th>Valor</th></tr>';
      Object.entries(data.transacoesPorCategoria)
        .sort(([,a], [,b]) => b - a)
        .forEach(([cat, val]) => {
          html += `<tr><td>${cat}</td><td>R$ ${val.toFixed(2)}</td></tr>`;
        });
      html += '</table>';
    }
    
    if (data.evolucaoMensal.length > 0) {
      html += '<h2>Evolução Mensal</h2><table><tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Dívidas</th></tr>';
      data.evolucaoMensal.forEach(item => {
        html += `<tr><td>${item.mes}</td><td class="receita">R$ ${item.receitas.toFixed(2)}</td><td class="despesa">R$ ${item.despesas.toFixed(2)}</td><td>R$ ${item.dividas.toFixed(2)}</td></tr>`;
      });
      html += '</table>';
    }
    
    html += `
          <div class="footer">
            <p>Finansys - Sistema de Gestão Financeira</p>
          </div>
        </body>
      </html>
    `;
    return html;
  };

  const handleDownloadRelatorio = async (relatorio: Relatorio) => {
    try {
      if (!relatorioData) {
        Alert.alert("Erro", "Dados do relatório não disponíveis");
        return;
      }

      setDownloading(relatorio.id_relatorio);

      const tipo = relatorio.tipo;
      const periodo = relatorio.periodo;
      const formato = relatorio.formato;
      
      let content: string;
      let filename: string;
      let mimeType: string;

      if (formato === 'csv') {
        content = generateCSVContent(relatorioData, tipo, periodo);
        filename = `relatorio_${tipo}_${periodo}_${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else if (formato === 'excel') {
        content = generateExcelContent(relatorioData, tipo, periodo);
        filename = `relatorio_${tipo}_${periodo}_${Date.now()}.xls`;
        mimeType = 'application/vnd.ms-excel';
      } else {
        content = generatePDFContent(relatorioData, tipo, periodo);
        filename = `relatorio_${tipo}_${periodo}_${Date.now()}.html`;
        mimeType = 'text/html';
      }

      if (Platform.OS === 'web') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert("Sucesso", "Relatório baixado com sucesso!");
      } else {
        if (!FileSystem.documentDirectory) {
          Alert.alert("Erro", "Não foi possível acessar o diretório de documentos");
          return;
        }

        const fileUri = FileSystem.documentDirectory + filename;
        
        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        console.log('Arquivo salvo em:', fileUri);

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: mimeType,
            UTI: formato === 'excel' ? 'org.openxmlformats.spreadsheetml.sheet' : undefined,
          });
        } else {
          Alert.alert("Sucesso", `Relatório salvo no dispositivo.`);
        }
      }
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      Alert.alert("Erro", `Não foi possível baixar o relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadCurrentReport = async () => {
    try {
      if (!relatorioData) {
        Alert.alert("Erro", "Dados do relatório não disponíveis");
        return;
      }

      setDownloading(-1);

      const formato = newRelatorio.formato;
      const tipo = newRelatorio.tipo;
      const periodo = selectedPeriodo;
      
      let content: string;
      let filename: string;
      let mimeType: string;

      if (formato === 'csv') {
        content = generateCSVContent(relatorioData, tipo, periodo);
        filename = `relatorio_${tipo}_${periodo}_${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else if (formato === 'excel') {
        content = generateExcelContent(relatorioData, tipo, periodo);
        filename = `relatorio_${tipo}_${periodo}_${Date.now()}.xls`;
        mimeType = 'application/vnd.ms-excel';
      } else {
        content = generatePDFContent(relatorioData, tipo, periodo);
        filename = `relatorio_${tipo}_${periodo}_${Date.now()}.html`;
        mimeType = 'text/html';
      }

      if (Platform.OS === 'web') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert("Sucesso", "Relatório baixado com sucesso!");
      } else {
        if (!FileSystem.documentDirectory) {
          Alert.alert("Erro", "Não foi possível acessar o diretório de documentos");
          return;
        }

        const fileUri = FileSystem.documentDirectory + filename;
        
        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        console.log('Arquivo salvo em:', fileUri);

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: mimeType,
            UTI: formato === 'excel' ? 'org.openxmlformats.spreadsheetml.sheet' : undefined,
          });
        } else {
          Alert.alert("Sucesso", `Relatório salvo no dispositivo.`);
        }
      }
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      Alert.alert("Erro", `Não foi possível baixar o relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setDownloading(null);
    }
  };

  const ProgressBar = ({ value, total, color }: { value: number, total: number, color: string }) => {
    const percentage = total > 0 ? Math.min(100, (value / total) * 100) : 0;
    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    );
  };

  if (loading && !relatorioData) {
    return (
      <AppLayout title="Relatórios">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Relatórios">
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Relatórios</Text>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => {}}
          >
            <Filter size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {PERIODOS.map((p) => (
            <TouchableOpacity
              key={p.value}
              onPress={() => setSelectedPeriodo(p.value)}
              style={[
                styles.periodTab,
                selectedPeriodo === p.value && styles.periodTabActive
              ]}
            >
              <Text style={[
                styles.periodTabText,
                selectedPeriodo === p.value && styles.periodTabTextActive
              ]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Download Current Report Button */}
        {relatorioData && (
          <TouchableOpacity 
            style={styles.downloadCurrentButton}
            onPress={handleDownloadCurrentReport}
            disabled={downloading !== null}
          >
            {downloading === -1 ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Download size={20} color="#FFF" />
                <Text style={styles.downloadCurrentButtonText}>Baixar Relatório Atual</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Main Balance Card - MODERN DESIGN */}
        {relatorioData && (
          <View style={styles.balanceCard}>
            <View style={styles.balanceCircle}>
              <BarChart3 size={24} color="#FFF" />
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.balanceLabel} numberOfLines={1}>Saldo do Período</Text>
              <Text 
                style={styles.balanceValue} 
                numberOfLines={1} 
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {formatCurrency(relatorioData.saldo)}
              </Text>
            </View>
            <View style={styles.balanceBadge}>
              <TrendingUp size={12} color="#4ADE80" />
              <Text style={styles.balanceBadgeText}>Em dia</Text>
            </View>
          </View>
        )}

        {/* Stats Grid */}
        {relatorioData && (
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: '#E0F2FE' }]}>
              <View style={[styles.statIcon, { backgroundColor: '#7DD3FC' }]}>
                <TrendingUp size={20} color="#0369A1" />
              </View>
              <Text style={styles.statLabel}>Receitas</Text>
              <Text 
                style={[styles.statValue, { color: '#0369A1' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(relatorioData.totalReceitas)}
              </Text>
            </View>

            <View style={[styles.statItem, { backgroundColor: '#FEE2E2' }]}>
              <View style={[styles.statIcon, { backgroundColor: '#FCA5A5' }]}>
                <TrendingDown size={20} color="#B91C1C" />
              </View>
              <Text style={styles.statLabel}>Despesas</Text>
              <Text 
                style={[styles.statValue, { color: '#B91C1C' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(relatorioData.totalDespesas)}
              </Text>
            </View>

            <View style={[styles.statItem, { backgroundColor: '#FEF3C7' }]}>
              <View style={[styles.statIcon, { backgroundColor: '#FCD34D' }]}>
                <CreditCard size={20} color="#B45309" />
              </View>
              <Text style={styles.statLabel}>Dívidas</Text>
              <Text 
                style={[styles.statValue, { color: '#B45309' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(relatorioData.totalDividas)}
              </Text>
            </View>
          </View>
        )}

        {/* Categorias Breakdown */}
        {relatorioData && Object.keys(relatorioData.transacoesPorCategoria).length > 0 && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <PieChart size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Distribuição por Categoria</Text>
            </View>
            <CardContent>
              {Object.entries(relatorioData.transacoesPorCategoria)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([cat, val], index) => (
                  <View key={cat} style={styles.categoryItem}>
                    <View style={styles.categoryInfo}>
                      <Text style={[styles.categoryName, { flex: 1, marginRight: 8 }]} numberOfLines={1}>{cat}</Text>
                      <Text style={styles.categoryValue} numberOfLines={1}>{formatCurrency(val)}</Text>
                    </View>
                    <ProgressBar 
                      value={val} 
                      total={relatorioData.totalReceitas + relatorioData.totalDespesas} 
                      color={index % 2 === 0 ? '#6366F1' : '#EC4899'} 
                    />
                  </View>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Evolution Section */}
        {relatorioData && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Evolução Mensal</Text>
            </View>
            <CardContent>
              <View style={styles.evolutionList}>
                {relatorioData.evolucaoMensal.map((item, idx) => {
                  const maxVal = Math.max(...relatorioData.evolucaoMensal.map(e => Math.max(e.receitas, e.despesas, 1)));
                  return (
                    <View key={idx} style={styles.evolutionItem}>
                      <Text style={styles.evolutionMonth}>{item.mes}</Text>
                      <View style={styles.evolutionBars}>
                        <View style={[styles.evolutionBar, { height: Math.max(2, (item.receitas/maxVal) * 40), backgroundColor: '#10B981' }]} />
                        <View style={[styles.evolutionBar, { height: Math.max(2, (item.despesas/maxVal) * 40), backgroundColor: '#EF4444' }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Reports History */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Arquivos Gerados</Text>
            <Text style={styles.historyCount}>{relatorios.length}</Text>
          </View>
          
          {relatorios.length === 0 ? (
            <View style={styles.emptyHistory}>
              <FileText size={40} color="#E5E7EB" />
              <Text style={styles.emptyHistoryText}>Nenhum relatório gerado ainda</Text>
            </View>
          ) : (
            relatorios.slice(0, 5).map((r) => (
              <TouchableOpacity 
                key={r.id_relatorio} 
                style={styles.reportRow}
                onPress={() => handleDownloadRelatorio(r)}
              >
                <View style={styles.reportIconContainer}>
                  <FileText size={20} color="#6366F1" />
                </View>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportName}>
                    {r.tipo.toUpperCase()} - {r.periodo.replace('_', ' ')}
                  </Text>
                  <Text style={styles.reportDate}>{r.formato.toUpperCase()}</Text>
                </View>
                {downloading === r.id_relatorio ? (
                  <ActivityIndicator size="small" color="#6366F1" />
                ) : (
                  <Download size={20} color="#6366F1" />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB - Create Report */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setIsCreateModalOpen(true)}
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal
        visible={isCreateModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gerar Relatório</Text>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <Text style={styles.closeModal}>Fechar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text style={styles.label}>Tipo de Relatório</Text>
              <View style={styles.optionsGrid}>
                {['financeiro', 'fluxo_caixa', 'categorias', 'impostos', 'dividas'].map(t => (
                  <TouchableOpacity 
                    key={t}
                    style={[styles.optionItem, newRelatorio.tipo === t && styles.optionSelected]}
                    onPress={() => setNewRelatorio({...newRelatorio, tipo: t})}
                  >
                    <Text style={[styles.optionText, newRelatorio.tipo === t && styles.optionTextSelected]}>
                      {t.split('_').join(' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>Formato</Text>
              <View style={styles.optionsGrid}>
                {['pdf', 'excel', 'csv'].map(f => (
                  <TouchableOpacity 
                    key={f}
                    style={[styles.optionItem, newRelatorio.formato === f && styles.optionSelected]}
                    onPress={() => setNewRelatorio({...newRelatorio, formato: f})}
                  >
                    <Text style={[styles.optionText, newRelatorio.formato === f && styles.optionTextSelected]}>
                      {f.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.generateButton}
                onPress={handleCreateRelatorio}
              >
                <Text style={styles.generateButtonText}>Gerar Agora</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodTabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  periodTabTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  downloadCurrentButton: {
    flexDirection: 'row',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  downloadCurrentButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  balanceCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  balanceCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  balanceLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  balanceValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  balanceBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  balanceBadgeText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    width: (width - 60) / 3,
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectionCard: {
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 10,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 14,
    color: '#4B5563',
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  evolutionList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 60,
    paddingHorizontal: 10,
  },
  evolutionItem: {
    alignItems: 'center',
  },
  evolutionMonth: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  evolutionBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  evolutionBar: {
    width: 6,
    borderRadius: 3,
  },
  historySection: {
    marginTop: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  historyCount: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFF',
    borderRadius: 20,
  },
  emptyHistoryText: {
    color: '#9CA3AF',
    marginTop: 12,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  reportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reportDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
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
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeModal: {
    color: '#6366F1',
    fontWeight: '600',
  },
  modalForm: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  optionText: {
    fontSize: 14,
    color: '#4B5563',
    textTransform: 'capitalize',
  },
  optionTextSelected: {
    color: '#6366F1',
    fontWeight: '600',
  },
  generateButton: {
    marginTop: 32,
    backgroundColor: '#6366F1',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});