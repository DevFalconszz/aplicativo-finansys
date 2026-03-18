# 🚀 Guia de Início Rápido - Finansys Mobile

## Passo 1: Instalar Dependências

```bash
cd Finansys-Mobile
npm install
```

## Passo 2: Gerar Assets (Opcional)

Os arquivos SVG estão na pasta `assets/`. Para usá-los no Expo, você precisa convertê-los para PNG:

### Opção A: Usando script (recomendado)

```bash
# Instale o sharp primeiro
npm install sharp

# Execute o script de geração
node scripts/generate-assets.js
```

### Opção B: Manual

1. Abra cada arquivo SVG na pasta `assets/`
2. Use uma ferramenta de conversão (Photoshop, GIMP, ou online)
3. Salve como PNG com o mesmo nome

### Opção C: Usar placeholders

O app funciona com placeholders. Substitua os assets depois.

## Passo 3: Iniciar o Expo

```bash
npm start
```

Ou:

```bash
npx expo start
```

## Passo 4: Rodar no Dispositivo

### Usando Expo Go (Recomendado para desenvolvimento)

1. **Instale o Expo Go** no seu celular:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Escaneie o QR Code** que aparece no terminal:
   - iOS: Use a câmera nativa
   - Android: Use o app Expo Go

### Usando Emulador/Simulador

```bash
# iOS (requer macOS e Xcode)
npm run ios

# Android (requer Android Studio)
npm run android
```

## Passo 5: Testar o App

1. **Tela de Login** será exibida
2. Use as **mesmas credenciais** do sistema web Finansys
3. Após login, você verá o **Dashboard**
4. Use o menu lateral para navegar entre as telas

## 🎯 Funcionalidades Implementadas

### ✅ Telas Completas
- Login com autenticação Supabase
- Dashboard com dados em tempo real
- Caixa com registro de movimentações
- Lançamentos com CRUD completo
- Dívidas com status (paga/vencida/pendente)

### 📋 Telas Básicas (Layout)
- NFe
- Comprovantes
- Impostos
- Relatórios
- Metas
- Configurações
- Confirmar Emails

## 🔧 Personalização

### Cores do Tema

Edite os arquivos em `src/components/ui/`:

```typescript
// Exemplo: mudar cor primária
// src/components/ui/button.tsx
default: {
  backgroundColor: '#7C3AED', // Sua cor aqui
},
```

### Ícones

O app usa `lucide-react-native`. Para adicionar mais ícones:

```bash
npm install lucide-react-native
```

```typescript
import { SeuIcone } from 'lucide-react-native';
```

## 🐛 Problemas Comuns

### "Cannot find module"

```bash
npm install
npm start -- --clear
```

### Erro de autenticação

Verifique se as credenciais do Supabase em `src/integrations/supabase/client.ts` estão corretas.

### App não carrega

```bash
# Limpe o cache
npx expo start -c
```

### Erro com React Native

```bash
# Reinstale node_modules
rm -rf node_modules
npm install
```

## 📱 Testando em Produção

### Build para Android

```bash
# Instale o EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build APK
eas build -p android --profile preview

# Build AAB (Play Store)
eas build -p android --profile production
```

### Build para iOS

```bash
# Requer conta Apple Developer
eas build -p ios --profile production
```

## 🎨 Adicionando Assets Reais

1. **Ícone do App** (1024x1024)
   - Salve em `assets/icon.png`

2. **Splash Screen** (1024x1024)
   - Salve em `assets/splash.png`

3. **Ícone Adaptativo Android** (1024x1024)
   - Salve em `assets/adaptive-icon.png`

4. **Favicon Web** (48x48)
   - Salve em `assets/favicon.png`

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique o README.md
2. Consulte a documentação do Expo: https://docs.expo.dev
3. Documentação do Supabase: https://supabase.com/docs

## ✅ Checklist Final

- [ ] Dependências instaladas
- [ ] Assets gerados (PNG)
- [ ] Expo iniciado
- [ ] App rodando no dispositivo/emulador
- [ ] Login testado
- [ ] Navegação entre telas verificada
- [ ] Dados do Dashboard carregando

---

**Finansys Mobile** - Sistema de Gestão Financeira 📱💰
