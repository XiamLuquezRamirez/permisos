import React, { useState } from 'react';
import { FaUserTie, FaFileAlt } from 'react-icons/fa';
import GestionarPermisosAdmin from './GestionarPermisosAdmin';
import InformesAdmin from './InformesAdmin';

const AdminInterface = (user) => {
    const [showPermisosModal, setShowPermisosModal] = useState(false);
    const [showInformesModal, setShowInformesModal] = useState(false);
    const cardAdmin = [
        {
            id: 1,
            title: 'Permisos',
            icon: <FaUserTie size={25} />,
            description: 'Gestión de permisos de los empleados',
            color: '#0891b2',
            onClick: () => setShowPermisosModal(true)
        },
        {
            id: 2,
            title: 'Informes',
            icon: <FaFileAlt size={25} />,
            description: 'Informes de permisos',
            color: '#0891b2',
            onClick: () => setShowInformesModal(true)
        }
    ]



    return (
        
        <div className="admin-interface">
            <h1>Administrador de Permisos</h1>
            <div className="parameters-grid">
                {cardAdmin.map((card, index) => (
                    <div
                        key={card.id}
                        className="parameter-card"
                        onClick={card.onClick}
                        style={{ '--card-index': index }}
                    >
                        <div className="card-icon">
                            {card.icon}
                        </div>
                        <div className="card-content">
                            <h3>{card.title}</h3>
                            <p>{card.description}</p>
                        </div>
                    </div>
                ))}
            </div>
            {showPermisosModal && (
                <GestionarPermisosAdmin user={user} onClose={() => setShowPermisosModal(false)} />
            )}

            {showInformesModal && (
                <InformesAdmin user={user} onClose={() => setShowInformesModal(false)} />
            )}
        </div>
    )

   

}

export default AdminInterface;