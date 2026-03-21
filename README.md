# Finansys Mobile

Aplicativo móvel do sistema Finansys de Gestão Financeira, desenvolvido com React Native e Expo.

## 🚀 Tecnologias

- **React Native** - Framework para desenvolvimento mobile
- **Expo** - Plataforma de desenvolvimento React Native
- **Expo Router** - Navegação baseada em arquivos
- **Supabase** - Backend e autenticação
- **TypeScript** - Tipagem estática
- **Lucide React Native** - Ícones

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou bun
- Expo CLI
- Expo Go (para testar no dispositivo móvel)

## 🛠️ Instalação

1. **Instale as dependências:**

```bash
cd Finansys-Mobile
npm install
# ou
bun install
```

2. **Inicie o servidor de desenvolvimento:**

```bash
npm start
# ou
bun start
# ou
npx expo start
```

3. **Execute no dispositivo:**

- **iOS:** Pressione `i` no terminal ou use o Expo Go no simulador iOS
- **Android:** Pressione `a` no terminal ou use o Expo Go no emulador Android
- **Dispositivo físico:** Escaneie o QR code com o Expo Go

## 📁 Estrutura do Projeto

```
Finansys-Mobile/
├── app/                      # Rotas (Expo Router)
│   ├── (app)/               # Rotas autenticadas
│   │   ├── index.tsx        # Dashboard
│   │   ├── lancamentos.tsx
│   │   ├── caixa.tsx
│   │   ├── dividas.tsx
│   │   ├── nfe.tsx
│   │   ├── comprovantes.tsx
│   │   ├── impostos.tsx
│   │   ├── relatorios.tsx
│   │   ├── metas.tsx
│   │   ├── configuracoes.tsx
│   │   └── confirmar-emails.tsx
│   ├── index.tsx            # Login
│   └── _layout.tsx          # Layout principal
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── badge.tsx
│   │       ├── skeleton.tsx
│   │       └── scroll-area.tsx
│   ├── hooks/
│   │   ├── useAuth.tsx
│   │   └── useUserRole.tsx
│   ├── screens/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Lancamentos.tsx
│   │   ├── Caixa.tsx
│   │   ├── Dividas.tsx
│   │   ├── NFe.tsx
│   │   ├── Comprovantes.tsx
│   │   ├── Relatorios.tsx
│   │   ├── Metas.tsx
│   │   ├── Impostos.tsx
│   │   ├── Settings.tsx
│   │   └── ConfirmEmails.tsx
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   └── lib/
│       └── utils.ts
└── assets/                   # Imagens e ícones
```

## 🔐 Autenticação

O app utiliza autenticação via Supabase. As credenciais são as mesmas do sistema web.

### Níveis de Acesso

- **admin:** Acesso completo a todas as funcionalidades
- **analista:** Acesso à maioria das funcionalidades (exceto configurações)
- **caixa:** Acesso limitado (Dashboard, Lançamentos, Caixa, Comprovantes)
- **contador:** Acesso específico (Dashboard, NFe, Impostos, Relatórios)
- **user:** Acesso básico (apenas Dashboard)

## 📱 Funcionalidades

### Dashboard
- Visão geral das finanças
- Receitas, despesas e saldo atual
- Dívidas totais e vencidas
- Movimentações recentes

### Caixa
- Registrar novas movimentações (receitas/despesas)
- Visualizar histórico de movimentações
- Filtrar por tipo e categoria

### Lançamentos
- Registrar gastos e receitas
- Acompanhar lançamentos pendentes

### Dívidas
- Gerenciar contas a pagar
- Visualizar dívidas vencidas e pendentes

### NFe
- Gerenciar notas fiscais eletrônicas

### Comprovantes
- Visualizar comprovantes de pagamento

### Impostos
- Calcular e gerenciar impostos

### Relatórios
- Visualizar relatórios financeiros

### Metas
- Definir e acompanhar metas financeiras

## 🎨 Componentes UI

O app possui componentes UI reutilizáveis:

- **Button:** Botões com variantes (default, destructive, outline, etc.)
- **Card:** Cards para conteúdo
- **Input:** Campos de entrada de texto
- **Label:** Rótulos para formulários
- **Badge:** Etiquetas para status
- **Skeleton:** Loading placeholder

## 📝 Observações

### Assets

Os arquivos de imagem (icon.png, splash.png, adaptive-icon.png, favicon.png) são placeholders. 
Substitua-os pelos assets reais do Finansys:

- `assets/icon.png` - Ícone do app (1024x1024)
- `assets/splash.png` - Tela de splash (1024x1024)
- `assets/adaptive-icon.png` - Ícone adaptativo Android (1024x1024)
- `assets/favicon.png` - Favicon web (48x48)

### Telas Implementadas

Todas as telas do sistema web foram migradas para React Native:

- ✅ Login
- ✅ Dashboard
- ✅ Lançamentos
- ✅ Caixa
- ✅ Dívidas
- ✅ NFe
- ✅ Comprovantes
- ✅ Impostos
- ✅ Relatórios
- ✅ Metas
- ✅ Configurações
- ✅ Confirmar Emails

## 🐛 Problemas Conhecidos

1. **Assets placeholder:** Os ícones e imagens são placeholders SVG. Converta para PNG antes de usar em produção.

2. **Telas genéricas:** Algumas telas (NFe, Comprovantes, etc.) estão com layout genérico. Implemente a lógica específica conforme necessário.

## 📄 Licença

Este projeto é uma tradução mobile do sistema Finansys web.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte, entre em contato com a equipe de desenvolvimento.
