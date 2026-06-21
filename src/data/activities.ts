import { Activity } from '@/types';

export const mockActivities: Activity[] = [
  {
    id: '1',
    name: '水光补水体验',
    description: '新人专享体验价，首次到院赠送皮肤检测一次',
    createdAt: '2026-06-01',
    customerCount: 28,
    status: 'active'
  },
  {
    id: '2',
    name: '双眼皮面诊',
    description: '专家一对一免费面诊，定制个性化双眼皮方案',
    createdAt: '2026-06-05',
    customerCount: 15,
    status: 'active'
  },
  {
    id: '3',
    name: '祛斑专场',
    description: '皮秒祛斑7折优惠，疗程套餐更划算',
    createdAt: '2026-06-10',
    customerCount: 12,
    status: 'active'
  },
  {
    id: '4',
    name: '闺蜜同行',
    description: '两人同行一人免单，推荐好友各得500元代金券',
    createdAt: '2026-06-15',
    customerCount: 8,
    status: 'active'
  }
];
