export type Role = "citizen" | "admin" | "driver";

export type User = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  ecopoints: number;
};

export type ObjectItem = {
  id: number;
  user_id: number;
  name: string;
  quantity: number;
  category: string;
  condition: string;
  material?: string;
  working_condition?: string;
  usability?: string;
  damage_level?: string;
  hazardous?: boolean;
  description?: string;
  image_url?: string;
  classification: string;
  preferred_action: string;
  classification_reason?: string;
  classification_confidence: number;
  status: string;
};

export type Pickup = {
  id: number;
  object_id: number;
  user_id: number;
  driver_id?: number;
  address: string;
  status: string;
  ecopoints_awarded: number;
  bulk_group_id?: string;
  object?: ObjectItem;
  citizen?: User;
  driver?: User;
};

export type AdminStats = {
  total_users: number;
  total_objects: number;
  pending_pickups: number;
  completed_pickups: number;
  reusable: number;
  repairable: number;
  recyclable: number;
  disposable: number;
  total_ecopoints: number;
};
