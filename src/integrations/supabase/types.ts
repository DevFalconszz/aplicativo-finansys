export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      movimentacao_caixa: {
        Row: {
          id_movimentacao: string
          descricao: string | null
          valor: number
          tipo: 'receita' | 'despesa'
          categoria: string | null
          data: string
          created_at: string
        }
        Insert: {
          id_movimentacao?: string
          descricao?: string | null
          valor: number
          tipo: 'receita' | 'despesa'
          categoria?: string | null
          data: string
          created_at?: string
        }
        Update: {
          id_movimentacao?: string
          descricao?: string | null
          valor?: number
          tipo?: 'receita' | 'despesa'
          categoria?: string | null
          data?: string
          created_at?: string
        }
      }
      lancamento: {
        Row: {
          id: string
          descricao: string | null
          valor: number
          data: string
          created_at: string
        }
        Insert: {
          id?: string
          descricao?: string | null
          valor: number
          data: string
          created_at?: string
        }
        Update: {
          id?: string
          descricao?: string | null
          valor?: number
          data?: string
          created_at?: string
        }
      }
      divida: {
        Row: {
          id: string
          descricao: string | null
          valor_total: number | null
          data_vencimento: string | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          descricao?: string | null
          valor_total?: number | null
          data_vencimento?: string | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          descricao?: string | null
          valor_total?: number | null
          data_vencimento?: string | null
          status?: string | null
          created_at?: string
        }
      }
      nfe: {
        Row: {
          id: string
          numero: string | null
          valor: number | null
          data: string | null
          created_at: string
        }
        Insert: {
          id?: string
          numero?: string | null
          valor?: number | null
          data?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          numero?: string | null
          valor?: number | null
          data?: string | null
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          user_id?: string
          role?: string
          created_at?: string
        }
      }
    }
  }
}
