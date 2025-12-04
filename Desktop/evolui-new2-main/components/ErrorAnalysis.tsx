import React, { useMemo } from 'react';
import { CadernoErro } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ErrorAnalysisProps {
    erros: CadernoErro[];
}

export const ErrorAnalysis: React.FC<ErrorAnalysisProps> = ({ erros }) => {
    const data = useMemo(() => {
        const subjectCounts = new Map<string, number>();

        erros.forEach(erro => {
            // Normalize subject: lowercase and trim
            const subject = erro.assunto?.trim() || erro.topicoTitulo?.trim() || 'Sem assunto';
            const key = subject; // Case sensitive or not? Let's keep original casing but maybe group by lowercase key if needed. 
            // For now, simple grouping.
            subjectCounts.set(key, (subjectCounts.get(key) || 0) + 1);
        });

        const result = Array.from(subjectCounts.entries()).map(([name, count]) => ({
            name,
            count,
            label: name.length > 20 ? name.substring(0, 20) + '...' : name
        }));

        // Sort by count descending and take top 5
        return result.sort((a, b) => b.count - a.count).slice(0, 5);
    }, [erros]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Nenhum erro registrado no caderno ainda.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="truncate font-medium" title={item.name}>
                                {index + 1}. {item.name}
                            </span>
                            <span className="text-muted-foreground">{item.count} erros</span>
                        </div>
                        <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-500/80 rounded-full"
                                style={{ width: `${(item.count / data[0].count) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
