import { create } from 'zustand';
import Taro from '@tarojs/taro';
import {
  Customer,
  CustomerStatus,
  Appointment,
  Activity,
  MessageTemplate,
  TodoItem,
  Transaction,
  FollowUpRecord,
  generateFollowSchedule,
  calculateNextFollowUp,
  shouldWakeUp
} from '@/types';
import { mockCustomers } from '@/data/customers';
import { mockAppointments } from '@/data/appointments';
import { mockActivities } from '@/data/activities';
import { mockMessageTemplates } from '@/data/messageTemplates';

const STORAGE_KEY = 'yme_store_v1';

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = Taro.getStorageSync(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch (e) {
    console.log('[Storage] 读取失败，使用默认数据', e);
  }
  return fallback;
};

const saveToStorage = (data: Partial<PersistedState>) => {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.log('[Storage] 保存失败', e);
  }
};

interface PersistedState {
  customers: Customer[];
  appointments: Appointment[];
  activities: Activity[];
  transactions: Transaction[];
  followUpRecords: FollowUpRecord[];
}

const defaultCustomers = mockCustomers.map((c) => {
  const schedule = generateFollowSchedule(new Date(c.createdAt.replace(/-/g, '/')));
  return {
    ...c,
    firstConsultReminder: schedule.firstConsultReminder,
    nextFollowAt: schedule.nextFollowAt,
    autoWakeupAt: schedule.autoWakeupAt,
    followStage: schedule.followStage
  };
});

const defaultActivities = mockActivities.map((a) => ({
  ...a,
  qrUrl: `pages/activity-lead/index?activityId=${a.id}`
}));

const persisted = loadFromStorage<PersistedState>(STORAGE_KEY, {
  customers: defaultCustomers,
  appointments: mockAppointments,
  activities: defaultActivities,
  transactions: [],
  followUpRecords: []
});

const hasPersistedData = (() => {
  try {
    return !!Taro.getStorageSync(STORAGE_KEY);
  } catch {
    return false;
  }
})();

interface CustomerStore {
  customers: Customer[];
  appointments: Appointment[];
  activities: Activity[];
  messageTemplates: MessageTemplate[];
  transactions: Transaction[];
  followUpRecords: FollowUpRecord[];

  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'followCount'>) => string;
  addCustomerFromActivity: (data: {
    name: string;
    phone: string;
    projectPreference: string[];
    activityId: string;
  }) => string;
  updateCustomerStatus: (id: string, status: CustomerStatus) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  recordFollowUp: (customerId: string, type: FollowUpRecord['type'], content: string) => void;
  bindReferrer: (customerId: string, referrerName: string, referrerPhone?: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;

  addActivity: (activity: Omit<Activity, 'id' | 'createdAt' | 'customerCount'>) => string;
  getActivityById: (id: string) => Activity | undefined;

  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => string;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  rescheduleAppointment: (id: string, newDate: string, newTime: string, remark: string) => void;

  addFollowUpRecord: (record: Omit<FollowUpRecord, 'id' | 'createdAt' | 'operator'>) => void;

  getCustomersByStatus: (status?: CustomerStatus) => Customer[];
  getTodayTodos: () => TodoItem[];
  getDailyStats: () => {
    newLeads: number;
    contacted: number;
    pending: number;
    wakeup: number;
    todayAppointments: number;
    pendingFollow: number;
    rescheduledCount: number;
    transactionCount: number;
    transactionAmount: number;
  };
  searchCustomers: (keyword: string) => Customer[];
  checkAndUpdateWakeupStatus: () => void;
}

const persistState = (state: PersistedState) => {
  saveToStorage({
    customers: state.customers,
    appointments: state.appointments,
    activities: state.activities,
    transactions: state.transactions,
    followUpRecords: state.followUpRecords
  });
};

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: persisted.customers,
  appointments: persisted.appointments,
  activities: persisted.activities,
  messageTemplates: mockMessageTemplates,
  transactions: persisted.transactions,
  followUpRecords: persisted.followUpRecords,

  addCustomer: (customer) => {
    const now = new Date();
    const schedule = generateFollowSchedule(now);
    const id = Date.now().toString();
    set((state) => {
      const newState = {
        customers: [
          {
            ...customer,
            id,
            createdAt: now.toLocaleString('zh-CN'),
            followCount: 0,
            ...schedule
          },
          ...state.customers
        ]
      };
      persistState({ ...state, ...newState });
      return newState;
    });
    return id;
  },

  addCustomerFromActivity: (data) => {
    const now = new Date();
    const schedule = generateFollowSchedule(now);
    const activity = get().activities.find((a) => a.id === data.activityId);
    const id = Date.now().toString();

    set((state) => {
      const newState = {
        customers: [
          {
            id,
            name: data.name,
            phone: data.phone,
            status: 'new',
            channel: '活动扫码',
            projectPreference: data.projectPreference,
            activityId: data.activityId,
            activityName: activity?.name,
            createdAt: now.toLocaleString('zh-CN'),
            followCount: 0,
            tags: ['活动扫码'],
            ...schedule
          },
          ...state.customers
        ],
        activities: state.activities.map((a) =>
          a.id === data.activityId ? { ...a, customerCount: a.customerCount + 1 } : a
        )
      };
      persistState({ ...state, ...newState });
      return newState;
    });
    return id;
  },

  updateCustomerStatus: (id, status) => {
    const now = new Date();
    const customer = get().customers.find((c) => c.id === id);
    const nextFollowAt = customer?.lastFollowAt
      ? calculateNextFollowUp(new Date(customer.lastFollowAt.replace(/-/g, '/')), (customer.followStage || 1) + 1)
      : undefined;

    set((state) => {
      const newState = {
        customers: state.customers.map((c) =>
          c.id === id
            ? {
                ...c,
                status,
                lastFollowAt: now.toLocaleString('zh-CN'),
                nextFollowAt,
                followStage: (c.followStage || 1) + 1
              }
            : c
        )
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  updateCustomer: (id, updates) => {
    set((state) => {
      const newState = {
        customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c))
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  recordFollowUp: (customerId, type, content) => {
    const now = new Date();
    const customer = get().customers.find((c) => c.id === customerId);
    const followStage = (customer?.followStage || 1) + 1;
    const nextFollowAt = calculateNextFollowUp(now, followStage);

    set((state) => {
      const newRecord: FollowUpRecord = {
        id: Date.now().toString(),
        customerId,
        type,
        content,
        createdAt: now.toLocaleString('zh-CN'),
        operator: '咨询顾问小美'
      };
      const newState = {
        followUpRecords: [newRecord, ...state.followUpRecords],
        customers: state.customers.map((c) =>
          c.id === customerId
            ? {
                ...c,
                lastFollowAt: now.toLocaleString('zh-CN'),
                nextFollowAt,
                followCount: c.followCount + 1,
                followStage,
                status: c.status === 'new' ? 'contacted' : c.status
              }
            : c
        )
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  bindReferrer: (customerId, referrerName, referrerPhone) => {
    const now = new Date();
    const referrer = get().customers.find(
      (c) => c.name === referrerName || c.phone === referrerPhone
    );
    const currentCustomer = get().customers.find((c) => c.id === customerId);
    const prevReferrerName = currentCustomer?.referrerName;

    set((state) => {
      const followContent = prevReferrerName
        ? `更换推荐人：原推荐人「${prevReferrerName}」→ 新推荐人「${referrerName}」${referrerPhone ? `(${referrerPhone})` : ''}`
        : `绑定推荐人：${referrerName}${referrerPhone ? `(${referrerPhone})` : ''}，享受转介绍奖励`;

      const newRecord: FollowUpRecord = {
        id: Date.now().toString(),
        customerId,
        type: 'other',
        content: followContent,
        createdAt: now.toLocaleString('zh-CN'),
        operator: '咨询顾问小美'
      };

      const newState = {
        customers: state.customers.map((c) =>
          c.id === customerId
            ? {
                ...c,
                referrerId: referrer?.id,
                referrerName,
                referrerPhone,
                tags: c.tags.includes('转介绍') ? c.tags : [...c.tags, '转介绍']
              }
            : c
        ),
        followUpRecords: [newRecord, ...state.followUpRecords]
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  addTransaction: (transaction) => {
    const now = new Date();
    set((state) => {
      const newState = {
        transactions: [
          {
            ...transaction,
            id: Date.now().toString(),
            date: now.toLocaleString('zh-CN')
          },
          ...state.transactions
        ],
        customers: state.customers.map((c) =>
          c.id === transaction.customerId
            ? {
                ...c,
                totalConsumption: (c.totalConsumption || 0) + transaction.amount,
                isVip: (c.totalConsumption || 0) + transaction.amount >= 5000 ? true : c.isVip
              }
            : c
        )
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  addActivity: (activity) => {
    const id = Date.now().toString();
    set((state) => {
      const newState = {
        activities: [
          {
            ...activity,
            id,
            createdAt: new Date().toLocaleDateString('zh-CN'),
            customerCount: 0,
            qrUrl: `pages/activity-lead/index?activityId=${id}`
          },
          ...state.activities
        ]
      };
      persistState({ ...state, ...newState });
      return newState;
    });
    return id;
  },

  getActivityById: (id) => {
    return get().activities.find((a) => a.id === id);
  },

  addAppointment: (appointment) => {
    const id = Date.now().toString();
    set((state) => {
      const newState = {
        appointments: [
          {
            ...appointment,
            id,
            createdAt: new Date().toLocaleString('zh-CN'),
            rescheduleCount: 0
          },
          ...state.appointments
        ],
        customers: state.customers.map((c) =>
          c.id === appointment.customerId && c.status !== 'pending'
            ? { ...c, status: 'pending' as CustomerStatus }
            : c
        )
      };
      persistState({ ...state, ...newState });
      return newState;
    });
    return id;
  },

  updateAppointmentStatus: (id, status) => {
    set((state) => {
      const newState = {
        appointments: state.appointments.map((a) => (a.id === id ? { ...a, status } : a))
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  rescheduleAppointment: (id, newDate, newTime, remark) => {
    const appointment = get().appointments.find((a) => a.id === id);
    if (!appointment) return;

    set((state) => {
      const newState = {
        appointments: state.appointments.map((a) =>
          a.id === id
            ? {
                ...a,
                date: newDate,
                time: newTime,
                status: 'rescheduled',
                originalDate: a.originalDate || a.date,
                originalTime: a.originalTime || a.time,
                rescheduleRemark: remark,
                rescheduleCount: (a.rescheduleCount || 0) + 1,
                remark: a.remark ? `${a.remark} | 改期: ${remark}` : `改期: ${remark}`
              }
            : a
        )
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  addFollowUpRecord: (record) => {
    const now = new Date();
    set((state) => {
      const newState = {
        followUpRecords: [
          {
            ...record,
            id: Date.now().toString(),
            createdAt: now.toLocaleString('zh-CN'),
            operator: '咨询顾问小美'
          },
          ...state.followUpRecords
        ]
      };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  getCustomersByStatus: (status) => {
    const { customers } = get();
    if (!status) return customers;
    return customers.filter((c) => c.status === status);
  },

  getTodayTodos: () => {
    const { customers, appointments } = get();
    const todos: TodoItem[] = [];
    const today = new Date().toISOString().split('T')[0];

    customers.forEach((c) => {
      if (c.status === 'new') {
        todos.push({
          id: `new-${c.id}`,
          type: 'follow',
          customerId: c.id,
          customerName: c.name,
          content: `首咨提醒：${c.name} - ${c.projectPreference.join('、')}`,
          priority: 'high',
          time: c.firstConsultReminder?.split(' ')[1]
        });
      }

      if (c.status === 'wakeup') {
        todos.push({
          id: `wakeup-${c.id}`,
          type: 'wakeup',
          customerId: c.id,
          customerName: c.name,
          content: `二次唤醒：${c.name} 已${c.followCount}次跟进未回复`,
          priority: 'high'
        });
      }

      if (c.nextFollowAt) {
        const nextFollowDate = new Date(c.nextFollowAt.replace(/-/g, '/'));
        if (nextFollowDate.toISOString().split('T')[0] === today) {
          todos.push({
            id: `next-${c.id}`,
            type: 'follow',
            customerId: c.id,
            customerName: c.name,
            content: `跟进提醒：${c.name} 计划跟进时间`,
            priority: 'medium',
            time: c.nextFollowAt.split(' ')[1]
          });
        }
      }

      if (c.birthday) {
        const bday = c.birthday.substring(5);
        const todayMonthDay = today.substring(5);
        if (bday === todayMonthDay) {
          todos.push({
            id: `bday-${c.id}`,
            type: 'birthday',
            customerId: c.id,
            customerName: c.name,
            content: `生日祝福：${c.name} 今天生日，发送祝福`,
            priority: 'medium'
          });
        }
      }
    });

    appointments
      .filter((a) => a.date === today && a.status !== 'arrived' && a.status !== 'cancelled')
      .forEach((a) => {
        todos.push({
          id: `appt-${a.id}`,
          type: 'appointment',
          customerId: a.customerId,
          customerName: a.customerName,
          content: `待接诊：${a.customerName} ${a.time} ${a.project}`,
          priority: a.status === 'confirmed' ? 'high' : 'medium',
          time: a.time
        });
      });

    appointments
      .filter((a) => a.status === 'rescheduled')
      .forEach((a) => {
        todos.push({
          id: `resched-${a.id}`,
          type: 'reschedule',
          customerId: a.customerId,
          customerName: a.customerName,
          content: `改期待确认：${a.customerName} 原${a.originalDate} 改至${a.date}`,
          priority: 'medium'
        });
      });

    return todos.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  },

  getDailyStats: () => {
    const { customers, appointments, transactions } = get();
    const today = new Date().toISOString().split('T')[0];

    const todayTransactions = transactions.filter(
      (t) => new Date(t.date.replace(/-/g, '/')).toISOString().split('T')[0] === today
    );

    return {
      newLeads: customers.filter((c) => c.status === 'new').length,
      contacted: customers.filter((c) => c.status === 'contacted').length,
      pending: customers.filter((c) => c.status === 'pending').length,
      wakeup: customers.filter((c) => c.status === 'wakeup').length,
      todayAppointments: appointments.filter((a) => a.date === today).length,
      pendingFollow: customers.filter((c) => c.status === 'new' || c.status === 'wakeup').length,
      rescheduledCount: appointments.filter((a) => a.status === 'rescheduled').length,
      transactionCount: todayTransactions.length,
      transactionAmount: todayTransactions.reduce((sum, t) => sum + t.amount, 0)
    };
  },

  searchCustomers: (keyword) => {
    const { customers } = get();
    if (!keyword.trim()) return customers;
    const kw = keyword.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(kw) ||
        c.phone.includes(kw) ||
        c.projectPreference.some((p) => p.includes(kw)) ||
        (c.referrerName && c.referrerName.includes(kw))
    );
  },

  checkAndUpdateWakeupStatus: () => {
    const { customers } = get();

    const updatedCustomers = customers.map((c) => {
      if (c.status === 'new' || c.status === 'contacted') {
        if (shouldWakeUp(c.lastFollowAt, c.nextFollowAt)) {
          return { ...c, status: 'wakeup' as CustomerStatus };
        }
      }
      return c;
    });

    const hasChanges = updatedCustomers.some((c, i) => c.status !== customers[i].status);
    if (hasChanges) {
      set((state) => {
        const newState = { customers: updatedCustomers };
        persistState({ ...state, ...newState });
        return newState;
      });
    }
  }
}));
