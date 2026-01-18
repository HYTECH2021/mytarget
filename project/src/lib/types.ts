export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      targets: {
        Row: Target;
        Insert: Omit<Target, 'id' | 'created_at' | 'updated_at' | 'status'>;
        Update: Partial<Omit<Target, 'id' | 'created_at' | 'user_id'>>;
      };
      offers: {
        Row: Offer;
        Insert: Omit<Offer, 'id' | 'created_at' | 'updated_at' | 'status'>;
        Update: Partial<Omit<Offer, 'id' | 'created_at' | 'target_id' | 'seller_id'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Subscription, 'id' | 'created_at' | 'user_id'>>;
      };
      categories: {
        Row: CategoryData;
        Insert: Omit<CategoryData, 'id' | 'created_at' | 'updated_at' | 'request_count'>;
        Update: Partial<Omit<CategoryData, 'id' | 'created_at'>>;
      };
      category_suggestions: {
        Row: CategorySuggestion;
        Insert: Omit<CategorySuggestion, 'id' | 'created_at' | 'reviewed_at' | 'reviewed_by'>;
        Update: Partial<Omit<CategorySuggestion, 'id' | 'created_at' | 'suggested_by'>>;
      };
      admin_users: {
        Row: AdminUser;
        Insert: Omit<AdminUser, 'created_at'>;
        Update: Partial<Omit<AdminUser, 'user_id' | 'created_at'>>;
      };
    };
  };
}

export type UserRole = 'buyer' | 'seller';
export type Gender = 'Maschio' | 'Femmina' | 'Altro/Non specificato';
export type AgeRange = '18-25' | '26-35' | '36-45' | '46-55' | '56-65' | '66+';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  city: string;
  profession: string | null;
  role: UserRole;
  fonte_acquisizione: string | null;
  // Campi per Seller
  seller_type: 'business' | 'individual' | null;
  // Campi per Seller Business
  business_name: string | null;
  vat_number: string | null;
  primary_sector: string | null;
  // Campi per Buyer e Seller Individual
  gender: Gender | null;
  age_range: AgeRange | null;
  created_at: string;
  updated_at: string;
}

export const ACQUISITION_SOURCES = [
  'Social Media (Facebook, Instagram)',
  'Google / Motore di ricerca',
  'Passaparola',
  'Pubblicità online',
  'Altro',
] as const;

export const GENDERS: Gender[] = [
  'Maschio',
  'Femmina',
  'Altro/Non specificato',
];

export const AGE_RANGES: AgeRange[] = [
  '18-25',
  '26-35',
  '36-45',
  '46-55',
  '56-65',
  '66+',
];

export const BUSINESS_SECTORS = [
  'Elettronica e Tecnologia',
  'Moda e Abbigliamento',
  'Casa e Arredamento',
  'Sport e Fitness',
  'Auto e Moto',
  'Servizi Professionali',
  'Immobiliare',
  'Ristorazione e Food',
  'Bellezza e Benessere',
  'Altro',
] as const;

export type TargetStatus = 'active' | 'closed' | 'archived';

export interface Target {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  budget: number | null;
  location: string;
  status: TargetStatus;
  created_at: string;
  updated_at: string;
}

export type OfferStatus = 'pending' | 'accepted' | 'rejected';

export interface Offer {
  id: string;
  target_id: string;
  seller_id: string;
  message: string;
  proposed_price: number | null;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
}

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TargetWithProfile extends Target {
  profile: Profile;
}

export interface OfferWithDetails extends Offer {
  target: Target;
  seller: Profile;
}

export const CATEGORIES = [
  'Elettronica',
  'Moda e Abbigliamento',
  'Casa e Giardino',
  'Sport e Tempo Libero',
  'Auto e Moto',
  'Servizi Professionali',
  'Immobiliare',
  'Lavoro',
  'Altro',
] as const;

export type Category = typeof CATEGORIES[number];

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  request_count: number;
  created_at: string;
  updated_at: string;
}

export type CategorySuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface CategorySuggestion {
  id: string;
  name: string;
  suggested_by: string;
  status: CategorySuggestionStatus;
  target_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface CategorySuggestionWithProfile extends CategorySuggestion {
  suggester: Profile;
}

export interface AdminUser {
  user_id: string;
  permissions: string[];
  created_at: string;
}
