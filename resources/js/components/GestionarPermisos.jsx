import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import { FaTimes, FaPaperPlane, FaTrash, FaDownload } from 'react-icons/fa';
import Paginador from './Paginador';
import Swal from 'sweetalert2';

const GestionarPermisos = (user) => {
    const [permisos, setPermisos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newPermiso, setNewPermiso] = useState({
        fecha_inicio: '',
        hora_inicio: '',
        fecha_fin: '',
        hora_fin: '',
        motivo: '',
        archivos: []
    });
    const [dragging, setDragging] = useState(false);
    const hasLoaded = useRef(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = permisos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(permisos.length / itemsPerPage);

    const userActual = user.user;
    
    useEffect(() => {
        if (hasLoaded.current) return;
        hasLoaded.current = true;

        const cargarPermisos = async () => {
            try {
                const response = await axiosInstance.get('/permisos/'+userActual.id, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                setPermisos(response.data.permisos);
            } catch (error) {
                console.error("Error al cargar los permisos", error);
            } finally {
                setLoading(false);
            }
        };

        if (userActual && userActual.id) {
            cargarPermisos();
        }
    }, [userActual]);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleFileChange = (e) => {
        handleFiles(e.target.files);
    };

    const handleFiles = (files) => {
        setNewPermiso(prev => ({
            ...prev,
            archivos: [...prev.archivos, ...Array.from(files)]
        }));
    };

    const removeFile = (indexToRemove) => {
        setNewPermiso(prev => ({
            ...prev,
            archivos: prev.archivos.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();


        // Validar que la fecha de inicio no sea mayor a la fecha actual
        const today = new Date();
        const fechaInicio = new Date(newPermiso.fecha_inicio);
        if (fechaInicio > today) {
            Swal.fire({
                title: 'Error',
                text: 'La fecha de inicio no puede ser mayor a la fecha actual',
                icon: 'error'
            });
        }

        if (newPermiso.fecha_inicio > newPermiso.fecha_fin) {
            Swal.fire({
                title: 'Error',
                text: 'La fecha de inicio no puede ser mayor a la fecha de fin',
                icon: 'error'
            });
        }
        
        // Validar que la fecha de fin no sea menor a la fecha de inicio
        if (newPermiso.fecha_fin < newPermiso.fecha_inicio) {
            Swal.fire({
                title: 'Error',
                text: 'La fecha de fin no puede ser menor a la fecha de inicio',
                icon: 'error'
            });
        }

        if (newPermiso.fecha_inicio === newPermiso.fecha_fin && newPermiso.hora_inicio > newPermiso.hora_fin) {
            Swal.fire({
                title: 'Error',
                text: 'La hora de inicio no puede ser mayor a la hora de fin',
                icon: 'error'
            });
        }

        // Validar que la hora de fin no sea menor a la hora de inicio
        if (newPermiso.hora_fin < newPermiso.hora_inicio) {
            Swal.fire({
                title: 'Error',
                text: 'La hora de fin no puede ser menor a la hora de inicio',
                icon: 'error'
            });
        }
        if (newPermiso.motivo.length < 10) {
            Swal.fire({
                title: 'Error',
                text: 'El motivo debe tener al menos 10 caracteres',
                icon: 'error'
            });
        }

        const formData = new FormData();
        formData.append('fecha_inicio', newPermiso.fecha_inicio);
        formData.append('hora_inicio', newPermiso.hora_inicio);
        formData.append('fecha_fin', newPermiso.fecha_fin);
        formData.append('hora_fin', newPermiso.hora_fin);
        formData.append('motivo', newPermiso.motivo);
        formData.append('user_id', userActual.id);
        newPermiso.archivos.forEach(file => {
            formData.append('archivos[]', file);
        });

        try {
            await axiosInstance.post('/permisos', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowModal(false);
            setNewPermiso({
                fecha_inicio: '',
                hora_inicio: '',
                fecha_fin: '',
                hora_fin: '',
                motivo: '',
                archivos: []
            });
            // Recargar permisos
            const response = await axiosInstance.get('/permisos/'+userActual.id);
            setPermisos(response.data.permisos);
        } catch (error) {
            console.error("Error al crear el permiso", error);
        }
    };

    const getFileIcon = (fileType) => {
        if (fileType.startsWith('image/')) return '🖼️';
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('document')) return '📝';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
        if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈';
        return '📎';
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const formatDate = (dateString) => {
        const [year, month, day] = dateString.split("-");
        const date = new Date(year, month - 1, day); // ¡Mes empieza desde 0!
        const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('es-CO', options); // Puedes usar 'es-CO' o tu idioma
    };
    
    
    // Formato de hora 24 horas
    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const hoursInt = parseInt(hours);
        const ampm = hoursInt >= 12 ? 'p.m.' : 'a.m.';
        const hours12 = hoursInt % 12 || 12;
        return `${hours12}:${minutes} ${ampm}`;
    }


    const handleEditarPermiso = (permiso) => {
        setShowModal(true);
        setNewPermiso({
            fecha_inicio: permiso.fecha_inicio,
            hora_inicio: permiso.hora_inicio,
            fecha_fin: permiso.fecha_fin,
            hora_fin: permiso.hora_fin,
            motivo: permiso.motivo,
            archivos: permiso.soportes.map(soporte => ({
                name: soporte.nombre,
                type: soporte.tipo,
                soporte: soporte.soporte,
                size: soporte.peso
            }))
        });
    }

    const estadoPermiso = (estado) => {
        if (estado === 'Pendiente') return <span className="estado-pendiente">Pendiente</span>;
        if (estado === 'Aprobado') return <span className="estado-aprobado">Aprobado</span>;
        if (estado === 'Rechazado') return <span className="estado-rechazado">Rechazado</span>;
    }

    const handleVerArchivo = (file) => {
        window.open(`/storage/soportes/${file.soporte}`, '_blank');
    }

    return (
        <>
            <div className="permisos-container">
                <div className="permisos-card">
                    <div className="permisos-header">
                        <h1>Gestionar Permisos</h1>
                        <button
                            className="btn-solicitar-permiso"
                            onClick={() => setShowModal(true)}
                            type="button"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Solicitar Permiso
                        </button>
                    </div>
                
                    <div className="permisos-table-container">
                        <table className="permisos-table">
                            <thead>
                                <tr>
                                    <th>Fecha Inicio</th>
                                    <th>Fecha Fin</th>
                                    <th>Motivo</th>
                                    <th>Archivos</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                            {currentItems.map((permiso) => (
                                <tr key={permiso.id}>
                                    <td className="fecha-cell" data-label="Fecha Inicio">
                                        {formatDate(permiso.fecha_inicio)}          
                                        {' - '}
                                        {formatTime(permiso.hora_inicio)}
                                    </td>
                                    <td className="fecha-cell" data-label="Fecha Fin">
                                        {formatDate(permiso.fecha_fin)}
                                        {' - '}
                                        {formatTime(permiso.hora_fin)}
                                    </td>
                                    <td className="motivo-cell" data-label="Motivo">
                                        {permiso.motivo}
                                    </td>
                                    <td className="archivos-cell" data-label="Archivos">
                                        {permiso.soportes && permiso.soportes.length > 0 ? (
                                            <div>
                                                {permiso.soportes.map((archivo, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => window.open(`/storage/soportes/${archivo.soporte}`, '_blank')}
                                                        className="archivo-link"
                                                    >
                                                        {archivo.nombre}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="sin-archivos">Sin soportes</span>
                                        )}
                                    </td>
                                    <td className="estado-cell" data-label="Estado">
                                        {estadoPermiso(permiso.estado)}
                                    </td>
                                    <td className="acciones-cell" data-label="Acciones">
                                        <div className="acciones-buttons">
                                            <button
                                                onClick={() => handleEditarPermiso(permiso)}
                                                className="btn-accion btn-editar"
                                            >
                                                ✏️ <span>Editar</span>
                                            </button>
                                            <button
                                                onClick={() => console.log('Eliminar permiso', permiso.id)}
                                                className="btn-accion btn-eliminar"
                                            >
                                                🗑️ <span>Eliminar</span>
                                            </button>
                                        </div>
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
                    </div>
                
                    {permisos.length === 0 && !loading && (
                        <div className="no-permisos">
                            <p>No hay permisos registrados</p>
                        </div>
                    )}
                </div>

                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-solicitar-permiso" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">Solicitar Nuevo Permiso</h2>
                                <button
                                    className="close-button"
                                    onClick={() => setShowModal(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label className="form-label" htmlFor="fecha_inicio">
                                                    Fecha de Inicio
                                                </label>
                                                <input
                                                    type="date"
                                                    id="fecha_inicio"
                                                    name="fecha_inicio"
                                                    className="form-input"
                                                    value={newPermiso.fecha_inicio}
                                                    onChange={(e) => setNewPermiso({ ...newPermiso, fecha_inicio: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" htmlFor="hora_inicio">
                                                    Hora de Inicio
                                                </label>
                                                <input
                                                    type="time"
                                                    id="hora_inicio"
                                                    name="hora_inicio"
                                                    className="form-input"
                                                    value={newPermiso.hora_inicio}
                                                    onChange={(e) => setNewPermiso({ ...newPermiso, hora_inicio: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label className="form-label" htmlFor="fecha_fin">
                                                    Fecha de Fin
                                                </label>
                                                <input
                                                    type="date"
                                                    id="fecha_fin"
                                                    name="fecha_fin"
                                                    className="form-input"
                                                    value={newPermiso.fecha_fin}
                                                    onChange={(e) => setNewPermiso({ ...newPermiso, fecha_fin: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" htmlFor="hora_fin">
                                                    Hora de Fin
                                                </label>
                                                <input
                                                    type="time"
                                                    id="hora_fin"
                                                    name="hora_fin"
                                                    className="form-input"
                                                    value={newPermiso.hora_fin}
                                                    onChange={(e) => setNewPermiso({ ...newPermiso, hora_fin: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="motivo">
                                            Motivo
                                        </label>
                                        <textarea
                                            id="motivo"
                                            name="motivo"
                                            className="form-input form-textarea"
                                            value={newPermiso.motivo}
                                            onChange={(e) => setNewPermiso({ ...newPermiso, motivo: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Archivos</label>
                                        <div
                                            className={`file-input-container ${dragging ? 'drag-active' : ''}`}
                                            onDragEnter={handleDragEnter}
                                            onDragLeave={handleDragLeave}
                                            onDragOver={handleDragOver}
                                            onDrop={handleDrop}
                                        >
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleFileChange}
                                                className="file-input"
                                            />
                                            <div className="file-input-label">
                                                <span className="file-input-icon">📤</span>
                                                <p>Arrastra y suelta archivos aquí, o haz clic para seleccionar</p>
                                            </div>
                                        </div>
                                        <div className="selected-files">
                                            {newPermiso.archivos.map((file, index) => (
                                                <div key={index} className="selected-file">
                                                    <div className="file-preview">
                                                        <div className="file-preview-icon">{getFileIcon(file.type)}</div>
                                                        <div className="file-info">
                                                            <span className="file-name">{file.name}</span>
                                                            <span className="file-size">{formatFileSize(file.size)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="file-actions">
                                                        <button type="button" className="view-file" onClick={() => handleVerArchivo(file)} title="Descargar archivo"><FaDownload/></button>
                                                        <button type="button" className="remove-file" onClick={() => removeFile(index)} title="Eliminar archivo"><FaTrash/></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-toolbar-solicitar-permiso">
                                    <button
                                        type="button"
                                        className="btn-cancelar"
                                        onClick={() => setShowModal(false)}
                                    >
                                        <FaTimes/> Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-enviar"
                                    >
                                     <FaPaperPlane/>  Enviar Solicitud
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default GestionarPermisos;