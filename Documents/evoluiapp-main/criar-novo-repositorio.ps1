# Script para criar novo repositório no GitHub e fazer push
# Execute este script após criar o repositório no GitHub

param(
    [Parameter(Mandatory=$true)]
    [string]$NomeRepositorio,
    
    [Parameter(Mandatory=$true)]
    [string]$UsuarioGitHub
)

Write-Host "🚀 Configurando novo repositório: $NomeRepositorio" -ForegroundColor Cyan

# URL do novo repositório
$repoUrl = "https://github.com/$UsuarioGitHub/$NomeRepositorio.git"

# Adicionar novo remote
Write-Host "📡 Adicionando novo remote 'new-origin'..." -ForegroundColor Yellow
git remote add new-origin $repoUrl

# Verificar remotes
Write-Host "`n📋 Remotes configurados:" -ForegroundColor Yellow
git remote -v

# Fazer push para o novo repositório
Write-Host "`n⬆️  Enviando código para o novo repositório..." -ForegroundColor Yellow
git push -u new-origin main

Write-Host "`n✅ Concluído! Seu código foi enviado para: $repoUrl" -ForegroundColor Green
Write-Host "`n💡 Para usar o novo repositório como padrão, execute:" -ForegroundColor Cyan
Write-Host "   git remote set-url origin $repoUrl" -ForegroundColor White
Write-Host "   git remote remove new-origin" -ForegroundColor White



