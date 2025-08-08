import React, { useRef, useEffect, useState } from 'react';

const LineChart = ({ data = [] }) => {
    const chartRef = useRef(null);
    const [chartWidth, setChartWidth] = useState(600);

    useEffect(() => {
        const updateChartWidth = () => {
            if (chartRef.current) {
                const containerWidth = chartRef.current.offsetWidth;
                setChartWidth(Math.max(containerWidth, 400));
            }
        };

        updateChartWidth();
        window.addEventListener('resize', updateChartWidth);
        return () => window.removeEventListener('resize', updateChartWidth);
    }, []);

    if (!data || data.length === 0) {
        return (
            <div className="chart-placeholder">
                <p>No hay datos disponibles para mostrar</p>
            </div>
        );
    }

    const handleClick = (id) => {
        alert(id);
    }

    // Preparar los datos para el gráfico
    const chartData = data.map(item => ({
        ...item,
        monthName: item.mes_nombre || getMonthName(item.mes),
        year: item.año
    }));

    // Encontrar el valor máximo para escalar el gráfico
    const maxValue = Math.max(...chartData.map(item => item.total));
    
    // Si todos los valores son 0, establecer un máximo de 1 para evitar división por cero
    const chartMaxValue = maxValue === 0 ? 1 : maxValue;
    
    // Calcular valores del eje Y (máximo 5 valores)
    const yAxisValues = [];
    if (chartMaxValue <= 5) {
        // Si el máximo es pequeño, mostrar todos los valores de 0 al máximo
        for (let i = 0; i <= chartMaxValue; i++) {
            yAxisValues.push(i);
        }
    } else if (chartMaxValue <= 10) {
        // Si el máximo es entre 6-10, mostrar valores de 2 en 2
        for (let i = 0; i <= chartMaxValue; i += 2) {
            yAxisValues.push(i);
        }
        // Asegurar que el último valor sea el máximo real
        if (yAxisValues[yAxisValues.length - 1] !== chartMaxValue) {
            yAxisValues.push(chartMaxValue);
        }
    } else {
        // Si el máximo es grande, mostrar 5 valores distribuidos
        const step = Math.ceil(chartMaxValue / 4);
        for (let i = 0; i <= 4; i++) {
            yAxisValues.push(i * step);
        }
        // Asegurar que el último valor sea el máximo real
        if (yAxisValues[yAxisValues.length - 1] !== chartMaxValue) {
            yAxisValues[yAxisValues.length - 1] = chartMaxValue;
        }
    }

    // Configuración del gráfico
    const chartHeight = 200;
    const padding = 40;
    const availableWidth = chartWidth - 2 * padding;

    return (
        <div className="line-chart-container" ref={chartRef}>
            <div className="chart-wrapper">
                <svg 
                    width={chartWidth} 
                    height={chartHeight}
                    className="line-chart"
                >
                    {/* Líneas de fondo */}
                    {yAxisValues.map((value, index) => {
                        const y = padding + (value / chartMaxValue) * (chartHeight - 2 * padding);
                        return (
                            <line
                                key={index}
                                x1={padding}
                                y1={y}
                                x2={chartWidth - padding}
                                y2={y}
                                stroke="#e2e8f0"
                                strokeWidth="1"
                                strokeDasharray="5,5"
                            />
                        );
                    })}

                    {/* Línea del gráfico */}
                    <polyline
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="3"
                        points={chartData.map((item, index) => {
                            const x = padding + (index / (chartData.length - 1)) * availableWidth;
                            const y = padding + ((chartMaxValue - item.total) / chartMaxValue) * (chartHeight - 2 * padding);
                            return `${x},${y}`;
                        }).join(' ')}
                    />

                    {/* Puntos del gráfico agregar evento click al punto */}
                    {chartData.map((item, index) => {
                        const x = padding + (index / (chartData.length - 1)) * availableWidth;
                        const y = padding + ((chartMaxValue - item.total) / chartMaxValue) * (chartHeight - 2 * padding);
                        
                        return (
                            <g key={index}>
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={item.total > 0 ? "6" : "3"}
                                    fill={item.total > 0 ? "#2563eb" : "#e2e8f0"}
                                    stroke="white"
                                    strokeWidth="2"
                                    className="chart-point"
                              //      onClick={() => handleClick(item.monthName + '/' + item.year)}
                                />
                                {/* Tooltip solo para meses con datos */}
                                {item.total > 0 && (
                                    <text
                                        x={x}
                                        y={y - 15}
                                        textAnchor="middle"
                                        className="chart-tooltip"
                                        fontSize="12"
                                        fill="#64748b"
                                    >
                                        {item.total}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Etiquetas del eje X (meses) */}
                    {chartData.map((item, index) => {
                        const x = padding + (index / (chartData.length - 1)) * availableWidth;
                        return (
                            <text
                                key={index}
                                x={x}
                                y={chartHeight - 10}
                                textAnchor="middle"
                                className="chart-label"
                                fontSize="11"
                                fill="#64748b"
                            >
                                {item.monthName.substring(0, 3)}
                            </text>
                        );
                    })}

                    {/* Etiquetas del eje Y */}
                    {yAxisValues.map((value, index) => {
                        const y = padding + ((chartMaxValue - value) / chartMaxValue) * (chartHeight - 2 * padding);
                        return (
                            <text
                                key={index}
                                x={padding - 15}
                                y={y + 4}
                                textAnchor="end"
                                className="chart-label"
                                fontSize="11"
                                fill="#64748b"
                                fontWeight="500"
                            >
                                {value}
                            </text>
                        );
                    })}
                </svg>
            </div>

            {/* Leyenda */}
            <div className="chart-legend">
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#2563eb' }}></div>
                    <span>Permisos por mes ({new Date().getFullYear()})</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#e2e8f0' }}></div>
                    <span>Meses sin permisos</span>
                </div>
            </div>

            {/* Información adicional */}
            <div className="chart-info">
                <div className="info-item">
                    <strong>Total de permisos en {new Date().getFullYear()}:</strong> {chartData.reduce((sum, item) => sum + item.total, 0)}
                </div>
                <div className="info-item">
                    <strong>Promedio mensual:</strong> {Math.round(chartData.reduce((sum, item) => sum + item.total, 0) / chartData.length)}
                </div>
                <div className="info-item">
                    <strong>Meses con actividad:</strong> {chartData.filter(item => item.total > 0).length} de {chartData.length}
                </div>
            </div>
        </div>
    );
};

// Función para obtener el nombre del mes
const getMonthName = (monthNumber) => {
    const months = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return months[monthNumber - 1] || monthNumber;
};

export default LineChart;