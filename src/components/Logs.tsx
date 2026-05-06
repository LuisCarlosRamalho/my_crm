import React, { useEffect, useState } from 'react';
import { getLogs } from '../store';
import type { SystemLog } from '../store';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User as UserIcon, Activity, Database } from 'lucide-react';

export const Logs: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getLogs();
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-color)', marginBottom: '1.5rem' }}>
        Logs do Sistema (Auditoria)
      </h1>

      <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-color-light)' }}>
            Carregando logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-color-light)' }}>
            Nenhum log encontrado.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-color-light)', fontSize: '0.85rem' }}>DATA/HORA</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-color-light)', fontSize: '0.85rem' }}>USUÁRIO</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-color-light)', fontSize: '0.85rem' }}>AÇÃO</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-color-light)', fontSize: '0.85rem' }}>ENTIDADE</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-color-light)', fontSize: '0.85rem' }}>DETALHES</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-color)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} color="var(--primary-color)" />
                        {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserIcon size={16} color="var(--text-color-light)" />
                        <span style={{ fontWeight: 500 }}>{log.user_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: log.action.includes('DELETE') ? '#FEE2E2' : log.action.includes('CREATE') ? '#DCFCE7' : '#E0F2FE',
                        color: log.action.includes('DELETE') ? '#991B1B' : log.action.includes('CREATE') ? '#166534' : '#075985'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Database size={16} color="var(--text-color-light)" />
                        {log.entity_type}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-color)' }}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
