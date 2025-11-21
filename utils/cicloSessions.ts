import { SessaoEstudo } from '../types';

const CICLO_SESSAO_REGEX = /CICLO_SESSAO_ID:([a-f0-9-]+)/i;

export const extractCicloSessaoIdFromComentarios = (comentarios?: string | null): string | null => {
    if (!comentarios || typeof comentarios !== 'string') return null;
    const match = comentarios.match(CICLO_SESSAO_REGEX);
    return match ? match[1] : null;
};

export const extractCicloSessaoId = (
    sessao: Pick<SessaoEstudo, 'topico_id' | 'comentarios'>
): string | null => {
    if (sessao.topico_id && sessao.topico_id.startsWith('ciclo-')) {
        return sessao.topico_id.replace('ciclo-', '');
    }
    return extractCicloSessaoIdFromComentarios(sessao.comentarios);
};

/**
 * Remove marcadores técnicos dos comentários para exibição ao usuário
 * Remove: CICLO_SESSAO_ID:xxx e ORIGEM_TRILHA:true
 */
export const limparComentariosParaExibicao = (comentarios?: string | null): string => {
    if (!comentarios || typeof comentarios !== 'string') return '';
    
    return comentarios
        .split('|')
        .map(part => part.trim())
        .filter(part => {
            // Remove marcadores técnicos
            if (part.match(CICLO_SESSAO_REGEX)) return false;
            if (part === 'ORIGEM_TRILHA:true') return false;
            return true;
        })
        .join(' | ')
        .trim();
};

/**
 * Preserva marcadores técnicos originais e adiciona comentários do usuário
 */
export const mesclarComentariosComMarcadores = (
    comentariosUsuario: string,
    comentariosOriginais?: string | null
): string => {
    if (!comentariosOriginais) return comentariosUsuario;
    
    // Extrair marcadores técnicos dos comentários originais
    const marcadores: string[] = [];
    const partes = comentariosOriginais.split('|').map(p => p.trim());
    
    partes.forEach(part => {
        if (part.match(CICLO_SESSAO_REGEX)) {
            marcadores.push(part);
        } else if (part === 'ORIGEM_TRILHA:true') {
            marcadores.push(part);
        }
    });
    
    // Combinar comentários do usuário com marcadores
    const comentariosLimpos = comentariosUsuario.trim();
    if (!comentariosLimpos && marcadores.length === 0) return '';
    if (!comentariosLimpos) return marcadores.join(' | ');
    if (marcadores.length === 0) return comentariosLimpos;
    
    return `${comentariosLimpos} | ${marcadores.join(' | ')}`;
};
