# PDV Sistema - Gestão de Vendas Profissional

Um sistema PDV (Ponto de Venda) completo e gratuito, desenvolvido com React, para gerenciar vendas, clientes, produtos, contas a receber e relatórios.

## ✨ Recursos

- 📊 **Dashboard** - Visão geral do negócio em tempo real
- 💰 **Gestão de Vendas** - Registre vendas com múltiplos produtos
- 👥 **Cadastro de Clientes** - Gerencie clientes e contatos
- 📦 **Cadastro de Produtos** - Controle de produtos e preços
- 📋 **Contas a Receber** - Acompanhe vendas a prazo
- 📈 **Relatórios** - Análise de vendas, produtos e clientes
- 📱 **Responsivo** - Funciona em PC, tablet e celular
- 💾 **Dados Locais** - Salva automaticamente no navegador

## 🚀 Como Começar Rápido

### Pré-requisitos
- Node.js 16+ (https://nodejs.org/)
- Git (https://git-scm.com/)

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/pdv-app.git
cd pdv-app
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Executar Localmente

```bash
npm run dev
```

O app abrirá em `http://localhost:3000`

### 4. Acessar em PC e Celular na Mesma Rede

Para acessar de outro dispositivo na mesma rede:

1. Descubra seu IP local: `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)
2. Acesse: `http://SEU_IP:3000` no navegador do outro dispositivo

---

## 📦 Fazer Deploy Online (Vercel)

### Opção 1: Conectar GitHub + Vercel (Recomendado - Automático)

#### Passo 1: Criar Repositório no GitHub
1. Acesse https://github.com/new
2. Crie um repositório chamado `pdv-app`
3. Não inicialize com README (deixe em branco)

#### Passo 2: Enviar Código para GitHub

```bash
git init
git add .
git commit -m "PDV Sistema - Versão Inicial"
git branch -M main
git remote add origin https://github.com/seu-usuario/pdv-app.git
git push -u origin main
```

#### Passo 3: Fazer Deploy no Vercel

1. Acesse https://vercel.com
2. Clique em "Continue with GitHub"
3. Autorize o Vercel a acessar seus repositórios
4. Procure por `pdv-app` e clique em "Import"
5. Clique em "Deploy"

Pronto! Seu app estará online em: `https://seu-usuario-pdv-app.vercel.app`

#### Acessar de PC e Celular
- PC: `https://seu-usuario-pdv-app.vercel.app`
- Celular: Mesma URL acima (funciona em qualquer lugar com internet)

---

## 📱 Como Usar o Sistema

### Dashboard
- Visualiza resumo de vendas, clientes, produtos e contas a receber
- Atualiza em tempo real

### Registrar Venda
1. Clique em **"Vendas"** no menu
2. Selecione um cliente (opcional)
3. Escolha a forma de pagamento (Dinheiro, Débito, Crédito, PIX)
4. Defina o status (Pago ou Pendente)
5. Adicione produtos à venda
6. Clique em **"Finalizar Venda"**

### Cadastrar Cliente
1. Clique em **"Clientes"**
2. Preencha os dados (Nome é obrigatório)
3. Clique em **"Adicionar Cliente"**

### Cadastrar Produto
1. Clique em **"Produtos"**
2. Preencha nome, preço e dados adicionais
3. Clique em **"Adicionar Produto"**

### Acompanhar Contas a Receber
1. Clique em **"Contas a Receber"**
2. Veja o total a receber e pendente
3. Marque como pago quando receber
4. Filtre por status

### Ver Relatórios
1. Clique em **"Relatórios"**
2. Escolha o período (Todos, Mês, Semana, Hoje)
3. Veja análise de vendas, produtos e clientes

---

## 💾 Backup dos Dados

Os dados são salvos no `localStorage` do navegador. Para fazer backup:

1. Abra o navegador (F12 ou Ctrl+Shift+I)
2. Vá para **Console**
3. Cole o código abaixo:

```javascript
const dados = {
  vendas: JSON.parse(localStorage.getItem('pdv_vendas') || '[]'),
  clientes: JSON.parse(localStorage.getItem('pdv_clientes') || '[]'),
  produtos: JSON.parse(localStorage.getItem('pdv_produtos') || '[]'),
  contas: JSON.parse(localStorage.getItem('pdv_contas') || '[]')
}
console.log(JSON.stringify(dados, null, 2))
```

4. Copie a saída e salve em um arquivo `.json`

Para restaurar:
```javascript
const dados = { /* cole o JSON aqui */ }
localStorage.setItem('pdv_vendas', JSON.stringify(dados.vendas))
localStorage.setItem('pdv_clientes', JSON.stringify(dados.clientes))
localStorage.setItem('pdv_produtos', JSON.stringify(dados.produtos))
localStorage.setItem('pdv_contas', JSON.stringify(dados.contas))
```

---

## 🛠️ Tecnologias

- **React 18** - Interface
- **Vite** - Build tool
- **React Router v6** - Navegação
- **CSS Vanilla** - Estilos

---

## 📝 Próximas Features

- [ ] Integração com PIX
- [ ] Exportar relatórios em PDF
- [ ] Backup automático na nuvem
- [ ] Suporte a múltiplos usuários
- [ ] Integração com WhatsApp
- [ ] Aplicativo mobile nativo
- [ ] NFC para leitura de código de barras

---

## 🤝 Como Contribuir

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

---

## ❓ Dúvidas?

Crie uma issue no GitHub ou envie um email para contato@seu-email.com

---

**Desenvolvido com ❤️ para pequenos e médios empreendedores**
