# Formato JSON para Importação de Editais

O sistema suporta **dois formatos** de JSON para importação de editais. Ambos são compatíveis e podem ser usados em qualquer lugar onde há importação de JSON.

## 📋 Formato 1: Hierárquico (Recomendado)

Este formato suporta estrutura hierárquica completa com tópicos, subtópicos e itens.

### Estrutura Básica

```json
{
  "meta": {
    "orgao": "TCDF",
    "cargo": "Auditor de Controle Externo",
    "versao": "1.0"
  },
  "disciplinas": [
    {
      "nome": "Direito Civil",
      "conteudo": [
        {
          "id": "uuid-t1",
          "indice": "1",
          "titulo": "Lei de Introdução às Normas do Direito Brasileiro",
          "tipo": "topico",
          "filhos": [
            {
              "id": "uuid-t1-1",
              "indice": "1.1",
              "titulo": "Vigência, Aplicação, Obrigatoriedade...",
              "tipo": "subtopico",
              "filhos": [
                {
                  "id": "uuid-t1-1-a",
                  "titulo": "Vigência",
                  "tipo": "item"
                }
              ]
            },
            {
              "id": "uuid-t1-2",
              "indice": "1.2",
              "titulo": "Conflito das Leis no Tempo",
              "tipo": "subtopico",
              "filhos": []
            }
          ]
        },
        {
          "id": "uuid-t10",
          "indice": "10",
          "titulo": "Contratos",
          "tipo": "topico",
          "filhos": []
        }
      ]
    }
  ]
}
```

### Campos do Formato Hierárquico

#### Nível Raiz
- `meta` (objeto, opcional): Metadados do edital
  - `orgao` (string): Nome do órgão
  - `cargo` (string): Nome do cargo
  - `versao` (string): Versão do edital
- `nome` (string, opcional): Nome do edital (se não fornecido, será gerado a partir de `meta.orgao` e `meta.cargo`)
- `disciplinas` (array, obrigatório): Lista de disciplinas

#### Disciplina
- `nome` (string, obrigatório): Nome da disciplina
- `conteudo` (array, obrigatório): Lista de itens de conteúdo (tópicos, subtópicos, itens)
- `anotacoes` (string, opcional): Anotações sobre a disciplina

#### Item de Conteúdo (tópico/subtópico/item)
- `id` (string, opcional): Identificador único
- `indice` (string, opcional): Índice numérico (ex: "1", "1.1", "1.2.3")
- `titulo` (string, obrigatório): Título do item
- `tipo` (string, opcional): Tipo do item - `"topico"`, `"subtopico"` ou `"item"` (padrão: `"topico"`)
- `filhos` (array, opcional): Lista de itens filhos (permite hierarquia infinita)

### Comportamento
- Os índices são preservados e incluídos no nome do tópico: `"1.1 - Vigência, Aplicação..."`
- A hierarquia é processada recursivamente
- Todos os itens (tópicos, subtópicos, itens) são criados como tópicos no banco de dados

---

## 📋 Formato 2: Simples (Compatibilidade)

Este formato é mais simples e mantido para compatibilidade com versões anteriores.

### Estrutura Básica

```json
{
  "nome": "PF Agente 2021",
  "banca": "CEBRASPE",
  "ano": 2021,
  "cargo": "Agente",
  "disciplinas": [
    {
      "nome": "Português",
      "topicos": [
        "Interpretação",
        "Gramática",
        {
          "titulo": "Domínio da Ortografia",
          "subtopicos": ["Acentuação", "Pontuação"]
        }
      ]
    }
  ]
}
```

### Campos do Formato Simples

#### Nível Raiz
- `nome` (string, obrigatório): Nome do edital
- `banca` (string, opcional): Nome da banca organizadora
- `ano` (number, opcional): Ano do edital (padrão: ano atual)
- `cargo` (string, opcional): Nome do cargo
- `disciplinas` (array, obrigatório): Lista de disciplinas

#### Disciplina
- `nome` (string, obrigatório): Nome da disciplina
- `topicos` (array, obrigatório): Lista de tópicos
- `anotacoes` (string, opcional): Anotações sobre a disciplina

#### Tópico
Pode ser:
1. **String simples**: `"Interpretação"`
2. **Objeto com título**: 
   ```json
   {
     "titulo": "Domínio da Ortografia",
     "nivelDificuldade": "medio"
   }
   ```
3. **Objeto com subtópicos**:
   ```json
   {
     "titulo": "Domínio da Ortografia",
     "subtopicos": ["Acentuação", "Pontuação"]
   }
   ```

---

## 🔄 Compatibilidade

O sistema detecta automaticamente qual formato está sendo usado:

1. **Se existe `meta`**: Usa Formato Hierárquico
2. **Se existe `nome` no raiz**: Usa Formato Simples
3. **Se existe `conteudo` na disciplina**: Processa hierarquia completa
4. **Se existe `topicos` na disciplina**: Processa formato simples

---

## 📝 Exemplos Completos

### Exemplo 1: Formato Hierárquico Completo

```json
{
  "meta": {
    "orgao": "TCDF",
    "cargo": "Auditor de Controle Externo",
    "versao": "1.0"
  },
  "disciplinas": [
    {
      "nome": "Direito Civil",
      "conteudo": [
        {
          "indice": "1",
          "titulo": "Lei de Introdução às Normas do Direito Brasileiro",
          "tipo": "topico",
          "filhos": [
            {
              "indice": "1.1",
              "titulo": "Vigência, Aplicação, Obrigatoriedade",
              "tipo": "subtopico",
              "filhos": [
                {
                  "titulo": "Vigência",
                  "tipo": "item"
                },
                {
                  "titulo": "Aplicação",
                  "tipo": "item"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Exemplo 2: Formato Simples

```json
{
  "nome": "PF Agente 2021",
  "banca": "CEBRASPE",
  "ano": 2021,
  "cargo": "Agente",
  "disciplinas": [
    {
      "nome": "Português",
      "topicos": [
        "Interpretação de Texto",
        "Gramática",
        {
          "titulo": "Ortografia",
          "subtopicos": ["Acentuação", "Pontuação", "Crase"]
        }
      ]
    },
    {
      "nome": "Matemática",
      "topicos": [
        "Álgebra",
        "Geometria",
        "Estatística"
      ]
    }
  ]
}
```

### Exemplo 3: Formato Híbrido (meta + topicos simples)

```json
{
  "meta": {
    "orgao": "TCDF",
    "cargo": "Auditor",
    "versao": "1.0"
  },
  "nome": "Edital TCDF 2024",
  "disciplinas": [
    {
      "nome": "Direito Administrativo",
      "topicos": [
        "Princípios da Administração Pública",
        "Atos Administrativos"
      ]
    }
  ]
}
```

---

## ⚠️ Validações

### Campos Obrigatórios
- `disciplinas` (array) - deve existir e ser um array
- Cada disciplina deve ter `nome` (string)
- No formato hierárquico: `conteudo` deve ser um array
- No formato simples: `topicos` deve ser um array
- No formato hierárquico: cada item de `conteudo` deve ter `titulo`

### Mensagens de Erro
- `"JSON inválido. Campos obrigatórios: nome ou meta.orgao/cargo, disciplinas."`
- `"JSON inválido. Campo obrigatório: disciplinas (array)."`

---

## 🎯 Onde Usar

Estes formatos podem ser usados em:

1. **Painel Admin** (`/admin/editais/novo`) - Criar editais padrão
2. **Modal de Gerenciamento de Editais** - Importar edital para usuário
3. **Modal de Solicitar Edital** - Importar edital ao solicitar

Todos os três locais suportam ambos os formatos automaticamente.



