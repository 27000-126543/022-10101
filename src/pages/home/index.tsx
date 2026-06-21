import React, { useMemo, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useCustomerStore } from '@/store/customerStore';
import StatCard from '@/components/StatCard';
import QuickAction from '@/components/QuickAction';
import CustomerCard from '@/components/CustomerCard';
import classnames from 'classnames';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const { getDailyStats, getTodayTodos, customers, checkAndUpdateWakeupStatus, transactions } = useCustomerStore();
  const stats = useMemo(() => getDailyStats(), [getDailyStats]);
  const todos = useMemo(() => getTodayTodos(), [getTodayTodos]);
  const newCustomers = useMemo(() => customers.filter(c => c.status === 'new').slice(0, 3), [customers]);

  useDidShow(() => {
    console.log('[HomePage] 页面显示，检查需唤醒客户...');
    checkAndUpdateWakeupStatus();
  });

  useEffect(() => {
    checkAndUpdateWakeupStatus();
    const timer = setInterval(() => {
      checkAndUpdateWakeupStatus();
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [checkAndUpdateWakeupStatus]);

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekdayStr = weekdays[today.getDay()];

  const quickActions = [
    {
      label: '录入客户',
      icon: '➕',
      color: '#E91E8C',
      bgColor: '#FAF0F5',
      onClick: () => Taro.switchTab({ url: '/pages/entry/index' })
    },
    {
      label: '创建活动',
      icon: '🎯',
      color: '#165DFF',
      bgColor: '#E8F0FF',
      onClick: () => Taro.navigateTo({ url: '/pages/activity-create/index' })
    },
    {
      label: '预约管理',
      icon: '📅',
      color: '#FF7D00',
      bgColor: '#FFF3E8',
      onClick: () => Taro.switchTab({ url: '/pages/appointment/index' })
    },
    {
      label: '经营日报',
      icon: '📊',
      color: '#00B42A',
      bgColor: '#E8FFEA',
      onClick: () => Taro.switchTab({ url: '/pages/report/index' })
    }
  ];

  const handleTodoClick = (todo: any) => {
    Taro.navigateTo({ url: `/pages/customer-detail/index?id=${todo.customerId}` });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.greeting}>
          <View className={styles.greetingText}>
            <Text className={styles.hello}>早上好，欢迎回来</Text>
            <Text className={styles.name}>医美客资助手</Text>
          </View>
          <View className={styles.dateBadge}>
            <Text className={styles.dateText}>{dateStr} {weekdayStr}</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <StatCard title="今日新增" value={stats.newLeads} color="#ffffff" subtitle="位新客" />
          <StatCard title="待跟进" value={stats.pendingFollow} color="#ffffff" subtitle="紧急处理" />
          <StatCard title="今日预约" value={stats.todayAppointments} color="#ffffff" subtitle="到院数" />
        </View>
        {stats.transactionCount > 0 && (
          <View className={styles.statsRow}>
            <StatCard 
              title="今日成交" 
              value={stats.transactionCount} 
              color="#ffffff" 
              subtitle="单" 
            />
            <StatCard 
              title="成交金额" 
              value={stats.transactionAmount} 
              color="#ffffff" 
              subtitle="元" 
              isCurrency
            />
            <StatCard 
              title="改期待处理" 
              value={stats.rescheduledCount} 
              color="#ffffff" 
              subtitle="位" 
            />
          </View>
        )}
      </View>

      <View className={styles.todoSection}>
        <View className={styles.todoCard}>
          <View className={styles.todoHeader}>
            <Text className={styles.todoTitle}>今日待办</Text>
            <Text className={styles.todoCount}>{todos.length}项</Text>
          </View>

          {todos.length > 0 ? (
            <View className={styles.todoList}>
              {todos.slice(0, 5).map((todo) => (
                <View
                  key={todo.id}
                  className={styles.todoItem}
                  onClick={() => handleTodoClick(todo)}
                >
                  <View className={classnames(styles.priorityDot, styles[todo.priority])}></View>
                  <View className={styles.todoContent}>
                    <Text className={styles.todoText}>{todo.content}</Text>
                    {todo.time && <Text className={styles.todoTime}>时间：{todo.time}</Text>}
                  </View>
                  <Text className={classnames(styles.todoTypeTag, styles[todo.type])}>
                    {todo.type === 'follow' && '跟进'}
                    {todo.type === 'wakeup' && '唤醒'}
                    {todo.type === 'appointment' && '预约'}
                    {todo.type === 'birthday' && '生日'}
                    {todo.type === 'reschedule' && '改期'}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyTodo}>
              <Text className={styles.emptyText}>🎉 暂无待办，真棒！</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.quickSection}>
        <View style={{ paddingTop: '32rpx', paddingBottom: '16rpx' }}>
          <Text style={{ fontSize: '32rpx', fontWeight: 600, color: '#1D2129' }}>快捷操作</Text>
        </View>
        <QuickAction items={quickActions} />
      </View>

      <View className={styles.customersPreview}>
        <View className={styles.customerSectionHeader}>
          <Text className={styles.customerSectionTitle}>最新线索</Text>
          <Text
            className={styles.seeAll}
            onClick={() => Taro.switchTab({ url: '/pages/queue/index' })}
          >
            查看全部 →
          </Text>
        </View>

        {newCustomers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </View>
    </ScrollView>
  );
};

export default HomePage;
