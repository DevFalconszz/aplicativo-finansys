# 🚀 Instruções para Rodar o App Após Correção

## Problema Corrigido
O erro "Unable to resolve '@/screens/..." foi causado pelo uso do alias `@/` que não era compatível com o Metro bundler do Expo.

**Solução:** Todos os imports foram convertidos para caminhos relativos.

## Passos para Rodar

### 1. Instalar/Reinstalar Dependências

```bash
cd Finansys-Mobile

# Limpar node_modules anterior (se existir)
rm -rf node_modules

# Instalar todas as dependências
npm install
# ou
bun install
```

### 2. Limpar Cache do Expo

```bash
# Iniciar com cache limpo
npx expo start -c
```

### 3. Rodar no Dispositivo

Após iniciar o Expo:

- **Expo Go (Android/iOS):** Escaneie o QR code
- **Emulador Android:** Pressione `a`
- **Simulador iOS:** Pressione `i` (requer macOS)

## Comandos Úteis

```bash
# Iniciar normalmente
npm start

# Iniciar com cache limpo
npm start -- -c

# Rodar no Android
npm run android

# Rodar no iOS
npm run ios

# Rodar na web
npm run web
```

## Estrutura de Imports Atual

Todos os imports agora usam caminhos relativos:

```typescript
// ✅ Correto
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { supabase } from '../../integrations/supabase/client';

// ❌ Antigo (não funciona mais)
import { useAuth } from '@/hooks/useAuth';
```

## Possíveis Erros e Soluções

### "Cannot find module '@expo/metro-config'"

```bash
npm install -D @expo/metro-config
```

### "Unable to resolve module"

```bash
# Limpar cache
npx expo start -c

# Ou limpar completamente
rm -rf node_modules .expo
npm install
npx expo start -c
```

### "Metro bundler error"

```bash
# Reiniciar o Metro
# No terminal, pressione Ctrl+C e depois:
npx expo start
```

## Verificação de Imports

Se aparecer algum erro de módulo não resolvido, verifique se não restou nenhum import com `@/`:

```bash
# Buscar imports problemáticos
grep -r "from '@/" src/ app/
```

Se encontrar algum, substitua pelo caminho relativo correspondente.

## Assets

Lembre-se de converter os SVGs para PNG ou usar placeholders:

```bash
# Opção 1: Usar script (requer sharp)
npm install sharp
node scripts/generate-assets.js

# Opção 2: Converter manualmente
# Use os arquivos em assets/ como base
```

## Pronto!

Após seguir estes passos, o app deve rodar sem erros de resolução de módulos.

---

**Próximo:** Veja o `QUICKSTART.md` para mais detalhes.
