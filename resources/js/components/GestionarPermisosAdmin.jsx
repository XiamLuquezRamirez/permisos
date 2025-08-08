import React, { useState, useEffect } from 'react';
import {
    FaTimes, FaEye, FaCheck, FaTimes as FaReject,
    FaDownload, FaFile, FaImage, FaCalendar, FaClock,
    FaUser, FaFileAlt, FaComment, FaHandPaper, FaThumbsDown
} from 'react-icons/fa';
import axiosInstance from '../axiosConfig';
import Paginador from './Paginador';
import ChatReceptor from './ChatReceptor';
import { useUser } from './UserContext';
import Swal from 'sweetalert2';
import FileViewerModal from './FileViewerModal';

const GestionarPermisosAdmin = ({ onClose }) => {
    const [loading, setLoading] = useState(false);
    const [permisos, setPermisos] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [selectedPermiso, setSelectedPermiso] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [rechazoComentario, setRechazoComentario] = useState('');
    const [aprobarComentario, setAprobarComentario] = useState('');
    const [showRechazoModal, setShowRechazoModal] = useState(false);
    const [showAprobarModal, setShowAprobarModal] = useState(false);
    const [chatReceptor, setChatReceptor] = useState(null);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [showModalCancelar, setShowModalCancelar] = useState(false);
    const [itemsPerPage] = useState(5);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = permisos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(permisos.length / itemsPerPage);
    const { user } = useUser();
    const emisor = user.user_id_chat;
    const [selectedFile, setSelectedFile] = useState(null);

    const cargarPermisos = async () => {
        setLoading(true);
        const response = await axiosInstance.get('/permisosTodos');
        setPermisos(response.data.permisos);
        setLoading(false);
    }

    useEffect(() => {
        cargarPermisos();
    }, []);

    const estadoPermiso = (permiso) => {
        if (permiso.estado === 'Pendiente') return <span className="estado-pendiente"> <FaClock /> {' '} Pendiente</span>;
        if (permiso.estado === 'Aprobado') return <span className="estado-aprobado"> <FaCheck /> {' '} Aprobado</span>;
        if (permiso.estado === 'Rechazado') return <span className="estado-rechazado"> <FaThumbsDown /> {' '} Rechazado</span>;
        if (permiso.estado === 'Cancelado') return <span onClick={() => handleVerCancelar(permiso)} className="estado-cancelado"> <FaTimes /> {' '} Cancelado</span>;
    }

    const formatDate = (dateString) => {
        const [year, month, day] = dateString.split("-");
        const date = new Date(year, month - 1, day);
        const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('es-CO', options);
    };

    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const hoursInt = parseInt(hours);
        const ampm = hoursInt >= 12 ? 'p.m.' : 'a.m.';
        const hours12 = hoursInt % 12 || 12;
        return `${hours12}:${minutes} ${ampm}`;
    }

    const handleVerPermiso = (permiso) => {
        // Resetear todos los modales antes de abrir el modal principal
        setShowAprobarModal(false);
        setShowRechazoModal(false);
        setShowModalCancelar(false);
        setSelectedPermiso(permiso);
        setShowModal(true);
    }

    const handleVerCancelar = (permiso) => {
        // Resetear otros modales
        setShowAprobarModal(false);
        setShowRechazoModal(false);
        setShowModal(false);
        setSelectedPermiso(permiso);
        setShowModalCancelar(true);
    }

    const handleCloseModals = () => {
        setShowAprobarModal(false);
        setShowRechazoModal(false);
        setShowModalCancelar(false);
        setSelectedPermiso(null);
        setAprobarComentario('');
        setRechazoComentario('');
    }

    const handleRechazarClick = () => {
        // Asegurar que solo se abra el modal de rechazo
        setShowAprobarModal(false);
        setShowRechazoModal(true);
    }

    const handleAprobarClick = () => {
        // Asegurar que solo se abra el modal de aprobar
        setShowRechazoModal(false);
        setShowAprobarModal(true);
    }

    const handleChat = async (id) => {
        const permiso = await axiosInstance.get(`/obtenerPermiso/${id}`);
        setChatReceptor(permiso.data.idReceptor);
        setIsChatModalOpen(true);
    }

    const handleAprobarPermiso = async () => {
        if (!selectedPermiso) return;

        setActionLoading(true);
        try {
            await axiosInstance.post('/aprobarPermiso', {
                id_permiso: selectedPermiso.id,
                comentario: aprobarComentario || 'Permiso aprobado por el administrador'
            });

            Swal.fire({
                title: 'Permiso aprobado',
                text: 'El permiso ha sido aprobado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });

            await cargarPermisos();
            setShowModal(false);
            setShowAprobarModal(false);
            setSelectedPermiso(null);
        } catch (error) {
            console.error('Error al aprobar permiso:', error);
        } finally {
            setActionLoading(false);
        }
    }

    const handleRechazarPermiso = async () => {
        if (!selectedPermiso || !rechazoComentario.trim()) return;

        setActionLoading(true);
        try {
            await axiosInstance.post('/rechazarPermiso', {
                id_permiso: selectedPermiso.id,
                comentario: rechazoComentario
            });

            Swal.fire({
                title: 'Permiso rechazado',
                text: 'El permiso ha sido rechazado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });

            await cargarPermisos();
            setShowModal(false);
            setShowRechazoModal(false);
            setSelectedPermiso(null);
            setRechazoComentario('');
        } catch (error) {
            console.error('Error al rechazar permiso:', error);
        } finally {
            setActionLoading(false);
        }
    }

    const handleFileClick = (soporte) => {
        setSelectedFile({
            ruta: soporte.soporte,
            nombre: soporte.nombre,
            tipo: soporte.tipo
        });
    };

    const handleCloseFileViewer = () => {
        setSelectedFile(null);
    };

    const getFileIcon = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
            return <FaImage className="file-icon image" />;
        }
        return <FaFile className="file-icon document" />;
    }

    const downloadFile = (soporte, nombre) => {
        const link = document.createElement('a');
        link.href = `/storage/soportes/${soporte}`;
        link.download = nombre;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <>
        <div className="modal-overlay">
            <div className="modal-employee">
                <div className="modal-header">
                    <h2>Gestionar Permisos Admin</h2>
                    <button className="close-button" onClick={onClose}>
                        <FaTimes />
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
                    ) : permisos.length === 0 ? (
                        <div className="no-data-message">
                            <p>No hay permisos disponibles</p>
                        </div>
                    ) : (
                        <>
                            <table className="employee-table" style={{
                                width: '100%',
                                tableLayout: 'fixed',
                                borderCollapse: 'collapse'
                            }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '5%' }}>Foto</th>
                                        <th style={{ width: '25%' }}>Nombre</th>
                                        <th style={{ width: '20%' }}>Fecha de Solicitud</th>
                                        <th style={{ width: '25%' }}>Fecha de Permiso</th>
                                        <th style={{ width: '10%' }}>Estado</th>
                                        <th style={{ width: '15%' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map(permiso => (
                                        <tr key={permiso.id}>
                                            <td>
                                                <img
                                                    src={permiso.foto}
                                                    alt={permiso.nombres}
                                                    className="employee-mini-photo"
                                                />
                                            </td>
                                            <td style={{ textTransform: 'capitalize' }}>{permiso.nombres} {permiso.apellidos}</td>
                                            <td>{formatDate(permiso.fecha_solicitud)}</td>
                                            <td>{formatDate(permiso.fecha_inicio)}
                                                {' - '}
                                                {formatTime(permiso.hora_fin)}</td>
                                            <td>{estadoPermiso(permiso)}</td>
                                            <td>
                                                <button className="ver-permiso" onClick={() => handleVerPermiso(permiso)}>
                                                    <FaEye />
                                                </button>
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
                    )}
                </div>
            </div>

            {/* Modal de Detalles del Permiso */}
            {showModal && selectedPermiso && (
                <div className="modal-overlay permiso-details-modal">
                    <div className="modal-employee permiso-details-container">
                        <div className="modal-header">
                            <h2>Detalles del Permiso</h2>
                            <button className="close-button" onClick={() => {
                                setShowModal(false);
                                setSelectedPermiso(null);
                            }}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="permiso-details-content">
                            {/* Información del Empleado */}
                            <div className="info-section empleado-section">
                                <div className="section-header">
                                    <FaUser className="section-icon" />
                                    <h3>Información del Empleado</h3>
                                </div>
                                <div className="empleado-info">
                                    <img
                                        src={selectedPermiso.foto}
                                        alt={selectedPermiso.nombres}
                                        className="empleado-photo-large"
                                    />
                                    <div className="empleado-details">
                                        <h4>{selectedPermiso.nombres} {selectedPermiso.apellidos}</h4>
                                        <div className='detalles-empleado'>
                                            <p><strong>Cargo:</strong> {selectedPermiso.cargo}</p>
                                            <p><strong>Empresa:</strong> {selectedPermiso.empresa}</p>
                                        </div>
                                        
                                    </div>
                                  
                                    <div className="observation-actions">
                                        <button className="chat-button" title="Chat" onClick={() => handleChat(selectedPermiso.id)}>
                                            <FaComment /> Enviar mensaje
                                        </button>
                                    </div>
                                
                                </div>
                            </div>

                            {/* Detalles del Permiso */}
                            <div className="info-section permiso-section">
                                <div className="section-header">
                                    <FaCalendar className="section-icon" />
                                    <h3>Detalles del Permiso</h3>
                                </div>
                                <div className="permiso-details-grid">
                                    <div className="detail-item">
                                        <label>Fecha de Solicitud:</label>
                                        <span>{formatDate(selectedPermiso.fecha_solicitud)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Fecha de Inicio:</label>
                                        <span>{formatDate(selectedPermiso.fecha_inicio)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Hora de Inicio:</label>
                                        <span>{formatTime(selectedPermiso.hora_inicio)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Fecha de Fin:</label>
                                        <span>{formatDate(selectedPermiso.fecha_fin)}</span>
                                    </div>

                                    <div className="detail-item">
                                        <label>Hora de Fin:</label>
                                        <span>{formatTime(selectedPermiso.hora_fin)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Estado:</label>
                                        <span className={`estado-badge ${selectedPermiso.estado.toLowerCase()}`}>
                                            {selectedPermiso.estado}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Motivo del Permiso */}
                            <div className="info-section motivo-section">
                                <div className="section-header">
                                    <FaFileAlt className="section-icon" />
                                    <h3>Motivo del Permiso</h3>
                                </div>
                                <div className="motivo-content">
                                    <p>{selectedPermiso.motivo}</p>
                                </div>
                            </div>

                            {/* Archivos de Soporte */}
                            {selectedPermiso.soportes && selectedPermiso.soportes.length > 0 && (
                                <div className="info-section soportes-section">
                                    <div className="section-header">
                                        <FaFile className="section-icon" />
                                        <h3>Archivos de Soporte ({selectedPermiso.soportes.length})</h3>
                                    </div>
                                    <div className="soportes-grid">
                                        {selectedPermiso.soportes.map((soporte, index) => (
                                            <div key={soporte.id} className="soporte-item">
                                                <div className="soporte-icon">
                                                    {getFileIcon(soporte.nombre)}
                                                </div>
                                                <div className="soporte-info">
                                                    <p className="soporte-nombre">{soporte.nombre}</p>
                                                    <p className="soporte-tamaño">{(soporte.peso / 1024).toFixed(2)} KB</p>
                                                </div>
                                                <button
                                                    className="download-btn"
                                                    onClick={() => handleFileClick(soporte)}
                                                >
                                                    <FaDownload />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Comentario del Administrador */}
                            {selectedPermiso.comentario_admin && (
                                <div className="info-section comentario-section">
                                    <div className="section-header">
                                        <FaFileAlt className="section-icon" />
                                        <h3>Comentario del Administrador</h3>
                                    </div>
                                    <div className="comentario-content">
                                        <p>{selectedPermiso.comentario_admin}</p>
                                        {selectedPermiso.fecha_decision && (
                                            <small>Decidido el: {formatDate(selectedPermiso.fecha_decision)}</small>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Acciones del Administrador */}
                            {selectedPermiso.estado === 'Pendiente' && (
                                <div className="info-section acciones-section">
                                    <div className="section-header">
                                        <FaCheck className="section-icon" />
                                        <h3>Acciones del Administrador</h3>
                                    </div>
                                    <div className="acciones-buttons">
                                        <button
                                            className="btn-aprobar"
                                            onClick={handleAprobarClick}
                                            disabled={actionLoading}
                                        >
                                            <FaCheck />
                                            {actionLoading ? 'Procesando...' : 'Aprobar Permiso'}
                                        </button>
                                        <button
                                            className="btn-rechazar"
                                            onClick={handleRechazarClick}
                                            disabled={actionLoading}
                                        >
                                            <FaReject />
                                            {actionLoading ? 'Procesando...' : 'Rechazar Permiso'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {selectedPermiso.estado === 'Aprobado' && (
                                <div className="info-section acciones-section">
                                    <div className="section-header">
                                        <FaCheck className="section-icon" />
                                        <h3>Acciones del Administrador</h3>
                                    </div>
                                    <div className="acciones-buttons">
                                        <button
                                            className="btn-rechazar"
                                            onClick={handleRechazarClick}
                                            disabled={actionLoading}
                                        >
                                            <FaReject />
                                            {actionLoading ? 'Procesando...' : 'Rechazar Permiso'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {selectedPermiso.estado === 'Rechazado' && (
                                <div className="info-section acciones-section">
                                    <div className="section-header">
                                        <FaCheck className="section-icon" />
                                        <h3>Acciones del Administrador</h3>
                                    </div>
                                    <div className="acciones-buttons">
                                        <button
                                            className="btn-aprobar"
                                            onClick={handleAprobarClick}
                                            disabled={actionLoading}
                                        >
                                            <FaCheck />
                                            {actionLoading ? 'Procesando...' : 'Aprobar Permiso'}
                                        </button>

                                    </div>
                                </div>
                            )}


                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Aprobar Permiso */}
            {showAprobarModal && !showRechazoModal && selectedPermiso && (selectedPermiso.estado === 'Pendiente' || selectedPermiso.estado === 'Rechazado') && (
                <div className="modal-overlay aprobar-modal">
                    <div className="modal-aprobar aprobar-container">
                        <div className="modal-header">
                            <h2>Aprobar Permiso</h2>
                            <button className="close-button" onClick={handleCloseModals}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="aprobar-content">
                            <div className="aprobar-message">
                                <FaCheck className="aprobar-icon" />
                                <h3>¿Estás seguro de aprobar este permiso?</h3>
                                <p>Esta acción no se puede deshacer. El empleado será notificado del aprobado.</p>
                            </div>

                            <div className="comentario-section">
                                <label htmlFor="aprobar-comentario">Comentario de Aprobar (Mínimo 10 caracteres):</label>
                                <textarea
                                    id="aprobar-comentario"
                                    value={aprobarComentario}
                                    onChange={(e) => setAprobarComentario(e.target.value)}
                                    placeholder="Explica el motivo del aprobado..."
                                    rows="4"
                                />

                            </div>

                            <div className="rechazo-actions">
                                <button
                                    className="btn-cancelar"
                                    onClick={handleCloseModals}
                                    disabled={actionLoading}
                                >
                                    <FaTimes />
                                    Cancelar
                                </button>
                                <button
                                    className="btn-confirmar-aprobar"
                                    onClick={handleAprobarPermiso}
                                    disabled={actionLoading}
                                >
                                    <FaCheck />
                                    {actionLoading ? 'Procesando...' : 'Confirmar Aprobar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de Rechazo */}
            {showRechazoModal && !showAprobarModal && selectedPermiso && (selectedPermiso.estado === 'Pendiente' || selectedPermiso.estado === 'Aprobado') && (
                <div className="modal-overlay rechazo-modal">
                    <div className="modal-rechazo rechazo-container">
                        <div className="modal-header">
                            <h2>Rechazar Permiso</h2>
                            <button className="close-button" onClick={handleCloseModals}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="rechazo-content">
                            <div className="warning-message">
                                <FaReject className="warning-icon" />
                                <h3>¿Estás seguro de rechazar este permiso?</h3>
                                <p>Esta acción no se puede deshacer. El empleado será notificado del rechazo.</p>
                            </div>

                            <div className="comentario-section">
                                <label htmlFor="rechazo-comentario">Comentario de Rechazo (Mínimo 10 caracteres):</label>
                                <textarea
                                    id="rechazo-comentario"
                                    value={rechazoComentario}
                                    onChange={(e) => setRechazoComentario(e.target.value)}
                                    placeholder="Explica el motivo del rechazo..."
                                    rows="4"
                                />

                            </div>

                            <div className="rechazo-actions">
                                <button
                                    className="btn-cancelar"
                                    onClick={handleCloseModals}
                                    disabled={actionLoading}
                                >
                                    <FaTimes />
                                    Cancelar
                                </button>
                                <button
                                    className="btn-confirmar-rechazo"
                                    onClick={handleRechazarPermiso}
                                    disabled={actionLoading}
                                >
                                    <FaCheck />
                                    {actionLoading ? 'Procesando...' : 'Confirmar Rechazo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de ver cancelacion de permiso */}
            {showModalCancelar && (
                <div className="modal-overlay cancelar-modal">
                    <div className="modal-cancelar cancelar-container">
                        <div className="modal-header">
                            <h2>Permiso cancelado</h2>
                            <button className="close-button" onClick={() => setShowModalCancelar(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="cancelar-content">
                            <div className='fecha-cancelacion'>
                                <label htmlFor="fecha-cancelacion">Fecha de Cancelación:</label>
                                <p>{formatDate(selectedPermiso.fecha_cancelacion)}</p>
                            </div>
                            <div className="comentario-section">
                                <label htmlFor="cancelar-comentario">Comentario de Cancelación:</label>
                                <p>{selectedPermiso.motivo_cancelar}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de chat */}
            {isChatModalOpen && (
                <ChatReceptor receptor={chatReceptor} emisor={emisor} onClose={() => setIsChatModalOpen(false)} />
            )}

            
         

        </div>
               {/* Modal de visualización de archivos (independiente) */}
               {selectedFile && (
                <div className="modal-overlay" style={{ zIndex: 1070 }}>
                    <FileViewerModal
                        isOpen={!!selectedFile}
                        onClose={handleCloseFileViewer}
                        fileUrl={selectedFile?.ruta}
                        fileName={selectedFile?.nombre}
                        fileType={selectedFile?.tipo}
                    />
                </div>
            )}
        </>
    )
}

export default GestionarPermisosAdmin;  