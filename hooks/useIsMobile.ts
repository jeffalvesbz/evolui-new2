import { useState, useEffect } from 'react';

/**
 * Hook para detectar se o dispositivo é mobile
 * @param breakpoint - Largura em pixels para considerar mobile (padrão: 768px)
 * @returns boolean indicando se é mobile
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Função para verificar se é mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // Verificar inicialmente
        checkMobile();

        // Adicionar listener para resize
        window.addEventListener('resize', checkMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkMobile);
    }, [breakpoint]);

    return isMobile;
};

/**
 * Hook para detectar tamanho específico de tela
 * @returns objeto com flags para diferentes tamanhos
 */
export const useMediaQuery = () => {
    const [screenSize, setScreenSize] = useState({
        isMobile: false,    // < 768px
        isTablet: false,    // >= 768px && < 1024px
        isDesktop: false,   // >= 1024px
        isLarge: false,     // >= 1280px
    });

    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            setScreenSize({
                isMobile: width < 768,
                isTablet: width >= 768 && width < 1024,
                isDesktop: width >= 1024,
                isLarge: width >= 1280,
            });
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return screenSize;
};
