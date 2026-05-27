<div align="center">
  <img src="./assets/icon.png" width="128" height="128" alt="Finansys Mobile Logo" />
  <h1>Finansys Mobile</h1>
  <p><strong>Gestão Financeira Completa na Palma da Sua Mão</strong></p>

  [![React Native](https://img.shields.io/badge/React_Native-0.83-61DAFB?logo=react&logoColor=black)]()
  [![Expo](https://img.shields.io/badge/Expo-SDK_55-000020?logo=expo&logoColor=white)]()
  [![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)]()
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)]()
  [![Lucide Icons](https://img.shields.io/badge/Icons-Lucide-FDE047?logo=lucide&logoColor=black)]()
  [![License](https://img.shields.io/badge/License-MIT-green)]()
</div>

---

## 📱 Sobre o Projeto

O **Finansys Mobile** é a evolução mobile do ecossistema de gestão financeira **Finansys**. Desenvolvido com o que há de mais moderno no desenvolvimento híbrido (**React Native** + **Expo**), o aplicativo foi projetado para oferecer agilidade, segurança e controle total sobre as finanças corporativas e pessoais, diretamente do smartphone.

Este projeto representa a migração integral da plataforma web para o ambiente mobile, garantindo que usuários, administradores e contadores tenham acesso às suas ferramentas críticas com uma experiência de usuário (UX) otimizada para telas touch.

---

## 🚀 Tecnologias

<div align="center">

| Categoria | Tecnologia | Versão |
|:---|:---|---:|
| **Core** | React Native | 0.83 |
| **Framework** | Expo | SDK 55 |
| **Navegação** | Expo Router | File-based |
| **Backend & Auth** | Supabase | 2.x |
| **Linguagem** | TypeScript | 5.8 |
| **Ícones** | Lucide React Native | 0.577 |

</div>

---

## ✨ Funcionalidades

<div>
  <table>
    <tr>
      <td align="center" width="50%">
        <h3>📊 Dashboard</h3>
        <p>Visão 360° das finanças com receitas, despesas, saldo consolidado e movimentações recentes em tempo real.</p>
      </td>
      <td align="center" width="50%">
        <h3>💰 Caixa</h3>
        <p>Registro rápido de entradas e saídas com categorização detalhada e histórico completo de movimentações.</p>
      </td>
    </tr>
    <tr>
      <td align="center" width="50%">
        <h3>📋 Lançamentos</h3>
        <p>Interface intuitiva para registro de gastos e receitas com validação rigorosa de dados.</p>
      </td>
      <td align="center" width="50%">
        <h3>⚠️ Dívidas</h3>
        <p>Gestão de contas a pagar com status automatizados: Pago, Pendente e Vencido com alertas inteligentes.</p>
      </td>
    </tr>
    <tr>
      <td align="center" width="50%">
        <h3>📄 NFe</h3>
        <p>Gerenciamento completo de Notas Fiscais Eletrônicas com suporte a documentos fiscais.</p>
      </td>
      <td align="center" width="50%">
        <h3>🧾 Comprovantes</h3>
        <p>Visualização e organização de comprovantes de pagamento de forma segura e centralizada.</p>
      </td>
    </tr>
    <tr>
      <td align="center" width="50%">
        <h3>🏛️ Impostos</h3>
        <p>Cálculo e gerenciamento de obrigações fiscais e tributárias.</p>
      </td>
      <td align="center" width="50%">
        <h3>📈 Relatórios</h3>
        <p>Ferramentas de análise financeira para planejamento estratégico e tomada de decisões.</p>
      </td>
    </tr>
    <tr>
      <td align="center" width="50%">
        <h3>🎯 Metas</h3>
        <p>Definição e acompanhamento de objetivos financeiros com indicadores de progresso.</p>
      </td>
      <td align="center" width="50%">
        <h3>⚙️ Configurações</h3>
        <p>Personalização do perfil e preferências do usuário com suporte a múltiplos idiomas.</p>
      </td>
    </tr>
  </table>
</div>

---

## 🔐 Níveis de Acesso (RBAC)

| Função | Emblema | Permissões |
|:---|---:|:---|
| **Admin** | 🛡️ | Acesso irrestrito a todas as funcionalidades e configurações globais |
| **Analista** | 📊 | Gestão completa de operações, lançamentos e relatórios |
| **Caixa** | 💵 | Operações focadas em entradas, saídas e comprovantes |
| **Contador** | 📒 | Acesso especializado a módulos fiscais, NFe, Impostos e Relatórios |
| **User** | 👁️ | Acesso básico de visualização ao Dashboard principal |

---

## 🛠️ Instalação

### Pré-requisitos

- **Node.js** 18+ 
- **npm** ou **bun**
- Aplicativo **Expo Go** no dispositivo móvel

### Passo a Passo

```bash
# Clone o repositório
git clone https://github.com/DevFalconszz/aplicativo-finansys.git
cd aplicativo-finansys

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npx expo start
```

**Execute no dispositivo:**
- **iOS:** Pressione `i` no terminal ou use o Expo Go
- **Android:** Pressione `a` no terminal ou use o Expo Go
- **Físico:** Escaneie o QR code com o Expo Go

---

## 📁 Estrutura do Projeto

```
Finansys-Mobile/
├── app/                       # Rotas e navegação (Expo Router)
│   ├── (app)/                # Rotas autenticadas
│   │   ├── index.tsx         # Dashboard
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
│   ├── index.tsx             # Login
│   └── _layout.tsx           # Layout principal
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.tsx
│   │   ├── ui/
│   │   │   ├── button.tsx     # Botões com variantes
│   │   │   ├── card.tsx       # Cards para conteúdo
│   │   │   ├── input.tsx      # Campos de entrada
│   │   │   ├── label.tsx      # Rótulos de formulário
│   │   │   ├── badge.tsx      # Etiquetas de status
│   │   │   ├── skeleton.tsx   # Loading placeholder
│   │   │   └── scroll-area.tsx
│   │   ├── comprovantes/
│   │   ├── dividas/
│   │   ├── impostos/
│   │   └── nfe/
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
│   │       ├── client.ts     # Configuração Supabase
│   │       └── types.ts      # Tipos das tabelas
│   └── lib/
│       └── utils.ts
├── assets/                    # Ícones e imagens
├── scripts/
│   └── generate-assets.js
├── app.json
├── eas.json
├── tsconfig.json
└── package.json
```

---

## 🧩 Componentes UI

| Componente | Descrição | Variantes |
|:---|---|:---|
| **Button** | Botões estilizados | `default`, `destructive`, `outline`, `secondary`, `ghost`, `link` |
| **Card** | Container de conteúdo | `default` |
| **Input** | Campo de texto | `default` |
| **Label** | Rótulo de formulário | `default` |
| **Badge** | Etiqueta de status | `default`, `secondary`, `destructive`, `outline` |
| **Skeleton** | Placeholder de carregamento | `default` |
| **ScrollArea** | Área rolável | `default` |

---

## 🔧 Configuração

### Variáveis de Ambiente

```env
EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

### Assets

| Arquivo | Dimensão | Descrição |
|:---|---:|:---|
| `assets/icon.png` | 1024×1024 | Ícone do aplicativo |
| `assets/splash.png` | 1024×1024 | Tela de splash |
| `assets/adaptive-icon.png` | 1024×1024 | Ícone adaptativo Android |
| `assets/favicon.png` | 48×48 | Favicon web |

---

## 📄 Licença

Este projeto é uma tradução mobile do sistema Finansys web.

---

## 🤝 Contribuição

1. Faça um **fork** do projeto
2. Crie uma **branch** (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'feat: Adiciona nova feature'`)
4. **Push** (`git push origin feature/MinhaFeature`)
5. Abra um **Pull Request**

---

<div align="center">
  <br />
  <img src="./assets/icon.png" width="64" height="64" alt="Finansys" />
  <p>
    <sub>Desenvolvido com excelência pela equipe <strong>DevFalcons</strong></sub>
    <br />
    <sub>Copyright © 2026 Finansys Mobile</sub>
  </p>
</div>
