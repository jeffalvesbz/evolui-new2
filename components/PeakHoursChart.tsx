import React, { useMemo } from 'react';
import { SessaoEstudo } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { parseISO, getHours } from 'date-fns';

interface PeakHoursChartProps {
    sessoes: SessaoEstudo[];
}

export const PeakHoursChart: React.FC<PeakHoursChartProps> = ({ sessoes }) => {
    const data = useMemo(() => {
        const hoursMap = new Array(24).fill(0);

        sessoes.forEach(sessao => {
            // Prefer created_at for precise time, fallback to data_estudo (which might be just date)
            const dateStr = sessao.created_at || sessao.data_estudo;
            if (!dateStr) return;

            try {
                const date = parseISO(dateStr);
                // If it's just a date (YYYY-MM-DD), it defaults to 00:00 local or UTC. 
                // We only want to count if we have time info. 
                // created_at is usually ISO with time. data_estudo might be just YYYY-MM-DD.
                // If created_at is missing, we might skip or put in a bucket, but for "Peak Hours" 
                // we really need time. 
                if (sessao.created_at) {
                    const hour = getHours(date);
                    hoursMap[hour] += (sessao.tempo_estudado / 60); // Minutes
                }
            } catch (e) {
                console.error("Error parsing date", dateStr);
            }
        });

        return hoursMap.map((minutes, hour) => ({
            hour: `${hour}h`,
            minutes: Math.round(minutes),
            rawHour: hour
        }));
    }, [sessoes]);

    // Find max value for domain
    const maxMinutes = Math.max(...data.map(d => d.minutes));

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis
                        dataKey="hour"
                        stroke="var(--color-muted-foreground)"
                        fontSize={12}
                        axisLine={false}
                        tickLine={false}
                        interval={2} // Show every 3rd label to avoid clutter
                    />
                    <YAxis
                        stroke="var(--color-muted-foreground)"
                        fontSize={12}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value}m`}
                    />
                    <Tooltip
                        cursor={{ fill: 'var(--color-highlight)' }}
                        contentStyle={{
                            backgroundColor: 'var(--color-card)',
                            borderColor: 'var(--color-border)',
                            borderRadius: '12px',
                            color: 'var(--color-foreground)',
                            boxShadow: 'var(--color-shadow)'
                        }}
                        itemStyle={{ color: 'var(--color-foreground)' }}
                        formatter={(value: number) => [`${value} minutos`, 'Tempo Estudado']}
                        labelStyle={{ color: 'var(--color-muted-foreground)' }}
                    />
                    <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.minutes > 0 ? 'var(--color-primary)' : 'var(--color-muted)'}
                                fillOpacity={entry.minutes > 0 ? 1 : 0.3}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
