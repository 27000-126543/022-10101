import { Appointment } from '@/types';

export const mockAppointments: Appointment[] = [
  {
    id: '1',
    customerId: '3',
    customerName: '王雅琴',
    customerPhone: '137****9012',
    project: '玻尿酸丰太阳穴',
    date: '2026-06-22',
    time: '14:00',
    status: 'confirmed',
    createdAt: '2026-06-20 16:00'
  },
  {
    id: '2',
    customerId: '7',
    customerName: '孙琳琳',
    customerPhone: '133****6789',
    project: '头顶加密种植',
    date: '2026-06-22',
    time: '15:30',
    status: 'pending',
    createdAt: '2026-06-21 10:00',
    remark: '需要提前做血液检查'
  },
  {
    id: '3',
    customerId: '11',
    customerName: '黄丽萍',
    customerPhone: '158****2234',
    project: '光子嫩肤+水光补水套餐',
    date: '2026-06-23',
    time: '10:00',
    status: 'confirmed',
    createdAt: '2026-06-21 15:30'
  },
  {
    id: '4',
    customerId: '2',
    customerName: '李婷婷',
    customerPhone: '139****5678',
    project: '双眼皮面诊+设计',
    date: '2026-06-23',
    time: '14:30',
    status: 'pending',
    createdAt: '2026-06-22 09:00'
  },
  {
    id: '5',
    customerId: '6',
    customerName: '赵小娟',
    customerPhone: '134****2345',
    project: '假体隆鼻',
    date: '2026-06-24',
    time: '09:30',
    status: 'rescheduled',
    createdAt: '2026-06-20 11:00',
    remark: '原6月22日改期'
  }
];
