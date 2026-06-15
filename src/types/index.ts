export type Role = "CUSTOMER" | "BARBER" | "OWNER" | "ADMIN";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PaymentProvider = "MTN_MOMO" | "TELECEL_CASH" | "AT_MONEY" | "CASH";

export type QueueStatus = "WAITING" | "CALLED" | "IN_SERVICE" | "DONE" | "LEFT";

export type NotificationChannel = "WHATSAPP" | "SMS" | "IN_APP";

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  avatar?: string;
  createdAt: Date;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  logo?: string;
  coverImage?: string;
  openTime: string;
  closeTime: string;
  isActive: boolean;
  ownerId: string;
}

export interface Barber {
  id: string;
  userId: string;
  shopId: string;
  specialties: string[];
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  user: User;
}

export interface Service {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface Booking {
  id: string;
  customerId: string;
  barberId: string;
  shopId: string;
  serviceId: string;
  scheduledAt: Date;
  status: BookingStatus;
  depositAmount: number;
  depositPaid: boolean;
  totalAmount: number;
  notes?: string;
  customer: User;
  barber: Barber;
  service: Service;
  shop: Shop;
}

export interface QueueEntry {
  id: string;
  shopId: string;
  customerId: string;
  barberId?: string;
  serviceId?: string;
  queueNumber: number;
  status: QueueStatus;
  isPremium: boolean;
  joinedAt: Date;
  calledAt?: Date;
  completedAt?: Date;
  estimatedWaitMinutes: number;
  customer: User;
}

export interface Payment {
  id: string;
  bookingId?: string;
  customerId: string;
  amount: number;
  provider: PaymentProvider;
  status: PaymentStatus;
  reference: string;
  phoneNumber: string;
  createdAt: Date;
}

export interface LoyaltyAccount {
  id: string;
  customerId: string;
  shopId: string;
  points: number;
  totalVisits: number;
  totalSpent: number;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
}

export interface APIResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
