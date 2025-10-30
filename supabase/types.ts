export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  Tables: {
      itens_orcamento_sistema: {
        Row: {
          id: string
          orcamento_id: string
          produto_ecologico_id: number
          quantidade: number
          observacoes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          orcamento_id: string
          produto_ecologico_id: number
          quantidade: number
          observacoes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          orcamento_id?: string
          produto_ecologico_id?: number
          quantidade?: number
          observacoes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_orcamento_sistema_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos_sistema"
            referencedColumns: ["id"]
          }
        ]
      }
      orcamentos_sistema: {
        Row: {
          id: string
          numero_orcamento: string
          usuario_id: string
          data_evento: string | null
          observacoes: string | null
          status: string | null
          valor_total: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          numero_orcamento?: string
          usuario_id: string
          data_evento?: string | null
          observacoes?: string | null
          status?: string | null
          valor_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          numero_orcamento?: string
          usuario_id?: string
          data_evento?: string | null
          observacoes?: string | null
          status?: string | null
          valor_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_sistema_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_sistema"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          category_id: string | null
          images: string[] | null
          sustainability_features: string[] | null
          featured: boolean | null
          specifications: Json | null
          features: string[] | null
          certifications: string[] | null
          rating: number | null
          review_count: number | null
          in_stock: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          category_id?: string | null
          images?: string[] | null
          sustainability_features?: string[] | null
          featured?: boolean | null
          specifications?: Json | null
          features?: string[] | null
          certifications?: string[] | null
          rating?: number | null
          review_count?: number | null
          in_stock?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category_id?: string | null
          images?: string[] | null
          sustainability_features?: string[] | null
          featured?: boolean | null
          specifications?: Json | null
          features?: string[] | null
          certifications?: string[] | null
          rating?: number | null
          review_count?: number | null
          in_stock?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      produtos_asia: {
        Row: {
          referencia_pai: string | null
          nome_pai: string | null
          descricao: string | null
          preco_pai: string | null
          imagem: string | null
          img01: string | null
          img02: string | null
          img03: string | null
          img04: string | null
          img05: string | null
          img06: string | null
          img07: string | null
          img08: string | null
          img09: string | null
          img10: string | null
          img11: string | null
          img12: string | null
          img13: string | null
          img14: string | null
          img15: string | null
          video: string | null
          categorias: string | null
          propriedades: string | null
          dimensao_produto: string | null
          peso_do_produto: string | null
          quant_por_caixa: string | null
          embalagem: string | null
          dimensao_caixa: string | null
          peso_da_caixa: string | null
          dimensao_do_produto: string | null
          emb_individual: string | null
          dimensao_da_caixa: string | null
          quantidade_por_caixa: string | null
          volume_litros: string | null
          "capacidade.1": string | null
        }
        Insert: {
          referencia_pai?: string | null
          nome_pai?: string | null
          descricao?: string | null
          preco_pai?: string | null
          imagem?: string | null
          img01?: string | null
          img02?: string | null
          img03?: string | null
          img04?: string | null
          img05?: string | null
          img06?: string | null
          img07?: string | null
          img08?: string | null
          img09?: string | null
          img10?: string | null
          img11?: string | null
          img12?: string | null
          img13?: string | null
          img14?: string | null
          img15?: string | null
          video?: string | null
          categorias?: string | null
          propriedades?: string | null
          dimensao_produto?: string | null
          peso_do_produto?: string | null
          quant_por_caixa?: string | null
          embalagem?: string | null
          dimensao_caixa?: string | null
          peso_da_caixa?: string | null
          dimensao_do_produto?: string | null
          emb_individual?: string | null
          dimensao_da_caixa?: string | null
          quantidade_por_caixa?: string | null
          volume_litros?: string | null
          "capacidade.1"?: string | null
        }
        Update: {
          referencia_pai?: string | null
          nome_pai?: string | null
          descricao?: string | null
          preco_pai?: string | null
          imagem?: string | null
          img01?: string | null
          img02?: string | null
          img03?: string | null
          img04?: string | null
          img05?: string | null
          img06?: string | null
          img07?: string | null
          img08?: string | null
          img09?: string | null
          img10?: string | null
          img11?: string | null
          img12?: string | null
          img13?: string | null
          img14?: string | null
          img15?: string | null
          video?: string | null
          categorias?: string | null
          propriedades?: string | null
          dimensao_produto?: string | null
          peso_do_produto?: string | null
          quant_por_caixa?: string | null
          embalagem?: string | null
          dimensao_caixa?: string | null
          peso_da_caixa?: string | null
          dimensao_do_produto?: string | null
          emb_individual?: string | null
          dimensao_da_caixa?: string | null
          quantidade_por_caixa?: string | null
          volume_litros?: string | null
          "capacidade.1"?: string | null
        }
        Relationships: []
      }
      produtos_ecologicos: {
        Row: {
          id: number
          Referencia: string | null
          Nome: string | null
          Descricao: string | null
          Fornecedor: string | null
          "Codigo Fornecedor": string | null
          stativo: string | null
          IMAGEM: string | null
        }
        Insert: {
          id?: number
          Referencia?: string | null
          Nome?: string | null
          Descricao?: string | null
          Fornecedor?: string | null
          "Codigo Fornecedor"?: string | null
          stativo?: string | null
          IMAGEM?: string | null
        }
        Update: {
          id?: number
          Referencia?: string | null
          Nome?: string | null
          Descricao?: string | null
          Fornecedor?: string | null
          "Codigo Fornecedor"?: string | null
          stativo?: string | null
          IMAGEM?: string | null
        }
        Relationships: []
      }
      usuarios_sistema: {
        Row: {
          id: string
          user_id: string
          nome: string
          telefone: string | null
          email: string | null
          empresa: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          telefone?: string | null
          email?: string | null
          empresa?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          telefone?: string | null
          email?: string | null
          empresa?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_sistema_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
  Views: {
    [_ in never]: never
  }
  Functions: {
    [_ in never]: never
  }
  Enums: {
    [_ in never]: never
  }
  CompositeTypes: {
    [_ in never]: never
  }
}

export type Tables<
  TableName extends keyof Database["Tables"]
> = Database["Tables"][TableName]["Row"]

export type TablesInsert<
  TableName extends keyof Database["Tables"]
> = Database["Tables"][TableName]["Insert"]

export type TablesUpdate<
  TableName extends keyof Database["Tables"]
> = Database["Tables"][TableName]["Update"]

export type Enums<
  EnumName extends keyof Database["Enums"]
> = Database["Enums"][EnumName]