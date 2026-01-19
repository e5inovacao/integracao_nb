import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatMonthYear } from '../utils/dateUtils';
import { 
  BanknotesIcon, 
  CheckCircleIcon, 
  ClockIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface Commission {
  id: string;
  order_id: string;
  salesperson_id: string;
  amount: number;
  type: string;
  status: string;
  percentage: number;
  created_at: string;
  orders?: {
    order_number: string;
    partners?: {
      name: string;
    };
  };
  consultores?: {
    nome: string;
  };
  user_profiles?: {
    full_name: string;
  };
}

export default function Comissoes() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchCommissions();
  }, [month, year]);

  const fetchCommissions = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();

      // Try to fetch with joins. Note: Join syntax depends on foreign keys.
      // Migration 029 created commission -> salesperson_id (auth.users).
      // But we might want to join with 'consultores' (if FK exists) or 'user_profiles'.
      // The migration 029 defined salesperson_id REFERENCES auth.users.
      // So we should join with user_profiles or consultores via auth_user_id.
      // Let's try joining with consultores assuming auth_user_id match or direct FK if we added one?
      // Migration 029 didn't add FK to consultores directly, but to auth.users.
      // So we join with user_profiles!
      
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          orders (
            order_number,
            partners (
              name
            )
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Now we need to fetch salesperson names manually since we can't easily join auth.users -> user_profiles in one go via standard postgrest unless relationships are set perfectly.
      // Actually, we can fetch profiles separately or just show ID if name fails.
      // Or better: Let's fetch all consultores/profiles to map.
      
      const { data: profiles } = await supabase.from('user_profiles').select('user_id, full_name');
      const { data: consultores } = await supabase.from('consultores').select('auth_user_id, nome');
      
      const commissionsWithNames = data?.map((comm: any) => {
        const profile = profiles?.find(p => p.user_id === comm.salesperson_id);
        const consultor = consultores?.find(c => c.auth_user_id === comm.salesperson_id);
        return {
          ...comm,
          salesperson_name: consultor?.nome || profile?.full_name || 'Vendedor Desconhecido'
        };
      }) || [];

      setCommissions(commissionsWithNames);
    } catch (error: any) {
      console.error('Erro ao buscar comissões:', error);
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        setErrorMsg('Tabela de comissões não encontrada. Execute a migração 029.');
      } else {
        setErrorMsg(`Erro: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const totalCommissions = commissions.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  
  // Extract unique sellers
  const uniqueSellers = Array.from(new Set(commissions.map(c => (c as any).salesperson_name)));
  
  const sellerStats = uniqueSellers.map(seller => ({
    name: seller,
    total: commissions.filter(c => (c as any).salesperson_name === seller).reduce((acc, curr) => acc + (curr.amount || 0), 0)
  }));

  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
  
  const filteredCommissions = selectedSeller 
    ? commissions.filter(c => (c as any).salesperson_name === selectedSeller)
    : commissions;

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BanknotesIcon className="h-8 w-8 text-green-600" />
            Gestão de Comissões
          </h1>
          <p className="text-gray-600">Acompanhamento de comissões por vendedor</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-6 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mês</label>
          <select 
            value={month} 
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('pt-BR', { month: 'long' }).toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ano</label>
          <select 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-right bg-green-50 px-6 py-2 rounded-lg border border-green-100">
          <p className="text-xs font-bold text-green-600 uppercase">Total de Comissões</p>
          <p className="text-2xl font-black text-green-700">{formatCurrency(totalCommissions)}</p>
        </div>
      </div>

      {/* Seller Stats */}
      {sellerStats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sellerStats.map(stat => (
            <div 
              key={stat.name}
              onClick={() => setSelectedSeller(selectedSeller === stat.name ? null : stat.name)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedSeller === stat.name 
                  ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500' 
                  : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">{stat.name}</p>
              <div className="flex items-end justify-between">
                <span className="text-xl font-bold text-gray-800">{formatCurrency(stat.total)}</span>
                {selectedSeller === stat.name && (
                  <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                      Carregando...
                    </div>
                  </td>
                </tr>
              ) : filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma comissão encontrada para este período.
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((comm) => (
                  <tr key={comm.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {(comm as any).salesperson_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                      #{comm.orders?.order_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {comm.orders?.partners?.name || 'Cliente Removido'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        comm.type === 'ENTRADA' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {comm.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                      {formatCurrency(comm.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        comm.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {comm.status === 'PENDING' ? 'PENDENTE' : 'PAGO'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
