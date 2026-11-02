export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor: string
          created_at: string
          details: Json
          id: string
        }
        Insert: {
          action: string
          actor: string
          created_at?: string
          details?: Json
          id?: string
        }
        Update: {
          action?: string
          actor?: string
          created_at?: string
          details?: Json
          id?: string
        }
        Relationships: []
      }
      admin_tips: {
        Row: {
          content: string
          created_at: string
          id: string
          is_published: boolean
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          title?: string
        }
        Relationships: []
      }
      cl_attempts: {
        Row: {
          answers: Json
          deadline: string
          id: string
          match_id: string | null
          participant_id: string
          percentage: number
          question_ids: Json
          round: number
          score: number
          started_at: string
          status: string
          submitted_at: string | null
          total: number
          user_id: string
        }
        Insert: {
          answers?: Json
          deadline: string
          id?: string
          match_id?: string | null
          participant_id: string
          percentage?: number
          question_ids?: Json
          round: number
          score?: number
          started_at?: string
          status?: string
          submitted_at?: string | null
          total?: number
          user_id: string
        }
        Update: {
          answers?: Json
          deadline?: string
          id?: string
          match_id?: string | null
          participant_id?: string
          percentage?: number
          question_ids?: Json
          round?: number
          score?: number
          started_at?: string
          status?: string
          submitted_at?: string | null
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cl_attempts_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "cl_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cl_attempts_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "cl_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      cl_matches: {
        Row: {
          created_at: string
          decided_at: string | null
          id: string
          p1: string | null
          p2: string | null
          round: number
          slot: number
          winner: string | null
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          id?: string
          p1?: string | null
          p2?: string | null
          round: number
          slot: number
          winner?: string | null
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          id?: string
          p1?: string | null
          p2?: string | null
          round?: number
          slot?: number
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cl_matches_p1_fkey"
            columns: ["p1"]
            isOneToOne: false
            referencedRelation: "cl_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cl_matches_p2_fkey"
            columns: ["p2"]
            isOneToOne: false
            referencedRelation: "cl_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cl_matches_winner_fkey"
            columns: ["winner"]
            isOneToOne: false
            referencedRelation: "cl_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      cl_participants: {
        Row: {
          created_at: string
          emoji: string
          gender: string
          id: string
          is_warned: boolean
          name: string
          phone: string
          seed: number | null
          study_type: string
          user_id: string
          warning_note: string | null
        }
        Insert: {
          created_at?: string
          emoji: string
          gender: string
          id?: string
          is_warned?: boolean
          name: string
          phone: string
          seed?: number | null
          study_type: string
          user_id: string
          warning_note?: string | null
        }
        Update: {
          created_at?: string
          emoji?: string
          gender?: string
          id?: string
          is_warned?: boolean
          name?: string
          phone?: string
          seed?: number | null
          study_type?: string
          user_id?: string
          warning_note?: string | null
        }
        Relationships: []
      }
      cl_questions: {
        Row: {
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          image_url: string | null
          options: Json
          position: number
          question_text: string
          round: number
          subject: string
          track: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          options?: Json
          position?: number
          question_text?: string
          round: number
          subject: string
          track?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          options?: Json
          position?: number
          question_text?: string
          round?: number
          subject?: string
          track?: string
        }
        Relationships: [
          {
            foreignKeyName: "cl_questions_round_fkey"
            columns: ["round"]
            isOneToOne: false
            referencedRelation: "cl_rounds"
            referencedColumns: ["round"]
          },
        ]
      }
      cl_rounds: {
        Row: {
          duration_minutes: number
          end_at: string | null
          is_open: boolean
          question_limit: number | null
          round: number
          start_at: string | null
          updated_at: string
        }
        Insert: {
          duration_minutes?: number
          end_at?: string | null
          is_open?: boolean
          question_limit?: number | null
          round: number
          start_at?: string | null
          updated_at?: string
        }
        Update: {
          duration_minutes?: number
          end_at?: string | null
          is_open?: boolean
          question_limit?: number | null
          round?: number
          start_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cl_settings: {
        Row: {
          bracket_published: boolean
          id: number
          registration_open: boolean
          updated_at: string
        }
        Insert: {
          bracket_published?: boolean
          id?: number
          registration_open?: boolean
          updated_at?: string
        }
        Update: {
          bracket_published?: boolean
          id?: number
          registration_open?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      community_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          platform: string
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform: string
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      device_link_tokens: {
        Row: {
          created_at: string
          expires_at: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          answers: Json
          created_at: string
          exam_id: string
          id: string
          percentage: number
          score: number
          total: number
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          exam_id: string
          id?: string
          percentage?: number
          score?: number
          total?: number
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          exam_id?: string
          id?: string
          percentage?: number
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          correct_answer: string
          created_at: string
          exam_id: string
          explanation: string | null
          id: string
          image_url: string | null
          options: Json
          points: number
          position: number
          question_text: string
          question_type: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          exam_id: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          options?: Json
          points?: number
          position?: number
          question_text: string
          question_type?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          exam_id?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          options?: Json
          points?: number
          position?: number
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          name: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          subject: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          subject: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      library_items: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          file_type: string
          id: string
          subject: string
          thumbnail_url: string | null
          title: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_type: string
          id?: string
          subject: string
          thumbnail_url?: string | null
          title: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_type?: string
          id?: string
          subject?: string
          thumbnail_url?: string | null
          title?: string
          url?: string
        }
        Relationships: []
      }
      note_boards: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          board_id: string | null
          content: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "note_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          message: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          message: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          message?: string
          title?: string
        }
        Relationships: []
      }
      phone_logins: {
        Row: {
          created_at: string
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          phone: string
          user_id: string
        }
        Update: {
          created_at?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_sections: {
        Row: {
          is_visible: boolean
          key: string
          updated_at: string
        }
        Insert: {
          is_visible?: boolean
          key: string
          updated_at?: string
        }
        Update: {
          is_visible?: boolean
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      platform_updates: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_published: boolean
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_banned: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_banned?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_banned?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reward_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          ref: string
          shards: number
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          ref: string
          shards?: number
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          ref?: string
          shards?: number
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          id: string
          minutes: number
          mode: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          minutes?: number
          mode?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          minutes?: number
          mode?: string
          user_id?: string
        }
        Relationships: []
      }
      support_conversations: {
        Row: {
          created_at: string
          id: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          is_admin: boolean
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          channel_name: string
          channel_url: string
          created_at: string
          id: string
          image_url: string | null
          subject: string
          teacher_name: string | null
        }
        Insert: {
          channel_name: string
          channel_url: string
          created_at?: string
          id?: string
          image_url?: string | null
          subject: string
          teacher_name?: string | null
        }
        Update: {
          channel_name?: string
          channel_url?: string
          created_at?: string
          id?: string
          image_url?: string | null
          subject?: string
          teacher_name?: string | null
        }
        Relationships: []
      }
      todos: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          is_done: boolean
          priority: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          priority?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          priority?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string
          last_study_day: string | null
          level: number
          public_id: string
          shards: number
          shards_reached_at: string
          streak: number
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          last_study_day?: string | null
          level?: number
          public_id: string
          shards?: number
          shards_reached_at?: string
          streak?: number
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          last_study_day?: string | null
          level?: number
          public_id?: string
          shards?: number
          shards_reached_at?: string
          streak?: number
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      video_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          section: string
          subject: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          url: string
          video_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          section?: string
          subject: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          url: string
          video_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          section?: string
          subject?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string
          video_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_first_owner: { Args: never; Returns: undefined }
      award: {
        Args: {
          _kind: string
          _ref: string
          _shards: number
          _uid: string
          _xp: number
        }
        Returns: undefined
      }
      cl_admin_set_winner: {
        Args: { _match: string; _winner: string }
        Returns: undefined
      }
      cl_bracket_participants: {
        Args: never
        Returns: {
          emoji: string
          id: string
          is_warned: boolean
          name: string
        }[]
      }
      cl_finalize: { Args: { _attempt: string }; Returns: undefined }
      cl_get_exam: { Args: { _round: number }; Returns: Json }
      cl_is_participant: { Args: never; Returns: boolean }
      cl_participant_count: { Args: never; Returns: number }
      cl_place_winner: {
        Args: { _round: number; _slot: number; _winner: string }
        Returns: undefined
      }
      cl_refresh: { Args: never; Returns: undefined }
      cl_register: {
        Args: {
          _emoji: string
          _gender: string
          _name: string
          _phone: string
          _study_type: string
        }
        Returns: string
      }
      cl_resolve_match: { Args: { _match: string }; Returns: undefined }
      cl_save_answers: {
        Args: { _answers: Json; _round: number }
        Returns: boolean
      }
      cl_start_attempt: { Args: { _round: number }; Returns: string }
      cl_submit_attempt: {
        Args: { _answers: Json; _round: number }
        Returns: undefined
      }
      cl_taken_emojis: { Args: never; Returns: string[] }
      claim_level_up: { Args: never; Returns: Json }
      create_device_link: { Args: never; Returns: string }
      ensure_user_stats: { Args: { _uid: string }; Returns: undefined }
      gen_public_id: { Args: never; Returns: string }
      grant_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      honor_board: {
        Args: never
        Returns: {
          is_me: boolean
          level: number
          name: string
          rank: number
          shards: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      level_for_xp: { Args: { _xp: number }; Returns: number }
      level_xp_required: { Args: { _l: number }; Returns: number }
      my_stats: { Args: never; Returns: Json }
      revoke_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "owner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "owner"],
    },
  },
} as const
