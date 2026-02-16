import { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    trend?: 'up' | 'down' | 'neutral';
    trendText?: string;
    borderColor: string;
    icon: ReactNode;
}

export function StatCard({
    title,
    value,
    subtitle,
    trend = 'neutral',
    trendText,
    borderColor,
    icon
}: StatCardProps) {
    const getTrendColor = () => {
        if (trend === 'up') return '#16A34A';
        if (trend === 'down') return '#DC2626';
        return '#6B7280';
    };

    const getTrendIcon = () => {
        if (trend === 'up') return '↑';
        if (trend === 'down') return '↓';
        return '→';
    };

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            borderLeft: `4px solid ${borderColor}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.2s',
            cursor: 'default'
        }}
        onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)';
            e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
            e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: '14px',
                        color: '#6B7280',
                        fontWeight: 500,
                        marginBottom: '8px'
                    }}>
                        {title}
                    </div>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        color: '#111827',
                        lineHeight: '1.2'
                    }}>
                        {value}
                    </div>
                </div>
                <div style={{
                    fontSize: '32px',
                    opacity: 0.7
                }}>
                    {icon}
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {trendText && (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: getTrendColor()
                    }}>
                        {getTrendIcon()} {trendText}
                    </span>
                )}
                <span style={{
                    fontSize: '13px',
                    color: '#9CA3AF'
                }}>
                    {subtitle}
                </span>
            </div>
        </div>
    );
}
