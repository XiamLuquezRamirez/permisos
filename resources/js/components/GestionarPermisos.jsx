import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import { FaTimes, FaPaperPlane, FaTrash, 
    FaDownload, FaComment, FaCheck, FaThumbsDown, FaClock } from 'react-icons/fa';
import Paginador from './Paginador';
import AdminInterface from './AdminInterface';
import Swal from 'sweetalert2';
import ChatReceptor from './ChatReceptor';
import FileViewerModal from './FileViewerModal';

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
        archivos: [],
        accion: 'guardar'
    });



    const [dragging, setDragging] = useState(false);
    const hasLoaded = useRef(false);
    const [showRechazoModal, setShowRechazoModal] = useState(false);
    const [selectedPermiso, setSelectedPermiso] = useState(null);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [chatReceptor, setChatReceptor] = useState(null);
    const [isIframeLoading, setIsIframeLoading] = useState(true);
    const [showCancelarModal, setShowCancelarModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showSoportesModal, setShowSoportesModal] = useState(false);
    const [selectedPermisoSoportes, setSelectedPermisoSoportes] = useState(null);
    const [newSoportes, setNewSoportes] = useState([]);
    const [isUploadingSoportes, setIsUploadingSoportes] = useState(false);
    const chatUser = user.user_id_chat;
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = permisos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(permisos.length / itemsPerPage);

    const userActual = user.user;
    const emisor = userActual.user_id_chat;

    useEffect(() => {
        if (hasLoaded.current) return;
        hasLoaded.current = true;

        const cargarPermisos = async () => {
            try {
                const response = await axiosInstance.get('/permisos/' + userActual.id, {
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

    const handleCloseFileViewer = () => {
        setSelectedFile(null);
    };

    const handleFileClick = (soporte) => {
        setSelectedFile({
            ruta: soporte.soporte,
            nombre: soporte.nombre,
            tipo: soporte.tipo
        });

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

    const handleChat = async (observationId) => {
        //conmsultar en la base de datos de la tarea el id del empleado que realizo la observacion
        const observation = await axiosInstance.get(`/obtenerPermisoUser/${observationId}`);
        console.log(observation);
        setChatReceptor(observation.data.idReceptor);
        setIsChatModalOpen(true);
    };

    const removeFile = (indexToRemove) => {

        const idArchivo = newPermiso.archivos[indexToRemove].id;

        Swal.fire({
            title: '¿Estás seguro?',
            text: '¿Deseas eliminar este archivo?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
            if (result.isConfirmed) {
                setNewPermiso(prev => ({
                    ...prev,
                    archivos: prev.archivos.filter((_, index) => index !== indexToRemove)
                }));

                //eliminar archivo del backend
                axiosInstance.post('/eliminarArchivo', {
                    id_permiso: newPermiso.id_permiso,
                    id_archivo: idArchivo
                });

                Swal.fire({
                    title: 'Archivo eliminado',
                    text: 'El archivo ha sido eliminado correctamente',
                    icon: 'success'
                });
            }
        });


        setNewPermiso(prev => ({
            ...prev,
            archivos: prev.archivos.filter((_, index) => index !== indexToRemove)
        }));



    };

    const handleSubmit = async (e) => {
        e.preventDefault();


        // Validar que la fecha de inicio no sea mayor a la fecha actual
        const today = new Date();
        const fechaFinal = new Date(`${newPermiso.fecha_fin}T${newPermiso.hora_fin}`);

        if (fechaFinal < today) {
            Swal.fire({
                title: 'Error',
                text: 'La fecha de fin no puede ser mayor a la fecha actual',
                icon: 'error'
            });
            return;
        }

        if (newPermiso.fecha_inicio > newPermiso.fecha_fin) {
            Swal.fire({
                title: 'Error',
                text: 'La fecha de inicio no puede ser mayor a la fecha de fin',
                icon: 'error'
            });
            return;
        }

        // Validar que la fecha de fin no sea menor a la fecha de inicio
        if (newPermiso.fecha_fin < newPermiso.fecha_inicio) {
            Swal.fire({
                title: 'Error',
                text: 'La fecha de fin no puede ser menor a la fecha de inicio',
                icon: 'error'
            });
            return;
        }

        if (newPermiso.fecha_inicio === newPermiso.fecha_fin && newPermiso.hora_inicio > newPermiso.hora_fin) {
            Swal.fire({
                title: 'Error',
                text: 'La hora de inicio no puede ser mayor a la hora de fin',
                icon: 'error'
            });
            return;
        }

        // Validar que la hora de fin no sea menor a la hora de inicio
        if (newPermiso.hora_fin < newPermiso.hora_inicio) {
            Swal.fire({
                title: 'Error',
                text: 'La hora de fin no puede ser menor a la hora de inicio',
                icon: 'error'
            });
            return;
        }
        if (newPermiso.motivo.length < 10) {
            Swal.fire({
                title: 'Error',
                text: 'El motivo debe tener al menos 10 caracteres',
                icon: 'error'
            });
            return;
        }

        setIsUploading(true);


        const formData = new FormData();
        formData.append('fecha_inicio', newPermiso.fecha_inicio);
        formData.append('hora_inicio', newPermiso.hora_inicio);
        formData.append('fecha_fin', newPermiso.fecha_fin);
        formData.append('hora_fin', newPermiso.hora_fin);
        formData.append('motivo', newPermiso.motivo);
        formData.append('user_id', userActual.id);
        formData.append('accion', newPermiso.accion);
        formData.append('id_permiso', newPermiso.id_permiso);
        newPermiso.archivos.forEach(file => {
            formData.append('archivos[]', file);
        });

        try {
            await axiosInstance.post('/guardarPermiso', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (newPermiso.accion == 'editar') {
                Swal.fire({
                    title: 'Permiso actualizado',
                    text: 'El permiso ha sido actualizado correctamente',
                    icon: 'success'
                });
            } else {
                Swal.fire({
                    title: 'Permiso creado',
                    text: 'El permiso ha sido creado correctamente',
                    icon: 'success'
                });
            }
            setIsUploading(false);
            setShowModal(false);
            setNewPermiso({
                fecha_inicio: '',
                hora_inicio: '',
                fecha_fin: '',
                hora_fin: '',
                motivo: '',
                archivos: [],
                accion: 'guardar'
            });
            // Recargar permisos
            const response = await axiosInstance.get('/permisos/' + userActual.id);
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

    const handleEliminarPermiso = async (id) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: '¿Deseas eliminar este permiso?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                await axiosInstance.post('/eliminarPermiso', { id: id });
                Swal.fire({
                    title: 'Permiso eliminado',
                    text: 'El permiso ha sido eliminado correctamente',
                    icon: 'success'
                });
                //recargar permisos
                const response = await axiosInstance.get('/permisos/' + userActual.id);
                setPermisos(response.data.permisos);
            }
        });
    }
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

    // Función para calcular horas totales de permisos
    const calcularHorasPermisos = () => {
        return permisos.reduce((total, permiso) => {
            if (permiso.estado === 'Aprobado') {
                const fechaInicio = new Date(`${permiso.fecha_inicio}T${permiso.hora_inicio}`);
                const fechaFin = new Date(`${permiso.fecha_fin}T${permiso.hora_fin}`);
                const diferenciaMs = fechaFin - fechaInicio;
                const horas = diferenciaMs / (1000 * 60 * 60);
                return total + horas;
            }
            return total;
        }, 0);
    };

    // Función para formatear horas en formato legible
    const formatearHoras = (horas) => {
        if (horas < 1) {
            const minutos = Math.round(horas * 60);
            return `${minutos} min`;
        } else if (horas < 24) {
            const horasEnteras = Math.floor(horas);
            const minutos = Math.round((horas - horasEnteras) * 60);
            return `${horasEnteras}h ${minutos}min`;
        } else {
            const dias = Math.floor(horas / 24);
            const horasRestantes = horas % 24;
            const horasEnteras = Math.floor(horasRestantes);
            const minutos = Math.round((horasRestantes - horasEnteras) * 60);
            return `${dias}d ${horasEnteras}h ${minutos}min`;
        }
    };

    // Contadores por estado
    const permisosPendientes = permisos.filter(p => p.estado === 'Pendiente').length;
    const permisosAprobados = permisos.filter(p => p.estado === 'Aprobado').length;
    const permisosRechazados = permisos.filter(p => p.estado === 'Rechazado').length;

    const handleEditarPermiso = (permiso) => {
        setShowModal(true);
        setNewPermiso({
            fecha_inicio: permiso.fecha_inicio,
            hora_inicio: permiso.hora_inicio,
            fecha_fin: permiso.fecha_fin,
            hora_fin: permiso.hora_fin,
            motivo: permiso.motivo,
            accion: 'editar',
            id_permiso: permiso.id,
            archivos: permiso.soportes.map(soporte => ({
                name: soporte.nombre,
                type: soporte.tipo,
                soporte: soporte.soporte,
                size: soporte.peso,
                id: soporte.id
            }))
        });

    }

    const handleVerRechazo = (permiso) => {
        setShowRechazoModal(true);
        setSelectedPermiso(permiso);
    }

    const estadoPermiso = (permiso) => {
        if (permiso.estado === 'Pendiente') return <span onClick={() => handleVerCancelar(permiso)} className="estado-pendiente"> <FaClock /> {' '} Pendiente</span>;
        if (permiso.estado === 'Aprobado') return <span onClick={() => handleVerCancelar(permiso)} className="estado-aprobado"> <FaCheck /> {' '} Aprobado</span>;
        if (permiso.estado === 'Rechazado') return <span onClick={() => handleVerRechazo(permiso)} className="estado-rechazado"> <FaThumbsDown /> {' '} Rechazado</span>;
        if (permiso.estado === 'Cancelado') return <span className="estado-cancelado"> <FaTimes /> {' '} Cancelado</span>;
    }

    const handleVerCancelar = (permiso) => {
        setShowCancelarModal(true);
        setSelectedPermiso(permiso);
        // Resetear el motivo de cancelación
        setNewPermiso(prev => ({
            ...prev,
            motivo_cancelar: ''
        }));
    }

    const handleVerArchivo = (file) => {
        // Si es un archivo existente del backend (tiene propiedad soporte)
        if (file.soporte) {
            window.open(`/storage/soportes/${file.soporte}`, '_blank');
        }
        // Si es un archivo nuevo del navegador (es un objeto File)
        else if (file instanceof File) {
            const url = URL.createObjectURL(file);
            window.open(url, '_blank');
            // Limpiar la URL después de un tiempo para liberar memoria
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    }

    if (userActual.gestor_permisos === 'Si') {
        return (
            <AdminInterface user={userActual} />
        )
    }

    const handleCancelarPermiso = async (id) => {
        if (newPermiso.motivo_cancelar.length < 10) {
            Swal.fire({
                title: 'Error',
                text: 'El motivo de cancelación debe tener al menos 10 caracteres',
                icon: 'error'
            });
            return;
        }
        const formData = new FormData();
        formData.append('id', id);
        formData.append('motivo_cancelar', newPermiso.motivo_cancelar);
        formData.append('user_id', userActual.id);
        await axiosInstance.post('/cancelarPermiso', formData);
        Swal.fire({
            title: 'Permiso cancelado',
            text: 'El permiso ha sido cancelado correctamente',
            icon: 'success'
        });
        // Recargar permisos
        const response = await axiosInstance.get('/permisos/' + userActual.id);
        setPermisos(response.data.permisos);
        setShowCancelarModal(false);
        setNewPermiso({
            motivo_cancelar: ''
        });
    }

    const handleVerSoportes = (permiso) => {
        setSelectedPermisoSoportes(permiso);
        setNewSoportes([]);
        setShowSoportesModal(true);
    };

    const handleSoportesFileChange = (e) => {
        const files = Array.from(e.target.files);
        setNewSoportes(prev => [...prev, ...files]);
    };

    const handleSoportesDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    };

    const handleSoportesDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
    };

    const handleSoportesDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleSoportesDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files);
        setNewSoportes(prev => [...prev, ...files]);
    };

    const removeSoporte = (indexToRemove) => {
        setNewSoportes(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const removeExistingSoporte = async (soporteId) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: '¿Deseas eliminar este soporte?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axiosInstance.post('/eliminarArchivo', {
                        id_permiso: selectedPermisoSoportes.id,
                        id_archivo: soporteId
                    });
                    
                    // Actualizar la lista de soportes en el estado local
                    setSelectedPermisoSoportes(prev => ({
                        ...prev,
                        soportes: prev.soportes.filter(soporte => soporte.id !== soporteId)
                    }));

                    // Actualizar también en la lista principal de permisos
                    setPermisos(prev => prev.map(permiso => 
                        permiso.id === selectedPermisoSoportes.id 
                            ? { ...permiso, soportes: permiso.soportes.filter(soporte => soporte.id !== soporteId) }
                            : permiso
                    ));

                    Swal.fire({
                        title: 'Soporte eliminado',
                        text: 'El soporte ha sido eliminado correctamente',
                        icon: 'success'
                    });
                } catch (error) {
                    console.error('Error al eliminar soporte:', error);
                    Swal.fire({
                        title: 'Error',
                        text: 'No se pudo eliminar el soporte',
                        icon: 'error'
                    });
                }
            }
        });
    };

    const handleGuardarSoportes = async () => {
        if (newSoportes.length === 0) {
            setShowSoportesModal(false);
            return;
        }

        setIsUploadingSoportes(true);
        const formData = new FormData();
        formData.append('id_permiso', selectedPermisoSoportes.id);
        newSoportes.forEach(file => {
            formData.append('archivos[]', file);
        });

        try {
            await axiosInstance.post('/agregarSoportes', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            Swal.fire({
                title: 'Soportes agregados',
                text: 'Los soportes han sido agregados correctamente',
                icon: 'success'
            });

            // Recargar permisos para obtener los nuevos soportes
            const response = await axiosInstance.get('/permisos/' + userActual.id);
            setPermisos(response.data.permisos);
            
            // Actualizar el permiso seleccionado con los nuevos datos
            const updatedPermiso = response.data.permisos.find(p => p.id === selectedPermisoSoportes.id);
            setSelectedPermisoSoportes(updatedPermiso);

            setNewSoportes([]);
            setShowSoportesModal(false);
        } catch (error) {
            console.error('Error al agregar soportes:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudieron agregar los soportes',
                icon: 'error'
            });
        } finally {
            setIsUploadingSoportes(false);
        }
    };

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

                    <div className='indicadores-permisos'>
                        <div className='indicador-card total-permisos'>
                            <div className='indicador-icon'>📊</div>
                            <div className='indicador-content'>
                                <h3>{permisos.length}</h3>
                                <p>Total de Permisos</p>
                            </div>
                        </div>

                        <div className='indicador-card horas-permisos'>
                            <div className='indicador-icon'>⏰</div>
                            <div className='indicador-content'>
                                <h3>{formatearHoras(calcularHorasPermisos())}</h3>
                                <p>Horas Solicitadas</p>
                            </div>
                        </div>

                        <div className='indicador-card permisos-pendientes'>
                            <div className='indicador-icon'>⏳</div>
                            <div className='indicador-content'>
                                <h3>{permisosPendientes}</h3>
                                <p>Pendientes</p>
                            </div>
                        </div>

                        <div className='indicador-card permisos-aprobados'>
                            <div className='indicador-icon'>✅</div>
                            <div className='indicador-content'>
                                <h3>{permisosAprobados}</h3>
                                <p>Aprobados</p>
                            </div>
                        </div>

                        <div className='indicador-card permisos-rechazados'>
                            <div className='indicador-icon'>❌</div>
                            <div className='indicador-content'>
                                <h3>{permisosRechazados}</h3>
                                <p>Rechazados</p>
                            </div>
                        </div>
                    </div>

                    <div className="permisos-table-container">
                        <table className="permisos-table">
                            <thead>
                                <tr>
                                    <th>Fecha Inicio</th>
                                    <th>Fecha Fin</th>
                                    <th>Motivo</th>
                                    <th>Soporte</th>
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
                                            <button
                                                onClick={() => handleVerSoportes(permiso)}
                                                className="btn-soportes"
                                                title="Ver soportes"
                                            >
                                                📎 Soportes ({permiso.soportes ? permiso.soportes.length : 0})
                                            </button>
                                        </td>
                                        <td className="estado-cell" data-label="Estado">
                                            {estadoPermiso(permiso)}
                                        </td>
                                        <td className="acciones-cell" data-label="Acciones">
                                            <div className="acciones-buttons">
                                                <button
                                                    onClick={() => handleEditarPermiso(permiso)}
                                                    className={`btn-accion btn-editar ${permiso.estado === 'Rechazado' || permiso.estado === 'Aprobado' || permiso.estado === 'Cancelado' ? 'disabled' : ''}`}
                                                >
                                                    ✏️ <span>Editar</span>
                                                </button>
                                                <button
                                                    onClick={() => handleEliminarPermiso(permiso.id)}
                                                    className={`btn-accion btn-eliminar ${permiso.estado === 'Rechazado' || permiso.estado === 'Aprobado' || permiso.estado === 'Cancelado' ? 'disabled' : ''}`}
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
                    <>
                        {isUploading && (
                            <div className="loader">
                                <div className="justify-content-center jimu-primary-loading"></div>
                            </div>
                        )}
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
                                                    <div key={index} id={file.id} className="selected-file">
                                                        <div className="file-preview">
                                                            <div className="file-preview-icon">{getFileIcon(file.type)}</div>
                                                            <div className="file-info">
                                                                <span className="file-name">{file.name}</span>
                                                                <span className="file-size">{formatFileSize(file.size)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="file-actions">
                                                            <button type="button" className="view-file" onClick={() => handleVerArchivo(file)} title="Descargar archivo"><FaDownload /></button>
                                                            <button type="button" className="remove-file" onClick={() => removeFile(index)} title="Eliminar archivo"><FaTrash /></button>
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
                                            <FaTimes /> Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-enviar"
                                        >
                                            <FaPaperPlane />  Enviar Solicitud
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </>
                )}



                {/* Modal de ver estado del permiso rechazado con comentario */}
                {showRechazoModal && (
                    <>

                        <div className="modal-overlay" onClick={() => setShowRechazoModal(false)}>
                            <div className="modal-respuesta-rechazo" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2 className="modal-title">Permiso rechazado </h2>
                                    <button
                                        className="close-button"
                                        onClick={() => setShowRechazoModal(false)}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="modal-body rechazo-container">
                                    <p className="rechazo-title">El permiso ha sido rechazado por el administrador.</p>
                                    <p className="rechazo-fecha">Fecha de rechazo: {formatDate(selectedPermiso.fecha_decision)}</p>
                                    <div className="rechazo-comentario-container">
                                        <p className="rechazo-comentario">Comentario: {selectedPermiso.comentario}</p>
                                    </div>
                                </div>
                                <div className='detalles-rechazo-chat'>
                                    <div className="observation-actions">
                                        <button className="chat-button" title="Chat" onClick={() => handleChat(selectedPermiso.id)}>
                                            <FaComment /> Enviar mensaje
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {showCancelarModal && (
                    <div className="modal-overlay" onClick={() => setShowCancelarModal(false)}>
                        <div className="modal-cancelar-permiso" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">Estado del Permiso</h2>
                                <button
                                    className="close-button"
                                    onClick={() => setShowCancelarModal(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                {/* Información del permiso */}
                                <div className="permiso-info">
                                    <div className="info-row">
                                        <span className="info-label">Fecha de Inicio:</span>
                                        <span className="info-value">{formatDate(selectedPermiso.fecha_inicio)} - {formatTime(selectedPermiso.hora_inicio)}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Fecha de Fin:</span>
                                        <span className="info-value">{formatDate(selectedPermiso.fecha_fin)} - {formatTime(selectedPermiso.hora_fin)}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Motivo:</span>
                                        <span className="info-value">{selectedPermiso.motivo}</span>
                                    </div>
                                </div>

                                {/* Estado del permiso */}
                                <div className="estado-section">
                                    <h3 className="estado-title">Estado Actual</h3>
                                    <div className="estado-display">
                                        {selectedPermiso.estado === 'Pendiente' && (
                                            <div className="estado-item pendiente">
                                                <FaClock /> <span>Pendiente de Aprobación</span>
                                            </div>
                                        )}
                                        {selectedPermiso.estado === 'Aprobado' && (
                                            <div className="estado-item aprobado">
                                                <FaCheck /> <span>Aprobado</span>
                                            </div>
                                        )}
                                        {selectedPermiso.estado === 'Rechazado' && (
                                            <div className="estado-item rechazado">
                                                <FaThumbsDown /> <span>Rechazado</span>
                                            </div>
                                        )}
                                        {selectedPermiso.estado === 'Cancelado' && (
                                            <div className="estado-item cancelado">
                                                <FaTimes /> <span>Cancelado</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Comentario de aprobación/rechazo */}
                                {(selectedPermiso.estado === 'Aprobado' || selectedPermiso.estado === 'Rechazado') && selectedPermiso.comentario && (
                                    <div className="comentario-section">
                                        <h3 className="comentario-title">
                                            {selectedPermiso.estado === 'Aprobado' ? 'Comentario de Aprobación:' : 'Comentario de Rechazo:'}
                                        </h3>
                                        <div className="comentario-content">
                                            <p>{selectedPermiso.comentario}</p>
                                            <small>Fecha: {formatDate(selectedPermiso.fecha_decision)}</small>
                                        </div>
                                    </div>
                                )}

                                {/* Opción de cancelación solo para permisos pendientes o aprobados */}
                                {(selectedPermiso.estado === 'Pendiente' || selectedPermiso.estado === 'Aprobado') && (
                                    <div className="cancelacion-section">
                                        <h3 className="cancelacion-title">¿Deseas cancelar este permiso?</h3>
                                        
                                        {/* Validación para permisos que ya han comenzado */}
                                        {selectedPermiso.fecha_inicio + 'T' + selectedPermiso.hora_inicio < new Date().toISOString() && (
                                            <div className="warning-message">
                                                <p>⚠️ No se puede cancelar un permiso que ya ha comenzado</p>
                                            </div>
                                        )}

                                        {/* Formulario de cancelación solo si no ha comenzado */}
                                        {selectedPermiso.fecha_inicio + 'T' + selectedPermiso.hora_inicio >= new Date().toISOString() && (
                                            <>
                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="motivo_cancelar">
                                                        Motivo de Cancelación
                                                    </label>
                                                    <textarea
                                                        id="motivo_cancelar"
                                                        name="motivo_cancelar"
                                                        className="form-input form-textarea"
                                                        value={newPermiso.motivo_cancelar || ''}
                                                        onChange={(e) => setNewPermiso({ ...newPermiso, motivo_cancelar: e.target.value })}
                                                        placeholder="Explica el motivo por el cual deseas cancelar este permiso..."
                                                        required
                                                    />
                                                </div>
                                                <div className="modal-toolbar-cancelar-permiso">
                                                    <button 
                                                        className="btn-confirmar" 
                                                        onClick={() => handleCancelarPermiso(selectedPermiso.id)}
                                                        disabled={!newPermiso.motivo_cancelar || newPermiso.motivo_cancelar.length < 10}
                                                    > 
                                                        <FaCheck /> Confirmar Cancelación
                                                    </button>
                                                    <button className="btn-cancelar" onClick={() => setShowCancelarModal(false)}>
                                                        <FaTimes /> Cerrar
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Para permisos rechazados o cancelados, solo mostrar botón de cerrar */}
                                {(selectedPermiso.estado === 'Rechazado' || selectedPermiso.estado === 'Cancelado') && (
                                    <div className="modal-toolbar-cancelar-permiso">
                                        <button className="btn-cancelar" onClick={() => setShowCancelarModal(false)}>
                                            <FaTimes /> Cerrar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

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

                {/* Modal de chat */}
                {isChatModalOpen && (
                    <ChatReceptor receptor={chatReceptor} emisor={emisor} onClose={() => setIsChatModalOpen(false)} />
                )}

                {/* Modal de Soportes */}
                {showSoportesModal && (
                    <>
                        {isUploadingSoportes && (
                            <div className="loader">
                                <div className="justify-content-center jimu-primary-loading"></div>
                            </div>
                        )}
                        <div className="modal-overlay" onClick={() => setShowSoportesModal(false)}>
                            <div className="modal-soportes" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2 className="modal-title">Gestionar Soportes</h2>
                                    <button
                                        className="close-button"
                                        onClick={() => setShowSoportesModal(false)}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="modal-body">
                                    {/* Información del permiso */}
                                    <div className="permiso-info-soportes">
                                        <h3>Permiso: {formatDate(selectedPermisoSoportes.fecha_inicio)} - {formatDate(selectedPermisoSoportes.fecha_fin)}</h3>
                                        <p><strong>Motivo:</strong> {selectedPermisoSoportes.motivo}</p>
                                    </div>

                                    {/* Soportes existentes */}
                                    <div className="soportes-existentes">
                                        <h3>Soportes Actuales</h3>
                                        {selectedPermisoSoportes.soportes && selectedPermisoSoportes.soportes.length > 0 ? (
                                            <div className="soportes-list">
                                                {selectedPermisoSoportes.soportes.map((soporte, index) => (
                                                    <div key={index} className="soporte-item">
                                                        <div className="soporte-info">
                                                            <span className="soporte-icon">{getFileIcon(soporte.tipo)}</span>
                                                            <span className="soporte-nombre">{soporte.nombre}</span>
                                                            <span className="soporte-size">({formatFileSize(soporte.peso)})</span>
                                                        </div>
                                                        <div className="soporte-actions">
                                                            <button 
                                                                onClick={() => handleFileClick(soporte)} 
                                                                className="btn-ver-soporte"
                                                                title="Ver archivo"
                                                            >
                                                                <FaDownload />
                                                            </button>
                                                            <button 
                                                                onClick={() => removeExistingSoporte(soporte.id)} 
                                                                className="btn-eliminar-soporte"
                                                                title="Eliminar soporte"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="sin-soportes">No hay soportes registrados</p>
                                        )}
                                    </div>

                                    {/* Agregar nuevos soportes */}
                                    <div className="agregar-soportes">
                                        <h3>Agregar Nuevos Soportes</h3>
                                        <div
                                            className={`file-input-container ${dragging ? 'drag-active' : ''}`}
                                            onDragEnter={handleSoportesDragEnter}
                                            onDragLeave={handleSoportesDragLeave}
                                            onDragOver={handleSoportesDragOver}
                                            onDrop={handleSoportesDrop}
                                        >
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleSoportesFileChange}
                                                className="file-input"
                                            />
                                            <div className="file-input-label">
                                                <span className="file-input-icon">📤</span>
                                                <p>Arrastra y suelta archivos aquí, o haz clic para seleccionar</p>
                                            </div>
                                        </div>
                                        
                                        {/* Lista de nuevos archivos seleccionados */}
                                        {newSoportes.length > 0 && (
                                            <div className="selected-files">
                                                <h4>Archivos a agregar:</h4>
                                                {newSoportes.map((file, index) => (
                                                    <div key={index} className="selected-file">
                                                        <div className="file-preview">
                                                            <div className="file-preview-icon">{getFileIcon(file.type)}</div>
                                                            <div className="file-info">
                                                                <span className="file-name">{file.name}</span>
                                                                <span className="file-size">{formatFileSize(file.size)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="file-actions">
                                                            <button 
                                                                type="button" 
                                                                className="remove-file" 
                                                                onClick={() => removeSoporte(index)} 
                                                                title="Eliminar archivo"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-toolbar-soportes">
                                    <button
                                        type="button"
                                        className="btn-cancelar"
                                        onClick={() => setShowSoportesModal(false)}
                                    >
                                        <FaTimes /> Cerrar
                                    </button>
                                    {newSoportes.length > 0 && (
                                        <button
                                            type="button"
                                            className="btn-guardar"
                                            onClick={handleGuardarSoportes}
                                            disabled={isUploadingSoportes}
                                        >
                                            <FaPaperPlane /> Guardar Soportes
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </>
    );
};

export default GestionarPermisos;