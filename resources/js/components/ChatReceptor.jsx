import React, { useState } from 'react';

const ChatReceptor = ({ receptor, emisor, onClose }) => {
    const [isIframeLoading, setIsIframeLoading] = useState(true);  

    console.log(emisor);
    console.log(receptor);

    return (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
        <div className="modal-chat">
            <div className="modal-header">
                <h2 className='modal-title'>Chat</h2>
                <button className="close-button" onClick={onClose}>
                    &times;
                </button>
            </div>
            <div className="modal-content">
                {isIframeLoading && (
                    <div className="loader">
                        <div className="justify-content-center jimu-primary-loading"></div>
                    </div>
                )}
                <iframe
                    src={`https://ingeer.co/chat-empresarial/public/chat-redireccionado-workboard/${emisor}/${receptor}`}
                    title="Chat"
                    className="chat-iframe"
                    style={{ width: '100%', height: '100%' }}
                    onLoad={() => {
                        setIsIframeLoading(false);
                    }}
                ></iframe>
            </div>
        </div>
    </div>
    )
}

export default ChatReceptor;
