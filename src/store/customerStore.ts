import { create } from 'zustand';
import { Customer, CustomerStatus, Appointment, Activity, MessageTemplate, TodoItem } from '@/types';
import { mockCustomers } from '@/data/customers';
import { mockAppointments } from '@/data/appointments';
import { mockActivities } from '@/data/activities';
import { mockMessageTemplates } from '@/data/messageTemplates';

interface CustomerStore {
  customers: Customer[];
  appointments: Appointment[];
  activities: Activity[];
  messageTemplates: MessageTemplate[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'followCount'>) => void;
  updateCustomerStatus: (id: string, status: CustomerStatus) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt' | 'customerCount'>) => void;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  getCustomersByStatus: (status?: CustomerStatus) => Customer[];
  getTodayTodos: () => TodoItem[];
  getDailyStats: () => {
    newLeads: number;
    contacted: number;
    pending: number;
    wakeup: number;
    todayAppointments: number;
    pendingFollow: number;
  };
  searchCustomers: (keyword: string) => Customer[];
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: mockCustomers,
  appointments: mockAppointments,
  activities: mockActivities,
  messageTemplates: mockMessageTemplates,

  addCustomer: (customer) =>
    set((state) => ({
      customers: [
        {
          ...customer,
          id: Date.now().toString(),
          createdAt: new Date().toLocaleString('zh-CN'),
          followCount: 0
        },
        ...state.customers
      ]
    })),

  updateCustomerStatus: (id, status) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, status, lastFollowAt: new Date().toLocaleString('zh-CN') } : c
      )
    })),

  addActivity: (activity) =>
    set((state) => ({
      activities: [
        {
          ...activity,
          id: Date.now().toString(),
          createdAt: new Date().toLocaleDateString('zh-CN'),
          customerCount: 0
        },
        ...state.activities
      ]
    })),

  addAppointment: (appointment) =>
    set((state) => ({
      appointments: [
        {
          ...appointment,
          id: Date.now().toString(),
          createdAt: new Date().toLocaleString('zh-CN')
        },
        ...state.appointments
      ]
    })),

  updateAppointmentStatus: (id, status) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, status } : a
      )
    })),

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
          content: `新线索：${c.name} - ${c.projectPreference.join('、')}`,
          priority: 'high'
        });
      }
      if (c.status === 'wakeup') {
        todos.push({
          id: `wakeup-${c.id}`,
          type: 'wakeup',
          customerId: c.id,
          customerName: c.name,
          content: `需唤醒：${c.name} 已多次未回复`,
          priority: 'high'
        });
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
            content: `生日快乐：${c.name} 今天生日，发送祝福`,
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

    return todos.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  },

  getDailyStats: () => {
    const { customers, appointments } = get();
    const today = new Date().toISOString().split('T')[0];

    return {
      newLeads: customers.filter((c) => c.status === 'new').length,
      contacted: customers.filter((c) => c.status === 'contacted').length,
      pending: customers.filter((c) => c.status === 'pending').length,
      wakeup: customers.filter((c) => c.status === 'wakeup').length,
      todayAppointments: appointments.filter((a) => a.date === today).length,
      pendingFollow: customers.filter((c) => c.status === 'new' || c.status === 'wakeup').length
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
        c.projectPreference.some((p) => p.includes(kw))
    );
  }
}));
