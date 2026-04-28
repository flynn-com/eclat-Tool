export type AppRole = 'admin' | 'employee';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: AppRole[];
}

export type ProjectStatus = 'active' | 'completed' | 'archived';
export type ProjectPhase = 'planung' | 'produktion' | 'postproduktion' | 'review' | 'abgeschlossen';
export type CampaignType = 'film' | 'foto' | 'social_media' | 'animation' | 'audio' | 'mixed';
export type NoteCategory = 'brainstorming' | 'moodboard' | 'marktanalyse' | 'strategie' | 'shooting_planung' | 'storyboard_shotlist' | 'produktion_notizen' | 'sonstiges';
export type TaskPhase = 'vorplanung' | 'produktion' | 'postproduktion';
export type TaskStatus = 'offen' | 'in_arbeit' | 'erledigt';
export type TeamRole = 'projektleitung' | 'kamera' | 'regie' | 'licht' | 'ton' | 'editor' | 'colorist' | 'grafik' | 'model_talent' | 'sonstiges';
export type EquipmentStatusType = 'geplant' | 'bestaetigt' | 'gepackt' | 'vor_ort' | 'zurueck';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  color: string;
  created_by: string | null;
  client_name: string | null;
  campaign_type: CampaignType | null;
  budget: number | null;
  deadline: string | null;
  phase: ProjectPhase;
  progress: number;
  briefing_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  category: NoteCategory;
  title: string | null;
  content: string;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  phase: TaskPhase;
  category: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee_id: string | null;
  assignee_name: string | null;
  due_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectTeamMember {
  id: string;
  project_id: string;
  user_id: string | null;
  external_name: string | null;
  external_contact: string | null;
  role: TeamRole;
  notes: string | null;
  created_at: string;
  profiles?: Pick<Profile, 'full_name'> | null;
}

export interface ProjectEquipmentItem {
  id: string;
  project_id: string;
  name: string;
  category: string | null;
  quantity: number;
  status: EquipmentStatusType;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectScheduleEntry {
  id: string;
  project_id: string;
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  is_manual: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeEntryWithRelations extends TimeEntry {
  profiles: Pick<Profile, 'full_name' | 'avatar_url'>;
  projects: Pick<Project, 'name' | 'color'> | null;
}

export interface Meeting {
  id: string;
  name: string;
  date: string;
  shared_notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingTask {
  id: string;
  meeting_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee_id: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
