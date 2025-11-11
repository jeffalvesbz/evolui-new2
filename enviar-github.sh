#!/bin/bash

# 🚀 Script para Enviar Projeto ao GitHub
# Execute: bash enviar-github.sh

echo "🚀 Enviando projeto para o GitHub..."
echo ""

# Verificar se já tem remote
if git remote | grep -q "origin"; then
    echo "⚠️  Remote 'origin' já existe."
    read -p "Deseja remover e configurar novamente? (s/n): " resposta
    if [ "$resposta" = "s" ] || [ "$resposta" = "S" ]; then
        git remote remove origin
        echo "✅ Remote removido."
    else
        echo "ℹ️  Mantendo remote existente."
        git remote -v
        echo ""
        echo "Para enviar, execute:"
        echo "  git push -u origin main"
        exit 0
    fi
fi

# Solicitar informações
echo "📋 Preciso de algumas informações:"
echo ""
read -p "Seu username do GitHub: " USERNAME
read -p "Nome do repositório: " REPO_NAME

# Confirmar
echo ""
echo "📝 Configuração:"
echo "   Username: $USERNAME"
echo "   Repositório: $REPO_NAME"
echo "   URL: https://github.com/$USERNAME/$REPO_NAME.git"
echo ""
read -p "Está correto? (s/n): " confirmar

if [ "$confirmar" != "s" ] && [ "$confirmar" != "S" ]; then
    echo "❌ Cancelado."
    exit 1
fi

# Configurar remote
echo ""
echo "🔗 Configurando remote..."
git remote add origin https://github.com/$USERNAME/$REPO_NAME.git

# Renomear branch
echo "📝 Renomeando branch para main..."
git branch -M main

# Verificar
echo ""
echo "✅ Remote configurado:"
git remote -v

echo ""
echo "📤 Enviando para o GitHub..."
echo ""
echo "⚠️  Você precisará autenticar:"
echo "   - Username: $USERNAME"
echo "   - Password: Use um Personal Access Token (não sua senha)"
echo "   - Criar token: https://github.com/settings/tokens"
echo ""
read -p "Pressione ENTER para continuar..."

# Enviar
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Sucesso! Projeto enviado para o GitHub!"
    echo "🌐 Acesse: https://github.com/$USERNAME/$REPO_NAME"
else
    echo ""
    echo "❌ Erro ao enviar. Verifique:"
    echo "   1. Repositório existe no GitHub?"
    echo "   2. Credenciais corretas?"
    echo "   3. Personal Access Token configurado?"
fi

