<div align="center">
  <img src="./assets/icon.png" width="128" height="128" alt="Finansys Mobile Logo" />
  <h1>Finansys Mobile</h1>
  <p><strong>Gestão Financeira Completa na Palma da Sua Mão</strong></p>

  [![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-SDK_52-000020?logo=expo&logoColor=white)](https://expo.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Lucide Icons](https://img.shields.io/badge/Icons-Lucide-FDE047?logo=lucide&logoColor=black)](https://lucide.dev/)
</div>

---

## 📱 Sobre o Projeto

O **Finansys Mobile** é a evolução mobile do ecossistema de gestão financeira **Finansys**. Desenvolvido com o que há de mais moderno no desenvolvimento híbrido (**React Native** + **Expo SDK 52**), o aplicativo foi projetado para oferecer agilidade, segurança e controle total sobre as finanças corporativas e pessoais, diretamente do smartphone.

Este projeto representa a migração integral da plataforma web para o ambiente mobile, garantindo que usuários, administradores e contadores tenham acesso às suas ferramentas críticas com uma experiência de usuário (UX) otimizada para telas touch.

## ✨ Funcionalidades em Destaque

### 📊 Dashboard Estratégico
*   **Visão 360°:** Acompanhamento instantâneo de receitas, despesas, saldo consolidado e dívidas.
*   **Alertas Inteligentes:** Notificações visuais para dívidas vencidas e metas pendentes.
*   **Timeline de Atividades:** Lista em tempo real das movimentações financeiras mais recentes.

### 💰 Gestão Financeira Robusta
*   **Fluxo de Caixa:** Registro rápido de entradas e saídas com categorização detalhada.
*   **Controle de Lançamentos:** Interface intuitiva para inserção de dados financeiros com validação rigorosa.
*   **Gestão de Dívidas:** Acompanhamento de contas a pagar com status automatizados (Pago, Pendente, Vencido).

### 📄 Módulos Especializados
*   **NFe & Tributos:** Espaço dedicado para o gerenciamento de Notas Fiscais Eletrônicas e obrigações fiscais.
*   **Comprovantes Digitais:** Visualização e organização de comprovantes de pagamento de forma segura.
*   **Relatórios & Metas:** Ferramentas de análise para planejamento estratégico e acompanhamento de objetivos financeiros.

## 🔐 Segurança e Níveis de Acesso (RBAC)

O **Finansys Mobile** utiliza um sistema avançado de Controle de Acesso Baseado em Funções (Role-Based Access Control), integrado diretamente com o **Supabase Auth**:

| Função | Permissões |
| :--- | :--- |
| **Admin** | Acesso irrestrito a todas as funcionalidades e configurações globais. |
| **Analista** | Gestão completa de operações, lançamentos e relatórios (exceto configurações). |
| **Caixa** | Operações focadas em entradas, saídas e gestão de comprovantes. |
| **Contador** | Acesso especializado a módulos fiscais, NFe, Impostos e Relatórios. |
| **User** | Acesso básico de visualização ao Dashboard principal. |

## 🛠️ Stack Tecnológica

*   **Core:** [React Native](https://reactnative.dev/) (v0.76)
*   **Framework:** [Expo](https://expo.dev/) (SDK 52)
*   **Navegação:** [Expo Router](https://expo.github.io/router) (File-based routing)
*   **Backend & Auth:** [Supabase](https://supabase.com/) (PostgreSQL + GoTrue)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
*   **Ícones:** [Lucide React Native](https://lucide.dev/)
*   **Persistência:** [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

## 🚀 Guia de Instalação

### Pré-requisitos
*   **Node.js** (v18.0.0 ou superior)
*   Gerenciador de pacotes **npm** ou **bun**
*   Aplicativo **Expo Go** instalado no dispositivo (iOS/Android)

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/DevFalconszz/aplicativo-finansys.git
    cd aplicativo-finansys
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    # ou
    bun install
    ```

3.  **Configuração de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
    EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
    ```

4.  **Inicie o Servidor de Desenvolvimento:**
    ```bash
    npx expo start
    ```

5.  **Execução:**
    Escaneie o QR Code exibido no terminal utilizando a câmera do seu celular (iOS) ou o aplicativo **Expo Go** (Android).

## 📁 Arquitetura do Projeto

O projeto segue uma estrutura organizada para facilitar a manutenção e escalabilidade:

```
Finansys-Mobile/
├── app/                 # Rotas e navegação (Expo Router)
├── assets/              # Imagens, ícones e splash screen
├── scripts/             # Scripts utilitários de automação
├── src/
│   ├── components/      # Componentes de UI reutilizáveis
│   ├── hooks/           # Hooks personalizados (Auth, UserRole)
│   ├── integrations/    # Configurações de API (Supabase Client)
│   ├── lib/             # Funções utilitárias e helpers
│   └── screens/         # Implementação das telas da aplicação
└── ...                  # Arquivos de configuração (tsconfig, babel, etc.)
```

## 🤝 Contribuição

Contribuições são fundamentais para a evolução do Finansys! 

1.  Faça um **Fork** do projeto.
2.  Crie uma **Branch** para sua Feature (`git checkout -b feature/NovaFeature`).
3.  Faça o **Commit** de suas alterações (`git commit -m 'feat: Adiciona nova funcionalidade'`).
4.  Faça o **Push** para a Branch (`git push origin feature/NovaFeature`).
5.  Abra um **Pull Request**.

---

<div align="center">
  <p>Desenvolvido com excelência técnica pela equipe <strong>Finansys</strong></p>
  <p>Copyright © 2024 Finansys Mobile - Todos os direitos reservados</p>
</div>
