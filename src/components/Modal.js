export default function Modal({ isOpen, onClose, noClose, children }) {
    const overlayStyle = {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: isOpen ? "flex" : "none",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
    };

    const modalStyle = {
        border: "1px #ddd solid",
        backgroundColor: "#111",
        color: "#ddd",
        padding: "20px",
        borderRadius: "12px",
        maxWidth: "600px",
        maxHeight: "80vh",
        overflowY: "visible",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    };

    return <div style={overlayStyle} onClick={() => onClose()}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            {children}
            {!noClose ?
                <button onClick={() => onClose()}>
                    Close
                </button> :
                null
            }
        </div>
    </div>;
}
