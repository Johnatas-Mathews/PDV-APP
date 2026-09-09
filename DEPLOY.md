# 🚀 Guia de Deploy - PDV Sistema

Siga este guia passo a passo para colocar seu PDV online em 10 minutos.

---

## 📋 PASSO 1: Preparar Máquina Local

### Instalar Node.js
1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS** (recomendado)
3. Instale normalmente
4. Verifique: Abra terminal/cmd e digite:
   ```bash
   node --version
   npm --version
   ```

### Instalar Git
1. Acesse: https://git-scm.com/
2. Baixe e instale
3. Verifique: Abra terminal/cmd e digite:
   ```bash
   git --version
   ```

---

## 📁 PASSO 2: Baixar Projeto

### Opção A: Se você recebeu uma pasta `pdv-app`

1. Abra terminal/cmd
2. Navegue até a pasta:
   ```bash
   cd caminho/para/pdv-app
   ```
3. Instale dependências:
   ```bash
   npm install
   ```
4. Execute localmente:
   ```bash
   npm run dev
   ```
5. Abra no navegador: `http://localhost:3000`

### Opção B: Se vai usar Git

```bash
git clone https://github.com/seu-usuario/pdv-app.git
cd pdv-app
npm install
npm run dev
```

---

## 🌐 PASSO 3: Enviar para GitHub

### 3.1 Criar Conta GitHub (se não tiver)
1. Acesse: https://github.com
2. Clique em **"Sign up"**
3. Preencha email, senha, usuário
4. Confirme email

### 3.2 Criar Repositório
1. Acesse: https://github.com/new
2. Nome: `pdv-app`
3. Descrição: "Sistema PDV - Gestão de Vendas"
4. Deixe **Public** (para Vercel funcionar)
5. **Não** marque "Initialize with README"
6. Clique em **"Create repository"**

### 3.3 Enviar Código

Abra terminal/cmd na pasta `pdv-app` e execute:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

git init
git add .
git commit -m "PDV Sistema - Versão Inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/pdv-app.git
git push -u origin main
```

**Substitua `SEU_USUARIO` pelo seu usuário GitHub**

---

## 🚀 PASSO 4: Deploy no Vercel

### 4.1 Criar Conta Vercel
1. Acesse: https://vercel.com
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"**
4. Autorize o Vercel a acessar seus repositórios

### 4.2 Fazer Deploy
1. Na página inicial do Vercel, clique em **"Add New..."** → **"Project"**
2. Procure por **`pdv-app`** na lista
3. Clique em **"Import"**
4. Deixe as configurações padrão e clique **"Deploy"**
5. **Aguarde** a build terminar (vai aparecer "Congratulations!")

### 4.3 Acessar Seu PDV Online
Após o deploy terminar:
- Você verá uma URL: `https://seu-usuario-pdv-app.vercel.app`
- Clique ou copie a URL
- Seu PDV estará online! 🎉

---

## 💻 Acessar de PC e Celular

### Localmente (Mesma Rede)
- PC: `http://localhost:3000`
- Celular: `http://SEU_IP_LOCAL:3000`
  - Para descobrir IP: `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)

### Online (De Qualquer Lugar)
- PC e Celular: `https://seu-usuario-pdv-app.vercel.app`

---

## 📝 Fazer Alterações

Após colocar online, se quiser mudar algo:

1. Faça a alteração no código local
2. Commit e push para GitHub:
   ```bash
   git add .
   git commit -m "Descrição da mudança"
   git push
   ```
3. **Vercel fará deploy automático** (em ~1 minuto)

---

## 🔒 Segurança & Dados

⚠️ **IMPORTANTE:**
- Os dados são salvos no **localStorage** do navegador
- Cada dispositivo tem seus dados locais
- Para compartilhar dados entre dispositivos, você precisará de um banco de dados (próxima versão)
- Faça **backup regularmente** dos dados (veja README.md)

---

## ❌ Problemas Comuns

### "npm não é reconhecido"
- Reinicie o computador após instalar Node.js
- Ou adicione manualmente ao PATH do Windows

### "erro ao fazer push para GitHub"
- Verifique nome de usuário e repositório
- Use token ao invés de senha (gere em GitHub Settings → Developer settings)

### "Deploy falhou no Vercel"
- Verifique se o repositório é Public
- Veja os logs de erro no Vercel
- Tente fazer um novo commit

### "Dados não sincronizam entre dispositivos"
- Isso é normal com localStorage
- Próxima versão terá sincronização na nuvem

---

## ✅ Checklist Final

- [ ] Node.js e Git instalados
- [ ] Projeto rodando localmente (`npm run dev`)
- [ ] Repositório criado no GitHub
- [ ] Código enviado para GitHub (`git push`)
- [ ] Conta Vercel criada
- [ ] Projeto importado no Vercel
- [ ] Deploy realizado com sucesso
- [ ] URL online acessível
- [ ] Testar em celular

---

## 🎯 Próximas Etapas

Depois de online, você pode:

1. **Customizar o sistema:**
   - Adicionar logo da empresa
   - Mudar cores do tema
   - Adicionar novas funcionalidades

2. **Evoluir o projeto:**
   - Integrar banco de dados (Firebase, Supabase)
   - Sincronizar dados entre dispositivos
   - Adicionar autenticação
   - Exportar relatórios em PDF

3. **Usar profissionalmente:**
   - Criar múltiplos usuários
   - Integrar pagamentos (PIX, cartão)
   - Backup automático de dados

---

## 📞 Suporte

Se tiver dúvidas:
1. Leia o README.md
2. Verifique logs no Vercel
3. Procure em Google: "Vercel + React deploy"

**Parabéns! Seu PDV está online! 🎉**
