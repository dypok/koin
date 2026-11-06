import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const DataExportView: React.FC = () => {
  const { activeProfile, token } = useAuthStore();
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getApiUrl = () => {
    return '/api/v1';
  };

  const handleExportCSV = async () => {
    if (!token || !activeProfile) return;
    setIsExportingCSV(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const url = `${getApiUrl()}/export/csv`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Profile-ID': activeProfile.id,
        },
      });

      if (!res.ok) {
        throw new Error(`Error en el servidor al exportar CSV: ${res.statusText}`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const today = new Date().toISOString().split('T')[0];
      a.download = `koin_transacciones_${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMessage('Archivo CSV exportado exitosamente con codificación UTF-8.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al exportar los datos en CSV.');
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportJSON = async () => {
    if (!token || !activeProfile) return;
    setIsExportingJSON(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const url = `${getApiUrl()}/export/json`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Profile-ID': activeProfile.id,
        },
      });

      if (!res.ok) {
        throw new Error(`Error en el servidor al exportar JSON: ${res.statusText}`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const today = new Date().toISOString().split('T')[0];
      a.download = `koin_backup_${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMessage('Copia de seguridad completa en JSON descargada exitosamente.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al exportar el backup JSON.');
    } finally {
      setIsExportingJSON(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="border-b border-border/40 pb-4">
        <h2 className="text-base font-semibold tracking-tight">Exportación Soberana de Datos</h2>
        <p className="text-xs text-muted-foreground">
          Descarga tus movimientos financieros y conserva copias de seguridad de tu perfil activo.
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CSV Export Option */}
        <div className="p-5 bg-card border border-border/40 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Exportar Movimientos a CSV</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Descarga una hoja de cálculo estándar compatible con Microsoft Excel y Google Sheets.
              Incluye codificación UTF-8 con BOM para preservar tildes y caracteres especiales.
            </p>
            <div className="text-[11px] font-mono text-muted-foreground pt-1">
              Columnas: Fecha, Cuenta, Categoría, Tipo, Monto, Divisa, Tasa, Monto Base, Nota
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={isExportingCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-border/40 hover:bg-muted/50 text-xs font-medium text-foreground transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingCSV ? 'Generando archivo CSV...' : 'Descargar Archivo CSV'}</span>
          </button>
        </div>

        {/* JSON Backup Option */}
        <div className="p-5 bg-card border border-border/40 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <FileJson className="w-4 h-4 text-primary" />
              <span>Copia de Seguridad en JSON</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Volcado relacional completo de tu perfil activo: cuentas, categorías personalizadas,
              presupuestos mensuales, reglas recurrentes y todos tus movimientos históricos.
            </p>
            <div className="text-[11px] font-mono text-muted-foreground pt-1">
              Estructura normalizada en JSON para portabilidad total y custodia soberana.
            </div>
          </div>

          <button
            onClick={handleExportJSON}
            disabled={isExportingJSON}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-border/40 hover:bg-muted/50 text-xs font-medium text-foreground transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingJSON ? 'Generando volcado JSON...' : 'Descargar Copia de Seguridad JSON'}</span>
          </button>
        </div>
      </div>

      {/* Sovereign Privacy Banner */}
      <div className="p-4 bg-muted/20 border border-border/40 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-0.5">
          <span className="font-semibold text-foreground">Soberanía y Custodia Total de Datos</span>
          <p>
            En Koin tú eres el único propietario de tu información financiera. Los volcados generados
            se transfieren encriptados punto a punto y no contienen rastreadores ni telemetría comercial.
          </p>
        </div>
      </div>
    </div>
  );
};
