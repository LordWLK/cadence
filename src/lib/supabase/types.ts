export type Database = {
  public: {
    Tables: {
      checkins: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          mood: number;
          energy: number;
          note: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          type: string;
          mood: number;
          energy: number;
          note?: string | null;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          mood?: number;
          energy?: number;
          note?: string | null;
          date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      weekly_activities: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string;
          planned_date: string;
          week_start: string;
          backlog_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          category: string;
          planned_date: string;
          week_start: string;
          backlog_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: string;
          planned_date?: string;
          week_start?: string;
          backlog_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      backlog_activities: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string;
          recurrence: string;
          recurrence_freq: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          category: string;
          recurrence?: string;
          recurrence_freq?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: string;
          recurrence?: string;
          recurrence_freq?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      sport_preferences: {
        Row: {
          id: string;
          user_id: string;
          sport: string;
          entity_type: string;
          entity_id: string;
          entity_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          sport: string;
          entity_type: string;
          entity_id: string;
          entity_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sport?: string;
          entity_type?: string;
          entity_id?: string;
          entity_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      selected_events: {
        Row: {
          id: string;
          user_id: string;
          sport: string;
          event_title: string;
          event_date: string;
          competition: string | null;
          is_big_match: boolean;
          source_api_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          sport: string;
          event_title: string;
          event_date: string;
          competition?: string | null;
          is_big_match?: boolean;
          source_api_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sport?: string;
          event_title?: string;
          event_date?: string;
          competition?: string | null;
          is_big_match?: boolean;
          source_api_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Checkin = Database['public']['Tables']['checkins']['Row'];
export type CheckinInsert = Database['public']['Tables']['checkins']['Insert'];
export type WeeklyActivity = Database['public']['Tables']['weekly_activities']['Row'];
export type WeeklyActivityInsert = Database['public']['Tables']['weekly_activities']['Insert'];
export type SportPreference = Database['public']['Tables']['sport_preferences']['Row'];
export type SportPreferenceInsert = Database['public']['Tables']['sport_preferences']['Insert'];
export type SelectedEvent = Database['public']['Tables']['selected_events']['Row'];
export type SelectedEventInsert = Database['public']['Tables']['selected_events']['Insert'];
export type BacklogActivity = Database['public']['Tables']['backlog_activities']['Row'];
export type BacklogActivityInsert = Database['public']['Tables']['backlog_activities']['Insert'];
