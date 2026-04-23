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
          photo_url: string | null;
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
          photo_url?: string | null;
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
          photo_url?: string | null;
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
      cinema_preferences: {
        Row: {
          id: string;
          user_id: string;
          cinema_id: string;
          cinema_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          cinema_id: string;
          cinema_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cinema_id?: string;
          cinema_name?: string;
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
      profiles: {
        Row: {
          user_id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_contacts: {
        Row: {
          id: string;
          user_id: string;
          contact_user_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          nickname: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          contact_user_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
          nickname?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contact_user_id?: string;
          status?: 'pending' | 'accepted' | 'blocked';
          nickname?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activity_shares: {
        Row: {
          id: string;
          activity_id: string;
          shared_by_user_id: string;
          shared_with_user_id: string;
          can_edit: boolean;
          hidden: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          shared_by_user_id?: string;
          shared_with_user_id: string;
          can_edit?: boolean;
          hidden?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          activity_id?: string;
          shared_by_user_id?: string;
          shared_with_user_id?: string;
          can_edit?: boolean;
          hidden?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      backlog_shares: {
        Row: {
          id: string;
          backlog_id: string;
          shared_by_user_id: string;
          shared_with_user_id: string;
          can_edit: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          backlog_id: string;
          shared_by_user_id?: string;
          shared_with_user_id: string;
          can_edit?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          backlog_id?: string;
          shared_by_user_id?: string;
          shared_with_user_id?: string;
          can_edit?: boolean;
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
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type UserContact = Database['public']['Tables']['user_contacts']['Row'];
export type UserContactInsert = Database['public']['Tables']['user_contacts']['Insert'];
export type ActivityShare = Database['public']['Tables']['activity_shares']['Row'];
export type ActivityShareInsert = Database['public']['Tables']['activity_shares']['Insert'];
export type BacklogShare = Database['public']['Tables']['backlog_shares']['Row'];
export type BacklogShareInsert = Database['public']['Tables']['backlog_shares']['Insert'];

// Types composés utilisés par les hooks
export type ContactWithProfile = UserContact & {
  profile: Profile;
  direction: 'outgoing' | 'incoming'; // émetteur ou destinataire de la demande
};

export type SharedActivity = WeeklyActivity & {
  isOwner: boolean;
  share?: ActivityShare;      // si c'est une activité reçue
  sharedByProfile?: Profile;  // si c'est une activité reçue
  sharedWith?: Array<{ share: ActivityShare; profile: Profile }>; // si c'est une activité que je possède
};
