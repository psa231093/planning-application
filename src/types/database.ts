export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          timezone: string;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          icon: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          target_date: string | null;
          status: string;
          progress: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          target_date?: string | null;
          status?: string;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          target_date?: string | null;
          status?: string;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          goal_id: string | null;
          title: string;
          description: string | null;
          priority: "low" | "medium" | "high" | "urgent";
          status:
            | "unscheduled"
            | "pending"
            | "in_progress"
            | "completed"
            | "overdue";
          estimated_minutes: number | null;
          actual_minutes: number | null;
          scheduled_start: string | null;
          scheduled_end: string | null;
          completed_at: string | null;
          is_recurring: boolean;
          recurrence_rule: Json | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          goal_id?: string | null;
          title: string;
          description?: string | null;
          priority?: "low" | "medium" | "high" | "urgent";
          status?:
            | "unscheduled"
            | "pending"
            | "in_progress"
            | "completed"
            | "overdue";
          estimated_minutes?: number | null;
          actual_minutes?: number | null;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          completed_at?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: Json | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          goal_id?: string | null;
          title?: string;
          description?: string | null;
          priority?: "low" | "medium" | "high" | "urgent";
          status?:
            | "unscheduled"
            | "pending"
            | "in_progress"
            | "completed"
            | "overdue";
          estimated_minutes?: number | null;
          actual_minutes?: number | null;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          completed_at?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: Json | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_task_instances: {
        Row: {
          id: string;
          parent_task_id: string;
          user_id: string;
          occurrence_date: string;
          status: string;
          scheduled_start: string | null;
          scheduled_end: string | null;
          actual_minutes: number | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_task_id: string;
          user_id: string;
          occurrence_date: string;
          status?: string;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          actual_minutes?: number | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_task_id?: string;
          user_id?: string;
          occurrence_date?: string;
          status?: string;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          actual_minutes?: number | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_task_instances_parent_task_id_fkey";
            columns: ["parent_task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_task_instances_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      time_entries: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          duration: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          started_at: string;
          ended_at?: string | null;
          duration?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          started_at?: string;
          ended_at?: string | null;
          duration?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "time_entries_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "time_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_summaries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          total_tasks: number;
          completed_tasks: number;
          overdue_tasks: number;
          total_planned_min: number;
          total_actual_min: number;
          productivity_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          total_tasks?: number;
          completed_tasks?: number;
          overdue_tasks?: number;
          total_planned_min?: number;
          total_actual_min?: number;
          productivity_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          total_tasks?: number;
          completed_tasks?: number;
          overdue_tasks?: number;
          total_planned_min?: number;
          total_actual_min?: number;
          productivity_score?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_summaries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_task_metrics: {
        Args: {
          p_user_id: string;
          p_start_date: string;
          p_end_date: string;
        };
        Returns: Json;
      };
      get_tasks_by_category: {
        Args: {
          p_user_id: string;
          p_start_date: string;
          p_end_date: string;
        };
        Returns: Json;
      };
      get_daily_completion: {
        Args: {
          p_user_id: string;
          p_start_date: string;
          p_end_date: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
