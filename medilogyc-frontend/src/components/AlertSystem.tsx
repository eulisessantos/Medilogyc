import { useAlert } from '../context/AlertContext';

export function ToastContainer() {
  const { toasts } = useAlert();

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.variant}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function MedicalBlockOverlay() {
  const { medicalBlock, setMedicalBlock } = useAlert();
  if (!medicalBlock) return null;

  return (
    <div className="medical-block-overlay" role="alertdialog" aria-modal="true">
      <div className="medical-block-content">
        <img src="/logo.png" alt="Medilogyc" width={64} height={64} style={{ borderRadius: '50%', marginBottom: '1rem' }} />
        <h2>⚠️ ALERTA MÉDICA</h2>
        <p>{medicalBlock.replace('⚠️ ALERTA MÉDICA: ', '')}</p>
        <button type="button" className="btn btn-danger" onClick={() => setMedicalBlock(null)}>
          Entendido — Revisar prescripción
        </button>
      </div>
    </div>
  );
}

export function CompatibilityModal() {
  const { compatibilityWarning, setCompatibilityWarning } = useAlert();
  if (!compatibilityWarning) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal" role="alertdialog" aria-modal="true">
        <h3>⚠️ Compatibilidad Crítica</h3>
        <p>{compatibilityWarning.replace('⚠️ COMPATIBILIDAD CRÍTICA: ', '')}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setCompatibilityWarning(null)}>
            Cancelar prescripción
          </button>
          <button type="button" className="btn btn-danger" onClick={() => setCompatibilityWarning(null)}>
            He revisado el riesgo
          </button>
        </div>
      </div>
    </div>
  );
}
