export type CustomerStatus = 'new' | 'contacted' | 'pending' | 'wakeup';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  status: CustomerStatus;
  channel: string;
  projectPreference: string[];
  activityId?: string;
  activityName?: string;
  sourceRemark?: string;
  createdAt: string;
  lastFollowAt?: string;
  nextFollowAt?: string;
  birthday?: string;
  isVip?: boolean;
  referrerId?: string;
  referrerName?: string;
  totalConsumption?: number;
  followCount: number;
  tags: string[];
}

export interface FollowUpRecord {
  id: string;
  customerId: string;
  content: string;
  type: 'greeting' | 'case' | 'discount' | 'reminder' | 'other';
  createdAt: string;
  operator: string;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  qrCode?: string;
  createdAt: string;
  customerCount: number;
  status: 'active' | 'inactive';
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  project: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'arrived' | 'cancelled' | 'rescheduled';
  createdAt: string;
  remark?: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  project: string;
  amount: number;
  date: string;
  remark?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'greeting' | 'case' | 'discount' | 'birthday' | 'reminder';
  content: string;
}

export interface DailyStats {
  date: string;
  newLeads: number;
  contacted: number;
  appointmentArrived: number;
  transactions: number;
  transactionAmount: number;
  pendingFollow: number;
  pendingAppointment: number;
  stuckLeads: number;
}

export interface TodoItem {
  id: string;
  type: 'follow' | 'appointment' | 'birthday' | 'wakeup';
  customerId: string;
  customerName: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  time?: string;
}

export const STATUS_LABELS: Record<CustomerStatus, string> = {
  new: '新线索',
  contacted: '已沟通',
  pending: '待到院',
  wakeup: '需唤醒'
};

export const STATUS_COLORS: Record<CustomerStatus, string> = {
  new: '#165DFF',
  contacted: '#00B42A',
  pending: '#FF7D00',
  wakeup: '#F53F3F'
};

export const PROJECT_OPTIONS = [
  '水光补水',
  '双眼皮',
  '玻尿酸',
  '瘦脸针',
  '隆鼻',
  '光子嫩肤',
  '热玛吉',
  '吸脂塑形',
  '植发',
  '皮秒祛斑'
];

export const CHANNEL_OPTIONS = [
  '抖音',
  '小红书',
  '美团',
  '大众点评',
  '微信朋友圈',
  '朋友介绍',
  '到店咨询',
  '活动扫码',
  '百度推广',
  '其他'
];
