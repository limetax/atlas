/**
 * Database types for Supabase
 * These types represent the database schema for limetaxIQ
 *
 * Tables:
 * - advisories: Tax advisory firms (Kanzleien)
 * - advisors: Staff members linked to auth.users
 * - clients: Client accounts (future)
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

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
          role: 'user' | 'admin';
          created_at: string;
          image_url: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          advisory_id?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          image_url?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          advisory_id?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          image_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'advisors_advisory_id_fkey';
            columns: ['advisory_id'];
            referencedRelation: 'advisories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'advisors_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
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
      datev_addressees: {
        Row: {
          id: string;
          addressee_id: string;
          addressee_type: number;
          full_name: string;
          updated_at: string;
          addressee_status: string | null;
          status: string | null;
          birth_date: string | null;
          age: number | null;
          main_email: string | null;
          main_phone: string | null;
          main_fax: string | null;
          correspondence_street: string | null;
          correspondence_city: string | null;
          correspondence_zip_code: string | null;
          tax_number_vat: string | null;
          identification_number: string | null;
          vat_id: string | null;
          company_entity_type: string | null;
          company_object: string | null;
          foundation_date: string | null;
          industry_description: string | null;
          noble_title: string | null;
          academic_title: string | null;
          salutation: string | null;
          gender: string | null;
          is_client: number | null;
          is_legal_representative_of_person: number | null;
          is_legal_representative_of_company: number | null;
          is_shareholder: number | null;
          is_business_owner: number | null;
          embedding_text: string;
          embedding: number[] | null;
          metadata: Json;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          addressee_id: string;
          addressee_type: number;
          full_name: string;
          updated_at: string;
          addressee_status?: string | null;
          status?: string | null;
          birth_date?: string | null;
          age?: number | null;
          main_email?: string | null;
          main_phone?: string | null;
          main_fax?: string | null;
          correspondence_street?: string | null;
          correspondence_city?: string | null;
          correspondence_zip_code?: string | null;
          tax_number_vat?: string | null;
          identification_number?: string | null;
          vat_id?: string | null;
          company_entity_type?: string | null;
          company_object?: string | null;
          foundation_date?: string | null;
          industry_description?: string | null;
          noble_title?: string | null;
          academic_title?: string | null;
          salutation?: string | null;
          gender?: string | null;
          is_client?: number | null;
          is_legal_representative_of_person?: number | null;
          is_legal_representative_of_company?: number | null;
          is_shareholder?: number | null;
          is_business_owner?: number | null;
          embedding_text: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          addressee_id?: string;
          addressee_type?: number;
          full_name?: string;
          updated_at?: string;
          addressee_status?: string | null;
          status?: string | null;
          birth_date?: string | null;
          age?: number | null;
          main_email?: string | null;
          main_phone?: string | null;
          main_fax?: string | null;
          correspondence_street?: string | null;
          correspondence_city?: string | null;
          correspondence_zip_code?: string | null;
          tax_number_vat?: string | null;
          identification_number?: string | null;
          vat_id?: string | null;
          company_entity_type?: string | null;
          company_object?: string | null;
          foundation_date?: string | null;
          industry_description?: string | null;
          noble_title?: string | null;
          academic_title?: string | null;
          salutation?: string | null;
          gender?: string | null;
          is_client?: number | null;
          is_legal_representative_of_person?: number | null;
          is_legal_representative_of_company?: number | null;
          is_shareholder?: number | null;
          is_business_owner?: number | null;
          embedding_text?: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      datev_clients: {
        Row: {
          id: string;
          client_id: string;
          client_number: number;
          client_name: string;
          client_status: string;
          status: string;
          updated_at: string;
          is_online: number;
          differing_name: string | null;
          client_type: number | null;
          client_from: string | null;
          client_until: string | null;
          natural_person_id: string | null;
          legal_person_id: string | null;
          organization_id: string | null;
          establishment_id: string | null;
          area_id: string | null;
          establishment_number: number | null;
          establishment_name: string | null;
          organization_number: number | null;
          organization_name: string | null;
          functional_area_name: string | null;
          main_email: string | null;
          main_phone: string | null;
          main_fax: string | null;
          correspondence_street: string | null;
          correspondence_city: string | null;
          correspondence_zip_code: string | null;
          tax_number_vat: string | null;
          identification_number: string | null;
          company_form: string | null;
          industry_description: string | null;
          managing_director_name: string | null;
          managing_director_email: string | null;
          managing_director_phone: string | null;
          managing_director_title: string | null;
          embedding_text: string;
          embedding: number[] | null;
          metadata: Json;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          client_number: number;
          client_name: string;
          client_status: string;
          status: string;
          updated_at: string;
          is_online: number;
          differing_name?: string | null;
          client_type?: number | null;
          client_from?: string | null;
          client_until?: string | null;
          natural_person_id?: string | null;
          legal_person_id?: string | null;
          organization_id?: string | null;
          establishment_id?: string | null;
          area_id?: string | null;
          establishment_number?: number | null;
          establishment_name?: string | null;
          organization_number?: number | null;
          organization_name?: string | null;
          functional_area_name?: string | null;
          main_email?: string | null;
          main_phone?: string | null;
          main_fax?: string | null;
          correspondence_street?: string | null;
          correspondence_city?: string | null;
          correspondence_zip_code?: string | null;
          tax_number_vat?: string | null;
          identification_number?: string | null;
          company_form?: string | null;
          industry_description?: string | null;
          managing_director_name?: string | null;
          managing_director_email?: string | null;
          managing_director_phone?: string | null;
          managing_director_title?: string | null;
          embedding_text: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          client_number?: number;
          client_name?: string;
          client_status?: string;
          status?: string;
          updated_at?: string;
          is_online?: number;
          differing_name?: string | null;
          client_type?: number | null;
          client_from?: string | null;
          client_until?: string | null;
          natural_person_id?: string | null;
          legal_person_id?: string | null;
          organization_id?: string | null;
          establishment_id?: string | null;
          area_id?: string | null;
          establishment_number?: number | null;
          establishment_name?: string | null;
          organization_number?: number | null;
          organization_name?: string | null;
          functional_area_name?: string | null;
          main_email?: string | null;
          main_phone?: string | null;
          main_fax?: string | null;
          correspondence_street?: string | null;
          correspondence_city?: string | null;
          correspondence_zip_code?: string | null;
          tax_number_vat?: string | null;
          identification_number?: string | null;
          company_form?: string | null;
          industry_description?: string | null;
          managing_director_name?: string | null;
          managing_director_email?: string | null;
          managing_director_phone?: string | null;
          managing_director_title?: string | null;
          embedding_text?: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      datev_accounting_postings: {
        Row: {
          id: string;
          client_id: string;
          client_name: string;
          date: string;
          account_number: number;
          account_name: string | null;
          contra_account_number: number;
          posting_description: string;
          tax_rate: number;
          document_field_1: string;
          document_field_2: string;
          amount: number;
          debit_credit_indicator: string;
          currency_code: string;
          exchange_rate: number;
          record_type: string;
          accounting_transaction_key: number;
          general_reversal: number;
          document_link: string;
          fiscal_year: number;
          embedding_text: string;
          embedding: number[] | null;
          metadata: Json;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          client_name: string;
          date: string;
          account_number: number;
          account_name?: string | null;
          contra_account_number: number;
          posting_description: string;
          tax_rate: number;
          document_field_1: string;
          document_field_2: string;
          amount: number;
          debit_credit_indicator: string;
          currency_code: string;
          exchange_rate: number;
          record_type: string;
          accounting_transaction_key: number;
          general_reversal: number;
          document_link: string;
          fiscal_year: number;
          embedding_text: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          client_name?: string;
          date?: string;
          account_number?: number;
          account_name?: string | null;
          contra_account_number?: number;
          posting_description?: string;
          tax_rate?: number;
          document_field_1?: string;
          document_field_2?: string;
          amount?: number;
          debit_credit_indicator?: string;
          currency_code?: string;
          exchange_rate?: number;
          record_type?: string;
          accounting_transaction_key?: number;
          general_reversal?: number;
          document_link?: string;
          fiscal_year?: number;
          embedding_text?: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      datev_susa: {
        Row: {
          id: string;
          client_id: string;
          client_name: string;
          fiscal_year: number;
          month: number | null;
          account_number: number;
          label: string | null;
          debit_total: number;
          credit_total: number;
          current_month_debit: number;
          current_month_credit: number;
          debit_credit_code: string;
          balance: number;
          transaction_count: number;
          current_month_transaction_count: number | null;
          embedding_text: string;
          embedding: number[] | null;
          metadata: Json;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          client_name: string;
          fiscal_year: number;
          month?: number | null;
          account_number: number;
          label?: string | null;
          debit_total: number;
          credit_total: number;
          current_month_debit: number;
          current_month_credit: number;
          debit_credit_code: string;
          balance: number;
          transaction_count: number;
          current_month_transaction_count?: number | null;
          embedding_text: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          client_name?: string;
          fiscal_year?: number;
          month?: number | null;
          account_number?: number;
          label?: string | null;
          debit_total?: number;
          credit_total?: number;
          current_month_debit?: number;
          current_month_credit?: number;
          debit_credit_code?: string;
          balance?: number;
          transaction_count?: number;
          current_month_transaction_count?: number | null;
          embedding_text?: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      datev_documents: {
        Row: {
          id: string;
          document_id: string | null;
          document_number: number | null;
          client_id: string;
          client_number: number;
          description: string | null;
          extension: string | null;
          case_number: string | null;
          file_name: string | null;
          file_size_bytes: number | null;
          folder_id: number | null;
          folder_name: string | null;
          year: number | null;
          month: number | null;
          keywords: string | null;
          import_date_time: string | null;
          create_date_time: string | null;
          change_date_time: string | null;
          priority: string | null;
          archived: boolean | null;
          read_only: number | null;
          s3_bucket: string | null;
          s3_key: string | null;
          s3_url: string | null;
          embedding_text: string;
          embedding: number[] | null;
          metadata: Json;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          document_number?: number | null;
          client_id: string;
          client_number: number;
          description?: string | null;
          extension?: string | null;
          case_number?: string | null;
          file_name?: string | null;
          file_size_bytes?: number | null;
          folder_id?: number | null;
          folder_name?: string | null;
          year?: number | null;
          month?: number | null;
          keywords?: string | null;
          import_date_time?: string | null;
          create_date_time?: string | null;
          change_date_time?: string | null;
          priority?: string | null;
          archived?: boolean | null;
          read_only?: number | null;
          s3_bucket?: string | null;
          s3_key?: string | null;
          s3_url?: string | null;
          embedding_text: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          document_number?: number;
          client_id?: string;
          client_number?: number;
          description?: string;
          extension?: string;
          case_number?: string;
          file_name?: string | null;
          file_size_bytes?: number | null;
          folder_id?: number | null;
          folder_name?: string | null;
          year?: number | null;
          month?: number | null;
          keywords?: string | null;
          import_date_time?: string | null;
          create_date_time?: string;
          change_date_time?: string;
          priority?: string | null;
          archived?: boolean | null;
          read_only?: number;
          s3_bucket?: string | null;
          s3_key?: string | null;
          s3_url?: string | null;
          embedding_text?: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      datev_orders: {
        Row: {
          id: string;
          order_id: number;
          creation_year: number;
          order_number: number;
          order_name: string;
          ordertype: string;
          ordertype_group: string | null;
          assessment_year: number | null;
          fiscal_year: number | null;
          client_id: string;
          client_name: string;
          completion_status: string;
          billing_status: string;
          date_completion_status: string | null;
          date_billing_status: string | null;
          embedding_text: string;
          embedding: number[] | null;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: number;
          creation_year: number;
          order_number: number;
          order_name: string;
          ordertype: string;
          ordertype_group?: string | null;
          assessment_year?: number | null;
          fiscal_year?: number | null;
          client_id: string;
          client_name: string;
          completion_status: string;
          billing_status: string;
          date_completion_status?: string | null;
          date_billing_status?: string | null;
          embedding_text: string;
          embedding?: number[] | null;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: number;
          creation_year?: number;
          order_number?: number;
          order_name?: string;
          ordertype?: string;
          ordertype_group?: string | null;
          assessment_year?: number | null;
          fiscal_year?: number | null;
          client_id?: string;
          client_name?: string;
          completion_status?: string;
          billing_status?: string;
          date_completion_status?: string | null;
          date_billing_status?: string | null;
          embedding_text?: string;
          embedding?: number[] | null;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      datev_relationships: {
        Row: {
          id: string;
          relationship_id: string;
          source_addressee_id: string;
          target_addressee_id: string;
          relationship_type: string;
          updated_at: string;
          relationship_name: string | null;
          relationship_abbreviation: string | null;
          target_addressee_type: string | null;
          target_addressee_name: string | null;
          source_addressee_type: string | null;
          source_addressee_name: string | null;
          relationship_from: string | null;
          relationship_until: string | null;
          note: string | null;
          explanation: string | null;
          holding_period: string | null;
          shareholder_type: string | null;
          profit_share: number | null;
          participation_amount: number | null;
          capital: number | null;
          liquidation_proceeds: number | null;
          subscriber_number: number | null;
          is_silent_partner: boolean | null;
          participant_number: number | null;
          earnings_share_fraction: string | null;
          is_indirect_partner: boolean | null;
          nominal_share: number | null;
          nominal_share_fraction: string | null;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          relationship_id: string;
          source_addressee_id: string;
          target_addressee_id: string;
          relationship_type: string;
          updated_at: string;
          relationship_name?: string | null;
          relationship_abbreviation?: string | null;
          target_addressee_type?: string | null;
          target_addressee_name?: string | null;
          source_addressee_type?: string | null;
          source_addressee_name?: string | null;
          relationship_from?: string | null;
          relationship_until?: string | null;
          note?: string | null;
          explanation?: string | null;
          holding_period?: string | null;
          shareholder_type?: string | null;
          profit_share?: number | null;
          participation_amount?: number | null;
          capital?: number | null;
          liquidation_proceeds?: number | null;
          subscriber_number?: number | null;
          is_silent_partner?: boolean | null;
          participant_number?: number | null;
          earnings_share_fraction?: string | null;
          is_indirect_partner?: boolean | null;
          nominal_share?: number | null;
          nominal_share_fraction?: string | null;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          relationship_id?: string;
          source_addressee_id?: string;
          target_addressee_id?: string;
          relationship_type?: string;
          updated_at?: string;
          relationship_name?: string | null;
          relationship_abbreviation?: string | null;
          target_addressee_type?: string | null;
          target_addressee_name?: string | null;
          source_addressee_type?: string | null;
          source_addressee_name?: string | null;
          relationship_from?: string | null;
          relationship_until?: string | null;
          note?: string | null;
          explanation?: string | null;
          holding_period?: string | null;
          shareholder_type?: string | null;
          profit_share?: number | null;
          participation_amount?: number | null;
          capital?: number | null;
          liquidation_proceeds?: number | null;
          subscriber_number?: number | null;
          is_silent_partner?: boolean | null;
          participant_number?: number | null;
          earnings_share_fraction?: string | null;
          is_indirect_partner?: boolean | null;
          nominal_share?: number | null;
          nominal_share_fraction?: string | null;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      datev_corp_tax: {
        Row: {
          id: string;
          corp_tax_id: string;
          client_id: string;
          client_name: string;
          year: number;
          order_term: number | null;
          description: string | null;
          type: number | null;
          status: number | null;
          saved: number | null;
          deleted: number | null;
          migrated_to_pro: boolean | null;
          elster_telenumber: string | null;
          tnr_provided: string | null;
          datev_arrival: string | null;
          transmission_date: string | null;
          transmission_status: string | null;
          tax_office_arrival: string | null;
          embedding_text: string;
          embedding: number[] | null;
          metadata: Json;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          corp_tax_id: string;
          client_id: string;
          client_name: string;
          year: number;
          order_term?: number | null;
          description?: string | null;
          type?: number | null;
          status?: number | null;
          saved?: number | null;
          deleted?: number | null;
          migrated_to_pro?: boolean | null;
          elster_telenumber?: string | null;
          tnr_provided?: string | null;
          datev_arrival?: string | null;
          transmission_date?: string | null;
          transmission_status?: string | null;
          tax_office_arrival?: string | null;
          embedding_text: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          corp_tax_id?: string;
          client_id?: string;
          client_name?: string;
          year?: number;
          order_term?: number | null;
          description?: string | null;
          type?: number | null;
          status?: number | null;
          saved?: number | null;
          deleted?: number | null;
          migrated_to_pro?: boolean | null;
          elster_telenumber?: string | null;
          tnr_provided?: string | null;
          datev_arrival?: string | null;
          transmission_date?: string | null;
          transmission_status?: string | null;
          tax_office_arrival?: string | null;
          embedding_text?: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      datev_trade_tax: {
        Row: {
          id: string;
          trade_tax_id: string;
          client_id: string;
          client_name: string;
          year: number;
          order_term: number | null;
          description: string | null;
          type: number | null;
          status: number | null;
          saved: number | null;
          deleted: number | null;
          migrated_to_pro: boolean | null;
          elster_telenumber: string | null;
          tnr_provided: string | null;
          datev_arrival: string | null;
          transmission_date: string | null;
          transmission_status: string | null;
          tax_office_arrival: string | null;
          embedding_text: string;
          embedding: number[] | null;
          metadata: Json;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trade_tax_id: string;
          client_id: string;
          client_name: string;
          year: number;
          order_term?: number | null;
          description?: string | null;
          type?: number | null;
          status?: number | null;
          saved?: number | null;
          deleted?: number | null;
          migrated_to_pro?: boolean | null;
          elster_telenumber?: string | null;
          tnr_provided?: string | null;
          datev_arrival?: string | null;
          transmission_date?: string | null;
          transmission_status?: string | null;
          tax_office_arrival?: string | null;
          embedding_text: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trade_tax_id?: string;
          client_id?: string;
          client_name?: string;
          year?: number;
          order_term?: number | null;
          description?: string | null;
          type?: number | null;
          status?: number | null;
          saved?: number | null;
          deleted?: number | null;
          migrated_to_pro?: boolean | null;
          elster_telenumber?: string | null;
          tnr_provided?: string | null;
          datev_arrival?: string | null;
          transmission_date?: string | null;
          transmission_status?: string | null;
          tax_office_arrival?: string | null;
          embedding_text?: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      datev_analytics_order_values: {
        Row: {
          id: string;
          client_id: string;
          client_name: string;
          year: number;
          month: number;
          order_value: number;
          order_count: number;
          embedding_text: string;
          embedding: number[] | null;
          metadata: Json;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          client_name: string;
          year: number;
          month: number;
          order_value: number;
          order_count: number;
          embedding_text: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          client_name?: string;
          year?: number;
          month?: number;
          order_value?: number;
          order_count?: number;
          embedding_text?: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      datev_analytics_processing_status: {
        Row: {
          id: string;
          client_id: string;
          client_name: string;
          year: number;
          total_orders: number;
          completed_orders: number;
          pending_orders: number;
          completion_rate: number | null;
          embedding_text: string;
          embedding: number[] | null;
          metadata: Json;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          client_name: string;
          year: number;
          total_orders: number;
          completed_orders: number;
          pending_orders: number;
          completion_rate?: number | null;
          embedding_text: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          client_name?: string;
          year?: number;
          total_orders?: number;
          completed_orders?: number;
          pending_orders?: number;
          completion_rate?: number | null;
          embedding_text?: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      datev_analytics_expenses: {
        Row: {
          id: string;
          client_id: string;
          client_name: string;
          year: number;
          expense_category: string | null;
          total_amount: number;
          embedding_text: string;
          embedding: number[] | null;
          metadata: Json;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          client_name: string;
          year: number;
          expense_category?: string | null;
          total_amount: number;
          embedding_text: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          client_name?: string;
          year?: number;
          expense_category?: string | null;
          total_amount?: number;
          embedding_text?: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      datev_analytics_fees: {
        Row: {
          id: string;
          client_id: string;
          client_name: string;
          year: number;
          fee_type: string | null;
          total_amount: number;
          embedding_text: string;
          embedding: number[] | null;
          metadata: Json;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          client_name: string;
          year: number;
          fee_type?: string | null;
          total_amount: number;
          embedding_text: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          client_name?: string;
          year?: number;
          fee_type?: string | null;
          total_amount?: number;
          embedding_text?: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      datev_hr_employees: {
        Row: {
          id: string;
          client_id: string;
          client_number: number;
          client_name: string;
          employee_number: number;
          employee_id: string;
          full_name: string;
          birth_date: string | null;
          gender: string | null;
          nationality: string | null;
          employment_start: string | null;
          employment_end: string | null;
          position: string | null;
          department: string | null;
          salary_group: string | null;
          email: string | null;
          phone: string | null;
          address_street: string | null;
          address_city: string | null;
          address_zip_code: string | null;
          is_active: boolean | null;
          embedding_text: string;
          embedding: number[] | null;
          metadata: Json;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          client_number: number;
          client_name: string;
          employee_number: number;
          employee_id: string;
          full_name: string;
          birth_date?: string | null;
          gender?: string | null;
          nationality?: string | null;
          employment_start?: string | null;
          employment_end?: string | null;
          position?: string | null;
          department?: string | null;
          salary_group?: string | null;
          email?: string | null;
          phone?: string | null;
          address_street?: string | null;
          address_city?: string | null;
          address_zip_code?: string | null;
          is_active?: boolean | null;
          embedding_text: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          client_number?: number;
          client_name?: string;
          employee_number?: number;
          employee_id?: string;
          full_name?: string;
          birth_date?: string | null;
          gender?: string | null;
          nationality?: string | null;
          employment_start?: string | null;
          employment_end?: string | null;
          position?: string | null;
          department?: string | null;
          salary_group?: string | null;
          email?: string | null;
          phone?: string | null;
          address_street?: string | null;
          address_city?: string | null;
          address_zip_code?: string | null;
          is_active?: boolean | null;
          embedding_text?: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      datev_hr_transactions: {
        Row: {
          id: string;
          client_id: string;
          client_number: number;
          employee_number: number;
          transaction_date: string;
          transaction_type: string;
          wage_type: number | null;
          amount: number;
          description: string | null;
          embedding_text: string;
          embedding: number[] | null;
          metadata: Json;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          client_number: number;
          employee_number: number;
          transaction_date: string;
          transaction_type: string;
          wage_type?: number | null;
          amount: number;
          description?: string | null;
          embedding_text: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          client_number?: number;
          employee_number?: number;
          transaction_date?: string;
          transaction_type?: string;
          wage_type?: number | null;
          amount?: number;
          description?: string | null;
          embedding_text?: string;
          embedding?: number[] | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      datev_client_services: {
        Row: {
          id: string;
          client_id: string;
          service_code: string;
          service_name: string;
          is_active: boolean | null;
          activated_date: string | null;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          service_code: string;
          service_name: string;
          is_active?: boolean | null;
          activated_date?: string | null;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          service_code?: string;
          service_name?: string;
          is_active?: boolean | null;
          activated_date?: string | null;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      chats: {
        Row: {
          id: string;
          advisor_id: string;
          title: string;
          context: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          advisor_id: string;
          title?: string;
          context?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          advisor_id?: string;
          title?: string;
          context?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chats_advisor_id_fkey';
            columns: ['advisor_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_messages: {
        Row: {
          id: string;
          chat_id: string;
          role: 'user' | 'assistant';
          content: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          role: 'user' | 'assistant';
          content: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_chat_id_fkey';
            columns: ['chat_id'];
            referencedRelation: 'chats';
            referencedColumns: ['id'];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          advisory_id: string;
          client_id: string | null;
          uploaded_by: string;
          name: string;
          size_bytes: number;
          storage_path: string;
          mime_type: string;
          source: 'limetaxos' | 'datev';
          datev_document_id: string | null;
          status: 'processing' | 'ready' | 'error';
          error_message: string | null;
          chunk_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          advisory_id: string;
          client_id?: string | null;
          uploaded_by: string;
          name: string;
          size_bytes: number;
          storage_path: string;
          mime_type: string;
          source?: 'limetaxos' | 'datev';
          datev_document_id?: string | null;
          status?: 'processing' | 'ready' | 'error';
          error_message?: string | null;
          chunk_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          advisory_id?: string;
          client_id?: string | null;
          uploaded_by?: string;
          name?: string;
          size_bytes?: number;
          storage_path?: string;
          mime_type?: string;
          source?: 'limetaxos' | 'datev';
          datev_document_id?: string | null;
          status?: 'processing' | 'ready' | 'error';
          error_message?: string | null;
          chunk_count?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_advisory_id_fkey';
            columns: ['advisory_id'];
            referencedRelation: 'advisories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_uploaded_by_fkey';
            columns: ['uploaded_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      document_chunks: {
        Row: {
          id: string;
          document_id: string;
          advisory_id: string;
          content: string;
          page_number: number | null;
          chunk_index: number;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          advisory_id: string;
          content: string;
          page_number?: number | null;
          chunk_index: number;
          embedding?: number[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          advisory_id?: string;
          content?: string;
          page_number?: number | null;
          chunk_index?: number;
          embedding?: number[] | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'document_chunks_document_id_fkey';
            columns: ['document_id'];
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_documents: {
        Row: {
          id: string;
          chat_id: string;
          document_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          document_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          document_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_documents_chat_id_fkey';
            columns: ['chat_id'];
            referencedRelation: 'chats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_documents_document_id_fkey';
            columns: ['document_id'];
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
        ];
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
      match_datev_clients: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_client_status?: string | null;
          filter_organization_id?: string | null;
          filter_industry?: string | null;
        };
        Returns: {
          id: string;
          client_id: string;
          client_number: number;
          client_name: string;
          client_type: number | null;
          client_status: string;
          company_form: string | null;
          industry_description: string | null;
          main_email: string | null;
          main_phone: string | null;
          correspondence_city: string | null;
          organization_name: string | null;
          managing_director_name: string | null;
          managing_director_email: string | null;
          managing_director_phone: string | null;
          similarity: number;
        }[];
      };
      match_datev_orders: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          order_id: number;
          creation_year: number;
          order_number: number;
          order_name: string;
          ordertype: string;
          client_id: string;
          client_name: string;
          completion_status: string;
          billing_status: string;
          similarity: number;
        }[];
      };
      match_datev_addressees: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_addressee_type?: number | null;
          filter_is_legal_representative?: number | null;
        };
        Returns: {
          id: string;
          addressee_id: string;
          full_name: string;
          addressee_type: number;
          main_email: string | null;
          main_phone: string | null;
          correspondence_city: string | null;
          company_entity_type: string | null;
          is_legal_representative_of_company: number | null;
          similarity: number;
        }[];
      };
      match_datev_postings: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_client_id?: string | null;
          filter_fiscal_year?: number | null;
          filter_account_number?: number | null;
          filter_date_from?: string | null;
          filter_date_to?: string | null;
          filter_min_amount?: number | null;
        };
        Returns: {
          id: string;
          client_id: string;
          client_name: string;
          date: string;
          account_number: number;
          account_name: string | null;
          posting_description: string;
          amount: number;
          debit_credit_indicator: string;
          document_field_1: string;
          fiscal_year: number;
          similarity: number;
        }[];
      };
      match_datev_susa: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_client_id?: string | null;
          filter_fiscal_year?: number | null;
          filter_account_number?: number | null;
          filter_negative_balance?: boolean | null;
        };
        Returns: {
          id: string;
          client_id: string;
          client_name: string;
          fiscal_year: number;
          month: number | null;
          account_number: number;
          label: string;
          opening_balance: number;
          debit_total: number;
          credit_total: number;
          closing_balance: number;
          transaction_count: number;
          similarity: number;
        }[];
      };
      match_datev_documents: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_client_id?: string | null;
          filter_year?: number | null;
          filter_extension?: string | null;
          filter_date_from?: string | null;
        };
        Returns: {
          id: string;
          document_id: string;
          document_number: number;
          client_id: string;
          description: string;
          extension: string;
          file_name: string | null;
          keywords: string | null;
          year: number | null;
          import_date_time: string | null;
          s3_key: string | null;
          similarity: number;
        }[];
      };
      match_datev_corp_tax: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_client_id?: string | null;
          filter_year?: number | null;
          filter_status?: number | null;
        };
        Returns: {
          id: string;
          corp_tax_id: string;
          client_id: string;
          client_name: string;
          year: number;
          status: number;
          transmission_status: string;
          similarity: number;
        }[];
      };
      match_datev_trade_tax: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_client_id?: string | null;
          filter_year?: number | null;
          filter_status?: number | null;
        };
        Returns: {
          id: string;
          trade_tax_id: string;
          client_id: string;
          client_name: string;
          year: number;
          status: number;
          transmission_status: string;
          similarity: number;
        }[];
      };
      match_datev_analytics_order_values: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_client_id?: string | null;
          filter_year?: number | null;
        };
        Returns: {
          id: string;
          client_id: string;
          client_name: string;
          year: number;
          month: number;
          order_value: number;
          order_count: number;
          similarity: number;
        }[];
      };
      match_datev_hr_employees: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_client_id?: string | null;
          filter_department?: string | null;
          filter_is_active?: boolean | null;
        };
        Returns: {
          id: string;
          employee_id: string;
          client_id: string;
          client_name: string;
          full_name: string;
          position: string;
          department: string;
          email: string;
          is_active: boolean;
          similarity: number;
        }[];
      };
      match_law_publisher_documents: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          title: string;
          citation: string | null;
          document_type: string;
          content: string;
          summary: string | null;
          publisher: string | null;
          source: string | null;
          law_reference: string | null;
          court: string | null;
          case_number: string | null;
          decision_date: string | null;
          publication_date: string | null;
          author: string | null;
          tags: string[] | null;
          similarity: number;
        }[];
      };
      match_document_chunks: {
        Args: {
          query_embedding: number[];
          p_document_ids: string[];
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          document_id: string;
          content: string;
          page_number: number | null;
          chunk_index: number;
          document_name: string;
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
export type Advisory = Database['public']['Tables']['advisories']['Row'];
export type AdvisoryInsert = Database['public']['Tables']['advisories']['Insert'];
export type AdvisoryUpdate = Database['public']['Tables']['advisories']['Update'];

export type Advisor = Database['public']['Tables']['advisors']['Row'];
export type AdvisorInsert = Database['public']['Tables']['advisors']['Insert'];
export type AdvisorUpdate = Database['public']['Tables']['advisors']['Update'];

// Extended advisor type with advisory info
export interface AdvisorWithAdvisory extends Advisor {
  advisory: Advisory | null;
}

// Tax documents types
export type TaxDocumentRow = Database['public']['Tables']['tax_documents']['Row'];
export type TaxDocumentInsert = Database['public']['Tables']['tax_documents']['Insert'];

// Match result from similarity search
export type TaxDocumentMatch =
  Database['public']['Functions']['match_tax_documents']['Returns'][number];

// Chat types
export type ChatRow = Database['public']['Tables']['chats']['Row'];
export type ChatInsert = Database['public']['Tables']['chats']['Insert'];
export type ChatUpdate = Database['public']['Tables']['chats']['Update'];

export type ChatMessageRow = Database['public']['Tables']['chat_messages']['Row'];
export type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

// Document types (advisory-scoped)
export type DocumentRow = Database['public']['Tables']['documents']['Row'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
export type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

export type DocumentChunkRow = Database['public']['Tables']['document_chunks']['Row'];
export type DocumentChunkInsert = Database['public']['Tables']['document_chunks']['Insert'];

// Chat-document join table
export type ChatDocumentLinkRow = Database['public']['Tables']['chat_documents']['Row'];
export type ChatDocumentLinkInsert = Database['public']['Tables']['chat_documents']['Insert'];
