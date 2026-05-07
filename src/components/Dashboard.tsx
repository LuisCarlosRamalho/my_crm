import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  ComposedChart, Line
} from 'recharts';
import { getOpportunities, getCompanies, getStages } from '../store';
import type { Opportunity, Company } from '../store';
import { DollarSign, TrendingUp, Users, Target } from 'lucide-react';

const COLUMN_COLORS = ['#3B82F6', '#A855F7', '#EAB308', '#F97316', '#22C55E', '#EC4899', '#0EA5E9'];

const Dashboard: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOpportunities(), getCompanies(), getStages()])
      .then(([opps, comps, stgs]) => {
        setOpportunities(opps);
        setCompanies(comps);
        setStages(stgs);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <header className="page-header">
          <h1 className="page-title">Dashboard de Performance</h1>
        </header>
        <div className="page-body">
          <div className="p-8 text-center text-muted">Carregando dados...</div>
        </div>
      </>
    );
  }

  const totalValue = opportunities.reduce((acc, curr) => acc + curr.estimatedValue, 0);
  const lastStage = stages.length > 0 ? stages[stages.length - 1] : 'Fechamento';
  const wonOpps = opportunities.filter(o => o.status === lastStage && !o.isLost);
  const lostOpps = opportunities.filter(o => o.isLost);
  const activeOpps = opportunities.filter(o => !o.isLost);
  const closedValue = wonOpps.reduce((acc, curr) => acc + curr.estimatedValue, 0);
  const conversionRate = opportunities.length > 0 ? (wonOpps.length / opportunities.length) * 100 : 0;

  const pipelineData = stages.map((stage, index) => {
    const stageOpps = activeOpps.filter(o => o.status === stage);
    const qtd = stageOpps.length;
    const val = stageOpps.reduce((a, c) => a + c.estimatedValue, 0);
    const winConv = qtd > 0 ? ((wonOpps.length / qtd) * 100).toFixed(1) : 0;
    return { name: stage, Quantidade: qtd, Valor: val, 'Conversão Ganho %': Number(winConv), fill: COLUMN_COLORS[index % COLUMN_COLORS.length] };
  });

  const stageWithMostOpps = pipelineData.length > 0 ? [...pipelineData].sort((a, b) => b.Quantidade - a.Quantidade)[0] : null;
  const stageWithHighestValue = pipelineData.length > 0 ? [...pipelineData].sort((a, b) => b.Valor - a.Valor)[0] : null;

  const wonLostData = [
    { name: 'Ganhas', Quantidade: wonOpps.length, Valor: closedValue, fill: '#10B981' },
    { name: 'Perdidas', Quantidade: lostOpps.length, Valor: lostOpps.reduce((a, c) => a + c.estimatedValue, 0), fill: '#EF4444' }
  ];

  const segmentMap: Record<string, number> = {};
  companies.forEach(c => {
    const seg = c.segment || 'Sem segmento';
    segmentMap[seg] = (segmentMap[seg] || 0) + 1;
  });
  const segmentData = Object.keys(segmentMap).map((seg, index) => ({
    name: seg, value: segmentMap[seg], fill: COLUMN_COLORS[index % COLUMN_COLORS.length]
  }));

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: '#fff', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>{label}</p>
          <p style={{ color: data.fill || 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            Valor: {formatCurrency(data.Valor || data.value)}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: data['Conversão Ganho %'] !== undefined ? '0.25rem' : '0' }}>
            Quantidade: {data.Quantidade || data.value}
          </p>
          {data['Conversão Ganho %'] !== undefined && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Conversão: {data['Conversão Ganho %']}%</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = (props: any) => (
    <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      {props.payload?.map((entry: any, index: number) => (
        <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <div style={{ width: 12, height: 12, backgroundColor: entry.color, borderRadius: '2px' }} />
          {entry.value}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Dashboard de Performance</h1>
      </header>

      <div className="page-body">
        <div className="dashboard-grid mb-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="stat-title">Valor Total Pipeline</h3>
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><DollarSign size={20} /></div>
            </div>
            <div className="stat-value">{formatCurrency(totalValue)}</div>
            <div className="text-xs text-muted mt-2">LTV/MRR somados</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="stat-title">Valor Fechado</h3>
              <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
            </div>
            <div className="stat-value text-success">{formatCurrency(closedValue)}</div>
            <div className="text-xs text-muted mt-2">Receita garantida</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="stat-title">Empresas Ativas</h3>
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Users size={20} /></div>
            </div>
            <div className="stat-value">{companies.length}</div>
            <div className="text-xs text-muted mt-2">Contas em gestão</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="stat-title">Taxa de Conversão</h3>
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><Target size={20} /></div>
            </div>
            <div className="stat-value">{conversionRate.toFixed(1)}%</div>
            <div className="text-xs text-muted mt-2">Oportunidades ganhas</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="chart-card" style={{ gridColumn: 'span 12' }}>
            <h3 className="chart-header">Funil de Vendas por Etapa</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(val) => `R$ ${val / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                <Bar dataKey="Valor" radius={[4, 4, 0, 0]}>
                  {pipelineData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-grid mt-4">
          <div className="chart-card" style={{ gridColumn: 'span 12' }}>
            <h3 className="chart-header">Oportunidades: Ganhas vs Perdidas</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={wonLostData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(val) => `R$ ${val / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                <Bar dataKey="Valor" radius={[4, 4, 0, 0]}>
                  {wonLostData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-grid mt-4">
          <div className="chart-card" style={{ gridColumn: 'span 12' }}>
            <h3 className="chart-header">Empresas por Categoria (Segmento)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segmentData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => percent ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                >
                  {segmentData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(value: any) => [value, 'Empresas']} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2.5rem', marginBottom: '1rem', paddingLeft: '0.25rem' }}>Destaques do Pipeline</h2>
        
        <div className="dashboard-grid">
          <div className="stat-card" style={{ gridColumn: 'span 6', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="stat-title" style={{ color: '#1E3A8A' }}>Etapa c/ Mais Oportunidades</h3>
              <div className="p-2 bg-blue-200 text-blue-700 rounded-lg"><Target size={20} /></div>
            </div>
            <div className="stat-value" style={{ color: '#1D4ED8', fontSize: '1.5rem' }}>
              {stageWithMostOpps && stageWithMostOpps.Quantidade > 0 ? stageWithMostOpps.name : 'Nenhuma'}
            </div>
            <div className="text-sm font-semibold mt-2" style={{ color: '#2563EB' }}>
              {stageWithMostOpps && stageWithMostOpps.Quantidade > 0 ? `${stageWithMostOpps.Quantidade} oportunidades` : '-'}
            </div>
          </div>

          <div className="stat-card" style={{ gridColumn: 'span 6', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="stat-title" style={{ color: '#064E3B' }}>Etapa c/ Maior Valor R$</h3>
              <div className="p-2 bg-green-200 text-green-700 rounded-lg"><DollarSign size={20} /></div>
            </div>
            <div className="stat-value" style={{ color: '#047857', fontSize: '1.5rem' }}>
              {stageWithHighestValue && stageWithHighestValue.Valor > 0 ? stageWithHighestValue.name : 'Nenhuma'}
            </div>
            <div className="text-sm font-semibold mt-2" style={{ color: '#059669' }}>
              {stageWithHighestValue && stageWithHighestValue.Valor > 0 ? formatCurrency(stageWithHighestValue.Valor) : '-'}
            </div>
          </div>
        </div>

        <div className="dashboard-grid mt-4">
          <div className="chart-card" style={{ gridColumn: 'span 12' }}>
            <h3 className="chart-header">Quantidade vs Valor por Etapa</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10B981" tickFormatter={(val) => `R$ ${val / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="Quantidade" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Qtd Oportunidades" />
                <Line yAxisId="right" type="monotone" dataKey="Valor" stroke="#10B981" strokeWidth={3} name="Valor (R$)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
