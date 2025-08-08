import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { getImageUrl, getAssetUrl } from '../utils/assetHelper';
import { FaDownload } from 'react-icons/fa';

const FileViewerModal = ({ isOpen, onClose, fileUrl, fileName, fileType }) => {
    if (!isOpen) return null;
  console.log(fileType);
    const isImage = fileType?.toLowerCase().includes('image');
    const isPDF = fileType?.toLowerCase().includes('pdf');
    const isViewable = isImage || isPDF;

    // Construir la URL completa del archivo
    const fullFileUrl = fileUrl?.startsWith('http') 
        ? fileUrl 
        : fileUrl?.startsWith('storage/') 
            ? fileUrl 
            : `storage/soportes/${fileUrl}`;
            
    return (
        <div className="file-viewer-modal-overlay" onClick={onClose}>
            <div className="file-viewer-modal" onClick={e => e.stopPropagation()}>
                <div className="file-viewer-header">
                    <h3 className="file-viewer-title">{fileName}</h3>
                    <button
                        onClick={onClose}
                        className="file-viewer-close"
                    >
                        <FaTimes />
                    </button>
                </div>
                <div className="file-viewer-content">
                    {isViewable ? (
                        isImage ? (
                            <>
                            <img
                                src={getImageUrl(fullFileUrl)}  
                                alt={fileName}
                                className="file-viewer-image"
                                onError={(e) => {
                                    console.error('Error al cargar la imagen:', e);
                                    e.target.style.display = 'none';
                                }}
                            />
                            <a
                                href={getImageUrl(fullFileUrl)}
                                download={fileName}
                                className="file-viewer-download-button"
                                style={{ marginTop: '10px' }}
                            >
                                <FaDownload /> Descargar archivo
                            </a>
                            </>
                        ) : (
                            <iframe
                                src={getImageUrl(fullFileUrl)}
                                className="file-viewer-iframe"
                                title={fileName}
                                onError={(e) => {
                                    console.error('Error al cargar el PDF:', e);
                                }}
                            />
                        )
                    ) : (
                        <div className="file-viewer-download">
                            <p className="file-viewer-download-text">
                                Este tipo de archivo no se puede previsualizar.
                            </p>
                            <a
                                href={getImageUrl(fullFileUrl)}
                                download={fileName}
                                className="file-viewer-download-button"
                            >
                                <FaDownload /> Descargar archivo
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileViewerModal; 