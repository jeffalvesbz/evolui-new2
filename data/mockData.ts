import { User, StudyPlan, Disciplina, Topico, SessaoEstudo, Ciclo, SessaoCiclo, Revisao, CadernoErro, Flashcard, RedacaoCorrigida, CorrecaoCompleta, GamificationStats, XpLogEntry, XpLogEvent, Badge, Friendship } from '../types';
import { Simulation } from '../stores/useStudyStore';
// FIX: Changed date-fns import for subDays to use a named import to resolve module export errors.
import { subDays } from 'date-fns';

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date();
twoDaysAgo.setDate(today.getDate() - 2);


export const MOCK_USER_ID = 'user-1';
export const MOCK_EDITAL_ID = 'edital-1-concurso-xyz';

export const MOCK_USER: User = {
  id: MOCK_USER_ID,
  name: 'Jefferson Alves',
  email: 'test@evolui.app',
};

// --- Add more users for ranking ---
export const MOCK_USERS_FOR_RANKING: User[] = [
    { id: 'user-2', name: 'Ana Costa', email: 'ana@email.com'},
    { id: 'user-3', name: 'Bruno Lima', email: 'bruno@email.com'},
    { id: 'user-4', name: 'Carla Dias', email: 'carla@email.com'},
    { id: 'user-5', name: 'Daniel Souza', email: 'daniel@email.com'},
    { id: 'user-6', name: 'Eduarda Martins', email: 'eduarda@email.com'},
    { id: 'user-7', name: 'Fábio Pereira', email: 'fabio@email.com'},
    { id: 'user-8', name: 'Gabriela Rocha', email: 'gabriela@email.com'},
    { id: 'user-9', name: 'Heitor Santos', email: 'heitor@email.com'},
    { id: 'user-10', name: 'Isabela Ferreira', email: 'isabela@email.com'},
    { id: 'user-11', name: 'João Oliveira', email: 'joao@email.com'},
];

export const MOCK_USERS = [MOCK_USER, ...MOCK_USERS_FOR_RANKING];


export const MOCK_EDITAIS: StudyPlan[] = [
  {
    id: MOCK_EDITAL_ID,
    nome: 'Concurso XYZ 2024',
    descricao: 'Edital para o concurso do órgão XYZ, com provas em Dezembro.',
    data_alvo: '2024-12-15',
    banca: 'Cebraspe',
    orgao: 'Órgão XYZ',
  },
];

const topicosPort: Topico[] = [
    { id: 'top-p-1', titulo: 'Crase', concluido: true, nivelDificuldade: 'médio', ultimaRevisao: null, proximaRevisao: null },
    { id: 'top-p-2', titulo: 'Concordância Verbal', concluido: false, nivelDificuldade: 'difícil', ultimaRevisao: null, proximaRevisao: null },
];
const topicosMat: Topico[] = [
    { id: 'top-m-1', titulo: 'Porcentagem', concluido: true, nivelDificuldade: 'fácil', ultimaRevisao: null, proximaRevisao: null },
    { id: 'top-m-2', titulo: 'Juros Compostos', concluido: true, nivelDificuldade: 'médio', ultimaRevisao: null, proximaRevisao: null },
    { id: 'top-m-3', titulo: 'Análise Combinatória', concluido: false, nivelDificuldade: 'difícil', ultimaRevisao: null, proximaRevisao: null },
];

export const MOCK_DISCIPLINAS: Disciplina[] = [
  {
    id: 'disc-1-port',
    nome: 'Língua Portuguesa',
    progresso: 50,
    anotacoes: 'Focar em reescrita de frases.',
    topicos: topicosPort,
    studyPlanId: MOCK_EDITAL_ID,
  },
  {
    id: 'disc-2-mat',
    nome: 'Matemática Financeira',
    progresso: 66,
    anotacoes: 'Praticar mais problemas de juros.',
    topicos: topicosMat,
    studyPlanId: MOCK_EDITAL_ID,
  },
   {
    id: 'disc-3-const',
    nome: 'Direito Constitucional',
    progresso: 0,
    anotacoes: 'Inciar estudos pelo Art. 5º.',
    topicos: [],
    studyPlanId: MOCK_EDITAL_ID,
  },
];

export const MOCK_SESSOES: SessaoEstudo[] = [
    { id: 'sessao-1', topico_id: 'top-p-1', tempo_estudado: 3600, data_estudo: today.toISOString().split('T')[0], comentarios: 'Estudei a teoria e fiz 10 exercícios.', studyPlanId: MOCK_EDITAL_ID },
    { id: 'sessao-2', topico_id: 'top-m-1', tempo_estudado: 2700, data_estudo: yesterday.toISOString().split('T')[0], comentarios: 'Revisão rápida e 20 questões.', studyPlanId: MOCK_EDITAL_ID },
    { id: 'sessao-3', topico_id: 'top-m-2', tempo_estudado: 1800, data_estudo: twoDaysAgo.toISOString().split('T')[0], comentarios: 'Mais exercícios.', studyPlanId: MOCK_EDITAL_ID },
];

export const MOCK_REVISOES: Revisao[] = [
    { id: 'rev-1', topico_id: 'top-p-1', disciplinaId: 'disc-1-port', conteudo: 'Revisão de Crase', data_prevista: today.toISOString(), status: 'pendente', origem: 'teorica', dificuldade: 'médio', studyPlanId: MOCK_EDITAL_ID },
];

export const MOCK_ERROS: CadernoErro[] = [
    { id: 'erro-1', disciplina: 'Língua Portuguesa', disciplinaId: 'disc-1-port', assunto: 'Uso da crase antes de pronome', descricao: 'Errei a questão por não lembrar a regra.', resolvido: false, data: yesterday.toISOString(), studyPlanId: MOCK_EDITAL_ID, topicoId: 'top-p-1', topicoTitulo: 'Crase' },
];

export const MOCK_CICLOS: Ciclo[] = [
    {
        id: 'ciclo-1',
        nome: 'Ciclo Básico',
        sessoes: [
            { id: 'cs-1', ordem: 0, disciplina_id: 'disc-1-port', tempo_previsto: 3600 },
            { id: 'cs-2', ordem: 1, disciplina_id: 'disc-2-mat', tempo_previsto: 5400 },
            { id: 'cs-3', ordem: 2, disciplina_id: 'disc-3-const', tempo_previsto: 3600 },
        ],
        studyPlanId: MOCK_EDITAL_ID,
    }
];

export const MOCK_FLASHCARDS: Flashcard[] = [
    { id: 'fc-1', topico_id: 'top-p-1', pergunta: 'Quando se usa crase antes de pronomes possessivos femininos?', resposta: 'O uso é facultativo.', interval: 1, easeFactor: 2.5, dueDate: new Date().toISOString() }
];

export const MOCK_CORRECAO_COMPLETA: CorrecaoCompleta = {
    banca: 'Enem',
    notaMaxima: 1000,
    avaliacaoDetalhada: [
        { criterio: 'Competência I', pontuacao: 160, maximo: 200, feedback: 'Demonstrou bom domínio da norma culta, com poucos desvios gramaticais.'},
        { criterio: 'Competência II', pontuacao: 200, maximo: 200, feedback: 'Compreendeu bem o tema e utilizou repertório sociocultural pertinente.'},
        { criterio: 'Competência III', pontuacao: 120, maximo: 200, feedback: 'A argumentação pode ser mais bem desenvolvida e aprofundada.'},
        { criterio: 'Competência IV', pontuacao: 160, maximo: 200, feedback: 'Boa utilização de conectivos, mas pode variar mais.'},
        { criterio: 'Competência V', pontuacao: 120, maximo: 200, feedback: 'A proposta de intervenção está presente, mas falta detalhamento dos agentes e meios.'},
    ],
    comentariosGerais: 'O texto está bem estruturado, mas precisa aprofundar a argumentação e detalhar melhor a proposta de intervenção para alcançar uma nota maior.',
    notaFinal: 760,
    errosDetalhados: [
        { trecho: 'a nível de', tipo: 'Vício de Linguagem', explicacao: 'Expressão considerada clichê e pobre.', sugestao: 'Substituir por "em relação a" ou "no âmbito de".'},
    ],
};

export const MOCK_REDACOES: RedacaoCorrigida[] = [
    {
        id: 'red-1',
        texto: 'A persistência da violência contra a mulher na sociedade brasileira...',
        banca: 'Enem',
        notaMaxima: 1000,
        correcao: MOCK_CORRECAO_COMPLETA,
        data: yesterday.toISOString(),
        studyPlanId: MOCK_EDITAL_ID,
    }
];

export const MOCK_SIMULADOS: Simulation[] = [
    {
        id: 'sim-1',
        name: 'Simulado Geral 01',
        correct: 85,
        wrong: 25,
        blank: 10,
        durationMinutes: 240,
        date: yesterday.toISOString(),
        studyPlanId: MOCK_EDITAL_ID,
        isCebraspe: false,
    }
];

// --- Gamification Mocks ---
export const MOCK_BADGES: Badge[] = [
    { id: 'badge-1', name: 'Primeiros Passos', description: 'Complete sua primeira sessão de estudo.', icon: 'StarIcon', xp: 10 },
    { id: 'badge-2', name: 'Maratonista', description: 'Estude por mais de 10 horas no total.', icon: 'TrendingUpIcon', xp: 50 },
    { id: 'badge-3', name: 'Sequência de 7 Dias', description: 'Mantenha uma sequência de 7 dias de estudos.', icon: 'FlameIcon', xp: 70 },
    { id: 'badge-4', name: 'Revisor Dedicado', description: 'Complete 10 revisões agendadas.', icon: 'RepeatIcon', xp: 30 },
    { id: 'badge-5', name: 'Caça-Erros', description: 'Registre 5 erros no seu caderno.', icon: 'BookCopyIcon', xp: 25 },
    { id: 'badge-6', name: 'Edital Concluído', description: 'Conclua 100% de um edital.', icon: 'TrophyIcon', xp: 200 },
    // New public achievements
    { id: 'badge-7', name: 'Mestre do Tempo', description: 'Estude por um total de 50 horas.', icon: 'ClockIcon', xp: 100 },
    { id: 'badge-8', name: 'Senhor do Tempo', description: 'Estude por um total de 100 horas.', icon: 'HistoryIcon', xp: 200 },
    { id: 'badge-9', name: 'Guardião da Memória', description: 'Revise 500 flashcards.', icon: 'LayersIcon', xp: 150 },
    { id: 'badge-10', name: 'A Lenda', description: 'Mantenha uma sequência de 100 dias de estudos.', icon: 'TrophyIcon', xp: 300 },
    { id: 'badge-11', name: 'Imparável', description: 'Estude por 10 horas em um único dia.', icon: 'ZapIcon', xp: 120 },
    { id: 'badge-12', name: 'Exterminador de Débitos', description: 'Conclua 20 revisões que estavam atrasadas.', icon: 'CheckCircle2Icon', xp: 80 },
    // Secret Achievements
    { id: 'badge-secret-1', name: 'Matrix', description: 'Qual realidade você escolheu?', icon: 'RefreshCwIcon', xp: 150, is_secret: true },
    { id: 'badge-secret-2', name: 'Interestelar', description: 'O tempo é relativo. Você estudou por 5 horas seguidas.', icon: 'HistoryIcon', xp: 300, is_secret: true },
    { id: 'badge-secret-3', name: 'Memento Vivere', description: 'A vida é constância. Você manteve um streak de 30 dias.', icon: 'SunIcon', xp: 250, is_secret: true },
    { id: 'badge-secret-4', name: 'O Sábio', description: 'Você não teme o conhecimento. Resolveu 10 erros difíceis.', icon: 'BookOpenCheckIcon', xp: 200, is_secret: true },
];

export const MOCK_GAMIFICATION_STATS: GamificationStats = {
    user_id: MOCK_USER_ID,
    xp_total: 480,
    level: 4,
    current_streak_days: 3,
    best_streak_days: 15,
    unlockedBadgeIds: ['badge-1'],
};

// --- Add more stats for ranking users ---
export const MOCK_GAMIFICATION_STATS_LIST: GamificationStats[] = [
    MOCK_GAMIFICATION_STATS,
    ...MOCK_USERS_FOR_RANKING.map((user, i) => ({
        user_id: user.id,
        xp_total: 100 + (i * 150),
        level: Math.floor(Math.sqrt(100 + (i * 150)) / 10) + 1,
        current_streak_days: i,
        best_streak_days: i + 5,
        unlockedBadgeIds: [],
    }))
];

// --- Add more xp logs for ranking ---
const generateRandomLogs = (): XpLogEntry[] => {
    const logs: XpLogEntry[] = [];
    const events: XpLogEvent[] = ['cronometro_finalizado', 'revisao_concluida', 'estudo_extra'];
    const users = [MOCK_USER, ...MOCK_USERS_FOR_RANKING];
    for (let i = 0; i < 30; i++) { // Generate logs for the last 30 days
        for (let j = 0; j < Math.floor(Math.random() * 5); j++) { // 0 to 4 logs per day
            const user = users[Math.floor(Math.random() * users.length)];
            const event = events[Math.floor(Math.random() * events.length)];
            const amount = 10 + Math.floor(Math.random() * 10);
            const date = subDays(new Date(), i);
            logs.push({
                id: `xp-${i}-${j}-${user.id}`,
                user_id: user.id,
                event,
                amount,
                meta_json: {},
                created_at: date.toISOString(),
            });
        }
    }
    return logs;
}


export const MOCK_XP_LOG: XpLogEntry[] = [
    { id: 'xp-1', user_id: MOCK_USER_ID, event: 'cronometro_finalizado', amount: 10, meta_json: { topico_id: 'top-p-1' }, created_at: today.toISOString() },
    { id: 'xp-2', user_id: MOCK_USER_ID, event: 'cronometro_finalizado', amount: 10, meta_json: { topico_id: 'top-m-1' }, created_at: yesterday.toISOString() },
    { id: 'xp-3', user_id: MOCK_USER_ID, event: 'cronometro_finalizado', amount: 10, meta_json: { topico_id: 'top-m-2' }, created_at: twoDaysAgo.toISOString() },
    ...generateRandomLogs(),
];

// --- Friends Mocks ---
export const MOCK_FRIENDSHIPS: Friendship[] = [
    // Jefferson's accepted friends
    { id: 'friend-1', user_id_1: 'user-1', user_id_2: 'user-2', status: 'accepted', created_at: subDays(new Date(), 5).toISOString() },
    { id: 'friend-2', user_id_1: 'user-4', user_id_2: 'user-1', status: 'accepted', created_at: subDays(new Date(), 10).toISOString() },
    
    // Jefferson's pending sent request
    { id: 'friend-3', user_id_1: 'user-1', user_id_2: 'user-5', status: 'pending', created_at: subDays(new Date(), 2).toISOString() },

    // Pending requests for Jefferson to accept
    { id: 'friend-4', user_id_1: 'user-3', user_id_2: 'user-1', status: 'pending', created_at: subDays(new Date(), 1).toISOString() },
    { id: 'friend-5', user_id_1: 'user-6', user_id_2: 'user-1', status: 'pending', created_at: subDays(new Date(), 3).toISOString() },
];