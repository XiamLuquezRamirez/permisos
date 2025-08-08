import React, { useState, useEffect } from 'react';
import {
    FaTimes, FaEye, FaCheck, FaTimes as FaReject,
    FaDownload, FaFile, FaImage, FaCalendar, FaClock,
    FaUser, FaFileAlt, FaChartBar, FaCalendarAlt, FaClock as FaTime, FaPrint
} from 'react-icons/fa';
import axiosInstance from '../axiosConfig';
import Paginador from './Paginador';
import LineChart from './LineChart';

const InformesAdmin = ({ onClose }) => {
    const [loading, setLoading] = useState(false);
    const [informes, setInformes] = useState([]);
    const [estadisticasGenerales, setEstadisticasGenerales] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('empleados'); // 'empleados' o 'generales'
    
    // Estados para el filtro de fechas
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [filtroActivo, setFiltroActivo] = useState(false);

    const cargarInformes = async () => {
        setLoading(true);
        try {
            let url = '/informesEmpleados';
            const params = new URLSearchParams();
            
            if (filtroActivo && fechaInicio && fechaFin) {
                params.append('fecha_inicio', fechaInicio);
                params.append('fecha_fin', fechaFin);
                url += `?${params.toString()}`;
            }
            
            const response = await axiosInstance.get(url);
            setInformes(response.data.informes);
        } catch (error) {
            console.error('Error al cargar informes:', error);
        }
        setLoading(false);
    }

    const cargarEstadisticasGenerales = async () => {
        try {
            let url = '/estadisticas-generales';
            const params = new URLSearchParams();
            
            if (filtroActivo && fechaInicio && fechaFin) {
                params.append('fecha_inicio', fechaInicio);
                params.append('fecha_fin', fechaFin);
                url += `?${params.toString()}`;
            }
            
            const response = await axiosInstance.get(url);
            const datosOriginales = response.data.estadisticas;
            console.log(datosOriginales);
            
            // Procesar los datos directamente ya que es un objeto, no un array
            const datosProcesados = {
                ...datosOriginales,
                horas_totales_permisos: (Math.round(datosOriginales.horas_totales_permisos * 100) / 100).toFixed(2),
                porcentaje_aprobacion: (Math.round(datosOriginales.porcentaje_aprobacion * 100) / 100).toFixed(2),
                porcentaje_rechazo: (Math.round(datosOriginales.porcentaje_rechazo * 100) / 100).toFixed(2), 
            };
    
            setEstadisticasGenerales(datosProcesados);
        } catch (error) {
            console.error('Error al cargar estadísticas generales:', error);
        }
    }
    

    useEffect(() => {
        cargarInformes();
        cargarEstadisticasGenerales();
    }, [filtroActivo, fechaInicio, fechaFin]);

    const [itemsPerPage] = useState(5);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = informes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(informes.length / itemsPerPage);

    // Funciones para manejar el filtro de fechas
    const aplicarFiltro = () => {
        if (fechaInicio && fechaFin) {
            setFiltroActivo(true);
            setCurrentPage(1); // Resetear a la primera página
        }
    };

    const limpiarFiltro = () => {
        setFechaInicio('');
        setFechaFin('');
        setFiltroActivo(false);
        setCurrentPage(1); // Resetear a la primera página
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '';
        const fechaObj = new Date(fecha);
        return fechaObj.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // Función para imprimir el listado de empleados
    const imprimirListado = () => {
        const ventanaImpresion = window.open('', '_blank');
        
        const fechaActual = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const rangoFechas = filtroActivo 
            ? `Período: ${formatearFecha(fechaInicio)} - ${formatearFecha(fechaFin)}`
            : 'Período: Todos los registros';
        
        const contenidoHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Listado de Empleados - Informe de Permisos</title>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        font-size: 12px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 10px;
                    }
                    .header h1 {
                        margin: 0;
                        color: #333;
                        font-size: 24px;
                    }
                    .header p {
                        margin: 5px 0;
                        color: #666;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                        font-size: 11px;
                    }
                    th {
                        background-color: #f5f5f5;
                        font-weight: bold;
                        text-align: center;
                    }
                    .employee-photo {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        object-fit: cover;
                    }
                    .stat-cell {
                        text-align: center;
                        font-weight: bold;
                    }
                    .approved { color: #28a745; }
                    .rejected { color: #dc3545; }
                    .pending { color: #ffc107; }
                    .cancelado { color: #6c757d; }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 10px;
                        color: #666;
                    }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📊 Informe de Permisos por Empleado</h1>
                    <p>Fecha de generación: ${fechaActual}</p>
                    <p>${rangoFechas}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th style="width: 8%">Foto</th>
                            <th style="width: 25%">Nombre</th>
                            <th style="width: 15%">Permisos Otorgados</th>
                            <th style="width: 15%">Permisos Rechazados</th>
                            <th style="width: 12%">Pendientes</th>
                            <th style="width: 12%">Cancelados</th>
                            <th style="width: 12%">Horas</th>
                            <th style="width: 13%">Días</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${informes.map(empleado => `
                            <tr>
                                <td style="text-align: center;">
                                    <img src="${empleado.foto_usuario || empleado.foto || '/images/default.png'}" 
                                         alt="${empleado.nombres}" 
                                         class="employee-photo"
                                         onerror="this.src='/images/default.png'">
                                </td>
                                <td style="text-transform: capitalize;">
                                    ${empleado.nombres} ${empleado.apellidos}
                                </td>
                                <td class="stat-cell approved">
                                    ${empleado.estadisticas?.permisos_otorgados || 0}
                                </td>
                                <td class="stat-cell rejected">
                                    ${empleado.estadisticas?.permisos_rechazados || 0}
                                </td>
                                <td class="stat-cell pending">
                                    ${empleado.estadisticas?.permisos_pendientes || 0}
                                </td>
                                <td class="stat-cell cancelado">
                                    ${empleado.estadisticas?.permisos_cancelados || 0}
                                </td>
                                <td class="stat-cell">
                                    ${empleado.estadisticas?.horas_permisos || 0}h
                                </td>
                                <td class="stat-cell">
                                    ${empleado.estadisticas?.dias_permisos || 0}d
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>Total de empleados: ${informes.length}</p>
                    <p>Documento generado automáticamente por el sistema de permisos</p>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `;
        
        ventanaImpresion.document.write(contenidoHTML);
        ventanaImpresion.document.close();
    };

    const renderEstadisticasGenerales = () => (
        <div className="estadisticas-generales">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUser />
                    </div>
                    <div className="stat-content">
                        <h3>{estadisticasGenerales?.total_empleados || 0}</h3>
                        <p>Total Empleados</p>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaFileAlt />
                    </div>
                    <div className="stat-content">
                        <h3>{estadisticasGenerales?.total_permisos || 0}</h3>
                        <p>Total Permisos</p>
                    </div>
                </div>
                
                <div className="stat-card approved">
                    <div className="stat-icon">
                        <FaCheck />
                    </div>
                    <div className="stat-content">
                        <h3>{estadisticasGenerales?.permisos_otorgados || 0}</h3>
                        <p>Permisos Otorgados</p>
                        <small>{estadisticasGenerales?.porcentaje_aprobacion || 0}%</small>
                    </div>
                </div>
                
                <div className="stat-card rejected">
                    <div className="stat-icon">
                        <FaReject />
                    </div>
                    <div className="stat-content">
                        <h3>{estadisticasGenerales?.permisos_rechazados || 0}</h3>
                        <p>Permisos Rechazados</p>
                        <small>{estadisticasGenerales?.porcentaje_rechazo || 0}%</small>
                    </div>
                </div>
                
                <div className="stat-card pending">
                    <div className="stat-icon">
                        <FaClock />
                    </div>
                    <div className="stat-content">
                        <h3>{estadisticasGenerales?.permisos_pendientes || 0}</h3>
                        <p>Permisos Pendientes</p>
                        <small>{estadisticasGenerales?.porcentaje_pendientes || 0}%</small>
                    </div>
                </div>

                <div className="stat-card rejected">
                    <div className="stat-icon">
                        <FaClock />
                    </div>
                    <div className="stat-content">
                        <h3>{estadisticasGenerales?.permisos_cancelados || 0}</h3>
                        <p>Permisos Cancelados</p>
                        <small>{estadisticasGenerales?.porcentaje_cancelados || 0}%</small>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaTime />
                    </div>
                    <div className="stat-content">
                        <h3>{estadisticasGenerales?.horas_totales_permisos || 0}</h3>
                        <p>Horas Totales</p>
                    </div>
                </div>
            </div>

            {/* Grafico de permisos por mes */}
            <div className="chart-container">
                <h3>Permisos por Mes</h3>
                <LineChart data={estadisticasGenerales?.permisos_por_mes} />
            </div>
            {/* top 5 empleados con mas permisos */}
            <div className="top-empleados-container">
                <h3>🏆 Top 5 Empleados con Más Permisos</h3>
                <div className="top-empleados-list">
                    {estadisticasGenerales?.top_empleados_permisos?.map((empleado, index) => (
                        <div key={index} className="top-empleado-item">
                            <div className="empleado-rank">
                                <span className="rank-number">{index + 1}</span>
                                <div className="rank-icon">
                                    {index === 0 && <span>🥇</span>}
                                    {index === 1 && <span>🥈</span>}
                                    {index === 2 && <span>🥉</span>}
                                    {index > 2 && <span>🏅</span>}
                                </div>
                            </div>
                            <div className="empleado-info">
                                <div className="empleado-nombre">
                                    {empleado.nombres} {empleado.apellidos}
                                </div>
                                <div className="empleado-stats">
                                    <span className="permisos-count">
                                        {empleado.total_permisos} permisos
                                    </span>
                                </div>
                            </div>
                            <div className="empleado-badge">
                                #{index + 1}
                            </div>
                        </div>
                    ))}
                    {(!estadisticasGenerales?.top_empleados_permisos || estadisticasGenerales.top_empleados_permisos.length === 0) && (
                        <div className="no-top-empleados">
                            <p>No hay datos suficientes para mostrar el ranking</p>
                        </div>
                    )}
                </div>
            </div>

            {/* permisos por motivo */}
            <div className="permisos-por-motivo-container">
                <h3>Permisos por Motivo</h3>
                <div className="permisos-por-motivo-list">
                    {estadisticasGenerales?.permisos_por_motivo?.map((motivo, index) => (
                        <div key={index} className="permisos-por-motivo-item">
                            <div className="motivo-nombre">{motivo.motivo}</div>
                            <div className="motivo-cantidad">{motivo.total} permisos</div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );

    const renderTablaEmpleados = () => (
        <>
            <div className="table-header-info">
                <div className="table-header-content">
                    <p>📊 Empleados ordenados por cantidad total de permisos (de mayor a menor)</p>
                    <button 
                        className="btn-imprimir-listado"
                        onClick={imprimirListado}
                        disabled={informes.length === 0}
                        title="Imprimir listado de empleados"
                    >
                        <FaPrint /> Imprimir Listado
                    </button>
                </div>
            </div>
            <table className="employee-table" style={{
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse'
            }}>
                <thead>
                    <tr>
                        <th style={{ width: '8%' }}>Foto</th>
                        <th style={{ width: '25%' }}>Nombre</th>
                        <th style={{ width: '15%' }}>Permisos Otorgados</th>
                        <th style={{ width: '15%' }}>Permisos Rechazados</th>
                        <th style={{ width: '12%' }}>Pendientes</th>
                        <th style={{ width: '12%' }}>Cancelados</th>
                        <th style={{ width: '12%' }}>Horas</th>
                        <th style={{ width: '13%' }}>Días</th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.map(empleado => (
                        <tr key={empleado.id}>
                            <td>
                                <img
                                    src={empleado.foto_usuario || empleado.foto || '/images/default.png'}
                                    alt={empleado.nombres}
                                    className="employee-mini-photo"
                                    onError={(e) => {
                                        e.target.src = '/images/default.png';
                                    }}
                                />
                            </td>
                            <td style={{ textTransform: 'capitalize' }}>
                                {empleado.nombres} {empleado.apellidos}
                            </td>
                            <td className="stat-cell approved">
                                {empleado.estadisticas?.permisos_otorgados || 0}
                            </td>
                            <td className="stat-cell rejected">
                                {empleado.estadisticas?.permisos_rechazados || 0}
                            </td>
                            <td className="stat-cell pending">
                                {empleado.estadisticas?.permisos_pendientes || 0}
                            </td>
                            <td className="stat-cell cancelado">
                                {empleado.estadisticas?.permisos_cancelados || 0}
                            </td>
                            <td className="stat-cell">
                                {empleado.estadisticas?.horas_permisos || 0}h
                            </td>
                            <td className="stat-cell">
                                {empleado.estadisticas?.dias_permisos || 0}d
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Paginador
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </>
    );

    return (
        <div className="modal-overlay">
            <div className="modal-employee">
                <div className="modal-header">
                    <h2>Informes y Estadísticas de Permisos</h2>
                    <button className="close-button" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                
                {/* Filtro de fechas */}
                <div className="filtro-fechas-container">
                    <div className="filtro-fechas-header">
                        <h3><FaCalendarAlt /> Filtro por Fechas</h3>
                        {filtroActivo && (
                            <div className="filtro-activo-badge">
                                <span>Filtro activo: {formatearFecha(fechaInicio)} - {formatearFecha(fechaFin)}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="filtro-fechas-controls">
                        <div className="fecha-input-group">
                            <label htmlFor="fecha-inicio">Fecha de Inicio:</label>
                            <input
                                type="date"
                                id="fecha-inicio"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                max={fechaFin || undefined}
                            />
                        </div>
                        
                        <div className="fecha-input-group">
                            <label htmlFor="fecha-fin">Fecha de Fin:</label>
                            <input
                                type="date"
                                id="fecha-fin"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                min={fechaInicio || undefined}
                            />
                        </div>
                        
                        <div className="filtro-buttons">
                            <button 
                                className="btn-aplicar-filtro"
                                onClick={aplicarFiltro}
                                disabled={!fechaInicio || !fechaFin}
                            >
                                <FaCheck /> Aplicar Filtro
                            </button>
                            
                            {filtroActivo && (
                                <button 
                                    className="btn-limpiar-filtro"
                                    onClick={limpiarFiltro}
                                >
                                    <FaTimes /> Limpiar Filtro
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs de navegación */}
                <div className="tabs-container">
                    <button 
                        className={`tab-button ${activeTab === 'generales' ? 'active' : ''}`}
                        onClick={() => setActiveTab('generales')}
                    >
                        <FaChartBar /> Estadísticas Generales
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'empleados' ? 'active' : ''}`}
                        onClick={() => setActiveTab('empleados')}
                    >
                        <FaUser /> Empleados
                    </button>
                </div>

                <div className="modal-content" style={{
                    flex: 1,
                    width: '100%',
                    overflow: 'auto',
                    padding: '20px'
                }}>
                    {loading ? (
                        <div className="loader">
                            <div className="justify-content-center jimu-primary-loading"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'generales' && estadisticasGenerales && renderEstadisticasGenerales()}
                            {activeTab === 'empleados' && (
                                informes.length === 0 ? (
                                    <div className="no-data-message">
                                        <p>No hay empleados disponibles</p>
                                    </div>
                                ) : renderTablaEmpleados()
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InformesAdmin;