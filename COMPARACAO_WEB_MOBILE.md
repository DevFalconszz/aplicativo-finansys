# 📊 Comparação: Finansys Web vs Mobile

Este documento mostra a equivalência entre as telas e funcionalidades do sistema web e do aplicativo mobile.

## 🏠 Estrutura de Arquivos

### Web (Finansys/)
```
Finansys/
├── src/
│   ├── pages/          # Telas da aplicação
│   ├── components/     # Componentes React
│   ├── hooks/          # Hooks personalizados
│   ├── integrations/   # Integrações (Supabase)
│   └── lib/            # Utilitários
```

### Mobile (Finansys-Mobile/)
```
Finansys-Mobile/
├── app/                # Rotas (Expo Router)
├── src/
│   ├── screens/        # Telas da aplicação
│   ├── components/     # Componentes React Native
│   ├── hooks/          # Hooks personalizados
│   ├── integrations/   # Integrações (Supabase)
│   └── lib/            # Utilitários
```

## 📱 Telas - Equivalência

| Web (Rota) | Mobile (Tela) | Status |
|------------|---------------|--------|
| `/login` | `Login.tsx` | ✅ Completo |
| `/` (Dashboard) | `Dashboard.tsx` | ✅ Completo |
| `/lancamentos` | `Lancamentos.tsx` | ✅ Completo |
| `/caixa` | `Caixa.tsx` | ✅ Completo |
| `/dividas` | `Dividas.tsx` | ✅ Completo |
| `/nfe` | `NFe.tsx` | 📋 Layout Básico |
| `/comprovantes` | `Comprovantes.tsx` | 📋 Layout Básico |
| `/impostos` | `Impostos.tsx` | 📋 Layout Básico |
| `/relatorios` | `Relatorios.tsx` | 📋 Layout Básico |
| `/metas` | `Metas.tsx` | 📋 Layout Básico |
| `/configuracoes` | `Settings.tsx` | 📋 Layout Básico |
| `/confirmar-emails` | `ConfirmEmails.tsx` | 📋 Layout Básico |

**Legenda:**
- ✅ Completo: Funcionalidade completa igual ao web
- 📋 Layout Básico: Estrutura criada, pode precisar de implementação adicional

## 🔧 Diferenças Técnicas

### Navegação

**Web:**
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
```

**Mobile:**
```typescript
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
```

### Componentes

**Web:**
```typescript
import { Button } from '@/components/ui/button';
// HTML elements: div, span, img, etc.
```

**Mobile:**
```typescript
import { Button } from '@/components/ui/button';
// React Native: View, Text, Image, etc.
```

### Armazenamento de Sessão

**Web:**
```typescript
import { createClient } from '@supabase/supabase-js';
// localStorage (padrão do navegador)
```

**Mobile:**
```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
// AsyncStorage (necessário para mobile)
```

### Estilização

**Web:**
```typescript
// Tailwind CSS via className
<div className="flex items-center justify-center" />
```

**Mobile:**
```typescript
// StyleSheet do React Native
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

## 🎨 Componentes UI - Adaptações

### Button

| Propriedade | Web | Mobile |
|-------------|-----|--------|
| Elemento | `<button>` | `<TouchableOpacity>` |
| Estilo | Tailwind CSS | StyleSheet |
| Loading | Spinner CSS | ActivityIndicator |

### Card

| Propriedade | Web | Mobile |
|-------------|-----|--------|
| Elemento | `<div>` | `<View>` |
| Sombra | CSS box-shadow | shadowColor, shadowOffset, elevation |
| Border Radius | Tailwind | borderRadius |

### Input

| Propriedade | Web | Mobile |
|-------------|-----|--------|
| Elemento | `<input>` | `<TextInput>` |
| Placeholder | placeholder | placeholder + placeholderTextColor |
| Evento | onChange | onChangeText |

## 🔐 Autenticação

### Web
```typescript
// useAuth.tsx
import { useNavigate } from 'react-router-dom';
// Navegação via router do React
```

### Mobile
```typescript
// useAuth.tsx
import { useRouter } from 'expo-router';
// Navegação via Expo Router
```

## 📊 Funcionalidades Implementadas

### Dashboard
- ✅ Cards de estatísticas (Receitas, Despesas, Saldo, Dívidas)
- ✅ Quick Stats (Movimentações Hoje, Gastos, Alertas)
- ✅ Lista de transações recentes
- ✅ Integração com Supabase
- ✅ Loading states com Skeleton

### Caixa
- ✅ Listagem de movimentações
- ✅ Formulário de nova movimentação
- ✅ Filtro por tipo (receita/despesa)
- ✅ Categorias
- ✅ Inserção no banco de dados

### Lançamentos
- ✅ Listagem de lançamentos
- ✅ Formulário de novo lançamento
- ✅ Validação de campos
- ✅ Datas formatadas

### Dívidas
- ✅ Listagem de dívidas
- ✅ Status (Paga, Vencida, Pendente)
- ✅ Badges coloridos por status
- ✅ Valores formatados

## 🚀 Como Migrar Funcionalidades Adicionais

### 1. Identifique o componente web
Localize o arquivo em `Finansys/src/pages/`

### 2. Crie a tela mobile
Crie arquivo correspondente em `Finansys-Mobile/src/screens/`

### 3. Adapte os componentes
- `div` → `View`
- `span/p/h1-h6` → `Text`
- `img` → `Image`
- `button` → `TouchableOpacity` ou `Button`

### 4. Adapte os estilos
- Classes Tailwind → StyleSheet
- `flex flex-row` → `flexDirection: 'row'`
- `items-center` → `alignItems: 'center'`

### 5. Crie a rota
Adicione arquivo em `Finansys-Mobile/app/(app)/nome-da-tela.tsx`

### 6. Atualize o layout
Adicione a tela no menu do `AppLayout.tsx`

## 📝 Próximos Passos

### Telas para Implementação Completa

1. **NFe**
   - [ ] Listagem de notas fiscais
   - [ ] Upload de XML
   - [ ] Visualização de detalhes
   - [ ] Filtros por período

2. **Comprovantes**
   - [ ] Galeria de comprovantes
   - [ ] Upload de imagens
   - [ ] Compartilhamento
   - [ ] Categorização

3. **Relatórios**
   - [ ] Gráficos (usando react-native-chart-kit)
   - [ ] Filtros avançados
   - [ ] Exportação (PDF, Excel)
   - [ ] Comparativos periódicos

4. **Metas**
   - [ ] CRUD de metas
   - [ ] Progresso visual
   - [ ] Alertas de conquista
   - [ ] Categorias de metas

5. **Impostos**
   - [ ] Cálculo de impostos
   - [ ] Integração com APIs
   - [ ] Histórico de pagamentos
   - [ ] Alertas de vencimento

## 🎯 Melhorias Sugeridas

### Performance
- [ ] Lazy loading de imagens
- [ ] Paginação de listas longas
- [ ] Cache de dados locais
- [ ] Otimização de re-renders

### UX
- [ ] Pull-to-refresh em todas as listas
- [ ] Swipe actions em itens
- [ ] Animações de transição
- [ ] Feedback tátil (haptic)

### Funcionalidades
- [ ] Notificações push
- [ ] Modo offline
- [ ] Biometria para login
- [ ] Widgets na home

## 📞 Dúvidas

Para dúvidas sobre migração de componentes específicos, consulte:
- Documentação do React Native: https://reactnative.dev
- Documentação do Expo: https://docs.expo.dev
- Guias de migração web → mobile

---

**Finansys** - De Web para Mobile 🔄
