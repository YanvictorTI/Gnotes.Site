# Gnotes Site (Front-end React)

Front-end moderno desenvolvido em **React**, **TypeScript**, **Tailwind CSS** e **Vite**, integrado à API RESTful **Gnotes** (.NET).

---

## 🚀 Funcionalidades

- 📌 **Quadro Kanban com 3 colunas**:
  - **A Fazer** (Todo)
  - **Em Andamento** (InProgress)
  - **Finalizado** (Done)
- 🔄 **Arrastar e Soltar (Drag and Drop)**: Arraste os cards entre as colunas ou utilize os botões rápidos de avanço e recuo.
- ➕ **Criação Rápida**: Crie notas diretamente em qualquer coluna ou pelo botão principal.
- ✏️ **Edição Completa**: Edite título, descrição detalhada e status.
- 🗑️ **Exclusão Segura**: Modal de confirmação com aviso visual.
- 🔍 **Busca em Tempo Real**: Filtre por título ou conteúdo instantaneamente.
- 📊 **Métricas e Progresso**: Barra com contador de notas e percentual de conclusão das tarefas.
- 🌐 **Conexão Resiliente**:
  - Comunica diretamente com os endpoints da API .NET (`http://localhost:5098` / `https://localhost:7237`).
  - Painel de configuração de API e teste de conexão integrado.
  - Modo local com sincronização automática e persistência caso o backend esteja temporariamente indisponível.

---

## 🛠️ Endpoints Consumidos da API Gnotes

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/notes` | Lista todas as notas |
| `GET` | `/api/notes/{id}` | Obtém nota por ID |
| `GET` | `/api/notes/status/{status}` | Filtra notas por status |
| `POST` | `/api/notes` | Cria uma nova nota |
| `PUT` | `/api/notes/{id}` | Atualiza uma nota existente |
| `PATCH` | `/api/notes/{id}/status` | Atualiza o status/coluna de uma nota |
| `DELETE` | `/api/notes/{id}` | Exclui uma nota |

---

## 💻 Como Executar o Projeto

### 1. Iniciar o Backend (.NET API)
Na raiz da pasta `Gnotes/Gnotes`:
```bash
dotnet run
```
A API iniciará em `http://localhost:5098` e `https://localhost:7237` (Swagger em `/swagger`).

### 2. Iniciar o Front-end (Gnotes Site)
Na pasta `Gnotes/Gnotes.Site`:
```bash
npm install
npm run dev
```
Abra [http://localhost:5173](http://localhost:5173) no seu navegador.
