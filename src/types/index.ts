export type CustomerStatus = 'new' | 'contacted' | 'pending' | 'wakeup';

export interface FollowUpSchedule {
  firstConsultReminder: string;
  nextFollowAt: string;
  autoWakeupAt: string;
  followStage: number;
}

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
  firstConsultReminder?: string;
  autoWakeupAt?: string;
  followStage?: number;
  birthday?: string;
  isVip?: boolean;
  referrerId?: string;
  referrerName?: string;
  referrerPhone?: string;
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
  qrUrl?: string;
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
  originalDate?: string;
  originalTime?: string;
  status: 'pending' | 'confirmed' | 'arrived' | 'cancelled' | 'rescheduled';
  createdAt: string;
  remark?: string;
  rescheduleRemark?: string;
  rescheduleCount?: number;
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
  rescheduledCount: number;
}

export interface TodoItem {
  id: string;
  type: 'follow' | 'appointment' | 'birthday' | 'wakeup' | 'reschedule';
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

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

export const generateFollowSchedule = (createdAt: Date): FollowUpSchedule => {
  const firstConsult = new Date(createdAt.getTime() + 30 * 60 * 1000);
  const nextFollow = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
  const autoWakeup = new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);

  return {
    firstConsultReminder: firstConsult.toLocaleString('zh-CN'),
    nextFollowAt: nextFollow.toLocaleString('zh-CN'),
    autoWakeupAt: autoWakeup.toLocaleString('zh-CN'),
    followStage: 1
  };
};

export const calculateNextFollowUp = (lastFollowAt: Date, stage: number): string => {
  const hours = stage === 1 ? 24 : stage === 2 ? 48 : 72;
  const next = new Date(lastFollowAt.getTime() + hours * 60 * 60 * 1000);
  return next.toLocaleString('zh-CN');
};

export const shouldWakeUp = (lastFollowAt?: string, nextFollowAt?: string): boolean => {
  if (!lastFollowAt && !nextFollowAt) return false;
  const now = new Date();
  const targetDate = nextFollowAt ? new Date(nextFollowAt.replace(/-/g, '/')) : new Date(lastFollowAt!.replace(/-/g, '/'));
  const diffHours = (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60);
  return diffHours >= 48;
};
