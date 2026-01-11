/**
 * Database types for Supabase
 * These types represent the database schema for limetaxIQ
 *
 * Tables:
 * - advisories: Tax advisory firms (Kanzleien)
 * - advisors: Staff members linked to auth.users
 * - clients: Client accounts (future)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      advisories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      advisors: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          advisory_id: string | null;
          role: "user" | "admin";
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          advisory_id?: string | null;
          role?: "user" | "admin";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          advisory_id?: string | null;
          role?: "user" | "admin";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "advisors_advisory_id_fkey";
            columns: ["advisory_id"];
            referencedRelation: "advisories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "advisors_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      tax_documents: {
        Row: {
          id: string;
          citation: string;
          title: string;
          content: string;
          law_type: string;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          citation: string;
          title: string;
          content: string;
          law_type: string;
          embedding?: number[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          citation?: string;
          title?: string;
          content?: string;
          law_type?: string;
          embedding?: number[] | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_tax_documents: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          citation: string;
          title: string;
          content: string;
          law_type: string;
          similarity: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience types for use in the application
export type Advisory = Database["public"]["Tables"]["advisories"]["Row"];
export type AdvisoryInsert =
  Database["public"]["Tables"]["advisories"]["Insert"];
export type AdvisoryUpdate =
  Database["public"]["Tables"]["advisories"]["Update"];

export type Advisor = Database["public"]["Tables"]["advisors"]["Row"];
export type AdvisorInsert = Database["public"]["Tables"]["advisors"]["Insert"];
export type AdvisorUpdate = Database["public"]["Tables"]["advisors"]["Update"];

// Extended advisor type with advisory info
export interface AdvisorWithAdvisory extends Advisor {
  advisory: Advisory | null;
}

// Tax documents types
export type TaxDocumentRow =
  Database["public"]["Tables"]["tax_documents"]["Row"];
export type TaxDocumentInsert =
  Database["public"]["Tables"]["tax_documents"]["Insert"];

// Match result from similarity search
export type TaxDocumentMatch =
  Database["public"]["Functions"]["match_tax_documents"]["Returns"][number];
