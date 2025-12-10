
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Ler .env.local manualmente
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    if (urlMatch) supabaseUrl = urlMatch[1].trim();
    if (keyMatch) supabaseKey = keyMatch[1].trim();
} catch (e) {
    console.error('Erro ao ler .env.local:', e);
    process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Verificando conexão com Supabase...');
    console.log('URL:', supabaseUrl);

    try {
        // Verificar se colunas existem
        const { error: columnsError } = await supabase
            .from('flashcard_study_sessions')
            .select('user_id, deck_id')
            .limit(1);

        if (columnsError) {
            console.log('Erro ao selecionar colunas:', columnsError);
        } else {
            console.log('Colunas user_id e deck_id existem.');
        }

        // Testar se constraint existe tentando um UPSERT que falharia sem ela
        // Mas como não podemos inserir lixo facilmente sem violar FKs, vamos confiar no erro anterior 42P10
        // Se o erro 42P10 apareceu nos logs do navegador, é quase certeza que a constraint falta.

        console.log('Verificação concluída.');

    } catch (err) {
        console.error('Exceção:', err);
    }
}

checkTable();
