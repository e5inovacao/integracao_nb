import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import type { Produto, ProductVariation } from '../lib/supabase'
import { toast } from 'sonner'

interface ProdutoFormData {
  produto_name: string
  produto_ref: string
  categoria: string
  fornecedor: string
  produto_descricao: string
  produto_img: string
  status_ativa: 'ativo' | 'inativo'
}

interface VariacaoFormData {
  id?: number
  cor: string
  imagem: string
  _isNew?: boolean
}

export default function ProdutoForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  // Verificar se consultor está tentando editar produto
  useEffect(() => {
    if (isEditing && user?.role === 'consultor') {
      toast.error('Consultores não têm permissão para editar produtos')
      navigate('/produtos')
      return
    }
  }, [isEditing, user?.role, navigate])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const [formData, setFormData] = useState<ProdutoFormData>({
    produto_name: '',
    produto_ref: '',
    categoria: '',
    fornecedor: '',
    produto_descricao: '',
    produto_img: '',
    status_ativa: 'ativo'
  })

  const [variacoes, setVariacoes] = useState<VariacaoFormData[]>([
    {
      cor: '',
      imagem: '',
      _isNew: true
    }
  ])

  const categorias = [
    'Brindes Ecológicos',
    'Canetas e Lápis',
    'Blocos e Cadernos',
    'Bolsas e Mochilas',
    'Copos e Garrafas',
    'Tecnologia',
    'Vestuário',
    'Outros'
  ]

  const fornecedores = [
    'EcoBrindes Ltda',
    'Verde Promocional',
    'Sustenta Brindes',
    'Natura Promocional',
    'Eco Solutions',
    'Outros'
  ]

  const cores = [
    'Branco', 'Preto', 'Azul', 'Verde', 'Vermelho', 'Amarelo',
    'Rosa', 'Roxo', 'Laranja', 'Marrom', 'Cinza', 'Transparente'
  ]

  const tamanhos = [
    'PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG',
    'Único', 'Pequeno', 'Médio', 'Grande'
  ]

  useEffect(() => {
    if (isEditing) {
      loadProduto()
    }
  }, [id, isEditing])

  const loadProduto = async () => {
    setLoading(true);
    try {
      // Verificação prévia: checar se o produto existe na tabela correta
      const { data: checkData, error: checkError } = await supabase
        .from('ecologic_products_site')
        .select('id')
        .eq('id', id)
        .single();
  
      if (checkError || !checkData) {
        console.error('Produto não encontrado na tabela ecologic_products_site:', checkError);
        toast.error('Produto não encontrado. Verifique se o ID existe na tabela ecologic_products_site.');
        return;
      }
  
      // Consulta principal com mapeamento de campos
      const { data, error } = await supabase
        .from('ecologic_products_site')
        .select('*')
        .eq('id', id)
        .single();
  
      if (error) throw error;
  
      if (data) {
        setFormData({
          produto_name: data.titulo || '',
          produto_ref: data.codigo || '',
          categoria: data.categoria || '',
          fornecedor: '',
          produto_descricao: data.descricao || '',
          produto_img: data.img_0 || '',
          status_ativa: data.status_active === false ? 'inativo' : 'ativo'
        });
  
        // Mapear variações (ajuste conforme estrutura real)
        if (data.variacoes) {
          setVariacoes(data.variacoes.map((v: any) => ({
            cor: v.cor || '',
            imagem: v.imagem || '',
            _isNew: false
          })));
        }
  
        console.log('Produto carregado com sucesso da ecologic_products_site:', data);
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast.error(`Erro ao carregar produto: ${(error as Error).message}. Verifique o ID, a tabela ou permissões.`);
    } finally {
      setLoading(false);
    }
  };

  // Função para validar e processar URLs de imagem
  const validateImageUrl = (url: string): string => {
    if (!url) return ''
    
    // Se for um link do Google Images, tentar extrair a URL original
    if (url.includes('google.com')) {
      try {
        // Para URLs do tipo: google.com/url?sa=i&url=...
        if (url.includes('url=')) {
          const urlObj = new URL(url)
          const originalUrl = urlObj.searchParams.get('url')
          if (originalUrl) {
            const decodedUrl = decodeURIComponent(originalUrl)
            // Validar se a URL extraída é válida
            try {
              new URL(decodedUrl)
              return decodedUrl
            } catch {
              console.warn('URL extraída do Google não é válida:', decodedUrl)
              toast.error('URL de imagem inválida. Por favor, use um link direto para a imagem.')
              return ''
            }
          }
        }
        
        // Para URLs antigas do tipo: google.com/imgres?imgurl=...
        if (url.includes('imgurl=')) {
          const urlParams = new URLSearchParams(url.split('?')[1])
          const originalUrl = urlParams.get('imgurl')
          if (originalUrl) {
            const decodedUrl = decodeURIComponent(originalUrl)
            try {
              new URL(decodedUrl)
              return decodedUrl
            } catch {
              console.warn('URL extraída do Google não é válida:', decodedUrl)
              toast.error('URL de imagem inválida. Por favor, use um link direto para a imagem.')
              return ''
            }
          }
        }
        
        // Se chegou até aqui, é uma URL do Google que não conseguimos processar
        console.warn('URL do Google Images não pôde ser processada:', url)
        toast.error('Links do Google Images podem causar problemas. Por favor, use um link direto para a imagem.')
        return ''
        
      } catch (error) {
        console.warn('Erro ao processar URL do Google Images:', error)
        toast.error('Erro ao processar URL. Por favor, use um link direto para a imagem.')
        return ''
      }
    }
    
    // Validar se é uma URL válida
    try {
      new URL(url)
      return url
    } catch {
      console.warn('URL inválida fornecida:', url)
      toast.error('URL de imagem inválida. Verifique o formato da URL.')
      return ''
    }
  }

  const handleInputChange = (field: keyof ProdutoFormData, value: string | number | boolean) => {
    // Processar URLs de imagem
    if (field === 'produto_img' && typeof value === 'string') {
      value = validateImageUrl(value)
    }
    
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleVariacaoChange = (index: number, field: keyof VariacaoFormData, value: string) => {
    // Processar URLs de imagem das variações
    if (field === 'imagem') {
      value = validateImageUrl(value)
    }
    
    setVariacoes(prev => prev.map((variacao, i) => {
      if (i === index) {
        return { ...variacao, [field]: value }
      }
      return variacao
    }))
    
    // Limpar erro do campo quando o usuário começar a digitar
    const errorKey = `variacao_${index}_${field}`
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }))
    }
  }

  const addVariacao = () => {
    setVariacoes(prev => [...prev, {
      cor: '',
      imagem: '',
      _isNew: true
    }])
  }

  const removeVariacao = (index: number) => {
    if (variacoes.length > 1) {
      setVariacoes(prev => prev.filter((_, i) => i !== index))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.produto_name.trim()) {
      newErrors.produto_name = 'Nome do produto é obrigatório'
    }



    if (!formData.fornecedor) {
      newErrors.fornecedor = 'Fornecedor é obrigatório'
    }



    // Validar variações
    variacoes.forEach((variacao, index) => {
      if (!variacao.cor) {
        newErrors[`variacao_${index}_cor`] = 'Cor é obrigatória'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const validationErrors: { [key: string]: string } = {};
    if (!formData.produto_name) validationErrors.produto_name = 'Nome do produto é obrigatório';
    if (!formData.produto_ref) validationErrors.produto_ref = 'Referência é obrigatória';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSaving(false);
      return;
    }

    try {
      let produtoData;
      if (isEditing) {
        // Atualização com mapeamento para ecologic_products_site
        const statusActiveBool = formData.status_ativa === 'ativo';
        const { data, error } = await supabase
          .from('ecologic_products_site')
          .update({
            titulo: formData.produto_name,
            codigo: formData.produto_ref,
            categoria: formData.categoria,
            descricao: formData.produto_descricao,
            img_0: formData.produto_img,
            tipo: 'produto',
            status_active: statusActiveBool
          })
          .eq('id', id)
          .select()
          .single();

      if (error) throw error;
      produtoData = data;

      // Atualizar variações (ajuste conforme estrutura)
      // ... (lógica de variações aqui, mapeando para campos corretos)
      } else {
      // Inserção com mapeamento
      const statusActiveBool = formData.status_ativa === 'ativo';
      const { data, error } = await supabase
        .from('ecologic_products_site')
        .insert({
          titulo: formData.produto_name,
          codigo: formData.produto_ref,
          categoria: formData.categoria,
          descricao: formData.produto_descricao,
          img_0: formData.produto_img,
          tipo: 'produto',
          status_active: statusActiveBool
        })
        .select()
        .single();

      if (error) throw error;
      produtoData = data;

      // Inserir variações
      // ... (lógica de variações aqui)
      }

      console.log('Produto salvo com sucesso na ecologic_products_site:', produtoData);
      toast.success(isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
      navigate('/produtos');
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error(`Erro ao salvar produto: ${(error as Error).message}. Verifique os campos mapeados ou a tabela.`);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Atualize as informações do produto' : 'Adicione um novo produto ao catálogo'}
          </p>
        </div>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Básicos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Dados Básicos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={formData.produto_name}
                onChange={(e) => handleInputChange('produto_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.produto_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Digite o nome do produto"
              />
              {errors.produto_name && (
                <p className="mt-1 text-sm text-red-600">{errors.produto_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referência
              </label>
              <input
                type="text"
                value={formData.produto_ref}
                onChange={(e) => handleInputChange('produto_ref', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="REF001"
              />
            </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fornecedor *
              </label>
              <input
                type="text"
                value={formData.fornecedor}
                onChange={(e) => handleInputChange('fornecedor', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fornecedor ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Digite o nome do fornecedor"
              />
              {errors.fornecedor && (
                <p className="mt-1 text-sm text-red-600">{errors.fornecedor}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da Imagem
              </label>
              <input
                type="url"
                value={formData.produto_img}
                onChange={(e) => handleInputChange('produto_img', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
            <select
              value={formData.status_ativa}
              onChange={async (e) => {
                const value = e.target.value as 'ativo' | 'inativo';
                handleInputChange('status_ativa', value);
                if (isEditing && id) {
                  try {
                    const { error } = await supabase
                      .from('ecologic_products_site')
                      .update({ status_active: value === 'ativo' })
                      .eq('id', id);
                    if (error) throw error;
                    toast.success(`Status atualizado para ${value}`);
                  } catch (err) {
                    console.error('Erro ao atualizar status do produto:', err);
                    toast.error('Erro ao atualizar status');
                  }
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
            </div>


          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.produto_descricao}
              onChange={(e) => handleInputChange('produto_descricao', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descreva o produto..."
            />
          </div>

          {/* Preview da Imagem */}
          {formData.produto_img && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview da Imagem
              </label>
              <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                <img
                  src={formData.produto_img}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    console.warn('Erro ao carregar imagem:', formData.produto_img)
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                  onLoad={() => {
                    console.log('Imagem carregada com sucesso:', formData.produto_img)
                  }}
                />
                <div className="hidden w-full h-full bg-gray-100 flex items-center justify-center">
                  <PhotoIcon className="h-8 w-8 text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Variações */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Variações do Produto</h2>
            <button
              type="button"
              onClick={addVariacao}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{color: '#2CB20B', backgroundColor: '#2CB20B20'}}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Adicionar Variação
            </button>
          </div>

          <div className="space-y-4">
            {variacoes.map((variacao, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    Variação {index + 1}
                  </h3>
                  {variacoes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariacao(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cor *
                    </label>
                    <select
                      value={variacao.cor}
                      onChange={(e) => handleVariacaoChange(index, 'cor', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                        errors[`variacao_${index}_cor`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      style={{}}
                    >
                      <option value="">Selecione</option>
                      {cores.map(cor => (
                        <option key={cor} value={cor}>{cor}</option>
                      ))}
                    </select>
                    {errors[`variacao_${index}_cor`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`variacao_${index}_cor`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL da Imagem
                    </label>
                    <input
                      type="url"
                      value={variacao.imagem}
                      onChange={(e) => handleVariacaoChange(index, 'imagem', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2"
                      style={{}}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                </div>

                {/* Preview da Imagem da Variação */}
                {variacao.imagem && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview da Imagem - {variacao.cor}
                    </label>
                    <div className="w-24 h-24 border border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={variacao.imagem}
                        alt={`Preview ${variacao.cor}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          console.warn('Erro ao carregar imagem da variação:', variacao.imagem)
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                        onLoad={() => {
                          console.log('Imagem da variação carregada com sucesso:', variacao.imagem)
                        }}
                      />
                      <div className="hidden w-full h-full bg-gray-100 flex items-center justify-center">
                        <PhotoIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/produtos')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{}}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{backgroundColor: '#2CB20B'}}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#25A009'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2CB20B'}
          >
            {saving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </div>
            ) : (
              isEditing ? 'Atualizar Produto' : 'Criar Produto'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
