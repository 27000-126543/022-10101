import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useCustomerStore } from '@/store/customerStore';
import { STATUS_LABELS } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

const ReportPage: React.FC = () => {
  const customers = useCustomerStore((s) => s.customers);
  const appointments = useCustomerStore((s) => s.appointments);
  const transactions = useCustomerStore((s) => s.transactions);

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const todayStr = today.toISOString().split('T')[0];

  const stats = useMemo(() => {
    const todayTransactions = transactions.filter(
      (t) => new Date(t.date.replace(/-/g, '/')).toISOString().split('T')[0] === todayStr
    );
    return {
      newLeads: customers.filter((c) => c.status === 'new').length,
      contacted: customers.filter((c) => c.status === 'contacted').length,
      pending: customers.filter((c) => c.status === 'pending').length,
      wakeup: customers.filter((c) => c.status === 'wakeup').length,
      todayAppointments: appointments.filter((a) => a.date === todayStr).length,
      pendingFollow: customers.filter((c) => c.status === 'new' || c.status === 'wakeup').length,
      rescheduledCount: appointments.filter((a) => a.status === 'rescheduled').length,
      transactionCount: todayTransactions.length,
      transactionAmount: todayTransactions.reduce((sum, t) => sum + t.amount, 0)
    };
  }, [customers, appointments, transactions, todayStr]);

  const todayTransactions = useMemo(() => {
    return transactions.filter(
      (t) => new Date(t.date.replace(/-/g, '/')).toISOString().split('T')[0] === todayStr
    );
  }, [transactions, todayStr]);

  const stuckCustomers = useMemo(() => {
    return customers
      .filter((c) => c.status === 'wakeup' || (c.status === 'new' && c.followCount === 0))
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        reason: c.status === 'wakeup' ? '多次未回复，需紧急唤醒' : '新线索未跟进',
        status: c.status
      }));
  }, [customers]);

  const rescheduledAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.status === 'rescheduled')
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        customerId: a.customerId,
        name: a.customerName,
        originalDate: a.originalDate || a.date,
        newDate: a.date,
        newTime: a.time,
        remark: a.rescheduleRemark || '客户改期'
      }));
  }, [appointments]);

  const channelStats = useMemo(() => {
    const map: Record<string, number> = {};
    customers.forEach((c) => {
      map[c.channel] = (map[c.channel] || 0) + 1;
    });
    const arr = Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    const max = Math.max(...arr.map((a) => a.count), 1);
    return arr.map((a) => ({ ...a, percent: (a.count / max) * 100 }));
  }, [customers]);

  const todos = useMemo(() => {
    const todosList: Array<{
      id: string;
      type: string;
      customerId: string;
      customerName: string;
      content: string;
      priority: string;
      time?: string;
    }> = [];

    customers.forEach((c) => {
      if (c.status === 'new') {
        todosList.push({
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
        todosList.push({
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
        if (nextFollowDate.toISOString().split('T')[0] === todayStr) {
          todosList.push({
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
    });

    appointments
      .filter((a) => a.date === todayStr && a.status !== 'arrived' && a.status !== 'cancelled')
      .forEach((a) => {
        todosList.push({
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
        todosList.push({
          id: `resched-${a.id}`,
          type: 'reschedule',
          customerId: a.customerId,
          customerName: a.customerName,
          content: `改期待确认：${a.customerName} 原${a.originalDate} 改至${a.date}`,
          priority: 'medium'
        });
      });

    return todosList.sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [customers, appointments, todayStr]);

  const todayArrived = appointments.filter(
    (a) => a.date === todayStr && a.status === 'arrived'
  ).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr.replace(/-/g, '/'));
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>经营日报</Text>
          <View className={styles.dateBadge}>
            <Text className={styles.dateText}>{dateStr}</Text>
          </View>
        </View>

        <View className={styles.overviewCards}>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue}>{stats.newLeads}</Text>
            <Text className={styles.overviewLabel}>新增线索</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue}>{stats.contacted + stats.pending}</Text>
            <Text className={styles.overviewLabel}>跟进中</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue}>{todayArrived}</Text>
            <Text className={styles.overviewLabel}>今日到院</Text>
          </View>
        </View>

        {(stats.transactionCount > 0 || todayTransactions.length > 0) && (
          <View className={styles.overviewCards}>
            <View className={styles.overviewCard}>
              <Text className={styles.overviewValue}>{stats.transactionCount}</Text>
              <Text className={styles.overviewLabel}>今日成交</Text>
            </View>
            <View className={styles.overviewCard}>
              <Text className={styles.overviewValue}>
                ¥{stats.transactionAmount.toLocaleString('zh-CN')}
              </Text>
              <Text className={styles.overviewLabel}>成交金额</Text>
            </View>
            <View className={styles.overviewCard}>
              <Text className={styles.overviewValue}>{stats.rescheduledCount}</Text>
              <Text className={styles.overviewLabel}>待处理改期</Text>
            </View>
          </View>
        )}
      </View>

      <View className={styles.content}>
        {todayTransactions.length > 0 && (
          <View className={styles.statSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.titleIcon}>💰</Text>今日成交记录
              </Text>
            </View>
            <View className={styles.transactionList}>
              {todayTransactions.map((t) => (
                <View
                  key={t.id}
                  className={styles.transactionItem}
                  onClick={() =>
                    Taro.navigateTo({ url: `/pages/customer-detail/index?id=${t.customerId}` })
                  }
                >
                  <View className={styles.transactionInfo}>
                    <Text className={styles.transactionName}>{t.customerName}</Text>
                    <Text className={styles.transactionProject}>{t.project}</Text>
                  </View>
                  <Text className={styles.transactionAmount}>¥{t.amount.toLocaleString('zh-CN')}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.statSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.titleIcon}>📊</Text>客资状态分布
            </Text>
          </View>

          <View className={styles.statusBreakdown}>
            <View className={classnames(styles.statusBar, styles.newBar)}>
              <Text className={styles.statusCount}>{stats.newLeads}</Text>
              <Text className={styles.statusLabel}>{STATUS_LABELS.new}</Text>
            </View>
            <View className={classnames(styles.statusBar, styles.contactedBar)}>
              <Text className={styles.statusCount}>{stats.contacted}</Text>
              <Text className={styles.statusLabel}>{STATUS_LABELS.contacted}</Text>
            </View>
            <View className={classnames(styles.statusBar, styles.pendingBar)}>
              <Text className={styles.statusCount}>{stats.pending}</Text>
              <Text className={styles.statusLabel}>{STATUS_LABELS.pending}</Text>
            </View>
            <View className={classnames(styles.statusBar, styles.wakeupBar)}>
              <Text className={styles.statusCount}>{stats.wakeup}</Text>
              <Text className={styles.statusLabel}>{STATUS_LABELS.wakeup}</Text>
            </View>
          </View>
        </View>

        <View className={styles.stuckSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.titleIcon}>⚠️</Text>卡点线索
            </Text>
            <Text
              className={styles.seeAll}
              onClick={() => Taro.switchTab({ url: '/pages/queue/index' })}
            >
              全部处理
            </Text>
          </View>

          {stuckCustomers.length > 0 && (
            <View className={styles.warningBanner}>
              <Text className={styles.warningIcon}>!</Text>
              <Text className={styles.warningText}>
                有 {stuckCustomers.length} 条线索卡在待处理状态，请及时跟进，避免客户流失
              </Text>
            </View>
          )}

          <View className={styles.stuckList}>
            {stuckCustomers.map((c) => (
              <View key={c.id} className={styles.stuckItem}>
                <View className={styles.stuckInfo}>
                  <Text className={styles.stuckName}>{c.name}</Text>
                  <Text className={styles.stuckReason}>{c.reason}</Text>
                </View>
                <View
                  className={styles.stuckAction}
                  onClick={() =>
                    Taro.navigateTo({ url: `/pages/customer-detail/index?id=${c.id}` })
                  }
                >
                  <Text>立即处理</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {rescheduledAppointments.length > 0 && (
          <View className={styles.stuckSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.titleIcon}>🔄</Text>改期待处理
              </Text>
              <Text
                className={styles.seeAll}
                onClick={() => Taro.switchTab({ url: '/pages/appointment/index' })}
              >
                查看全部
              </Text>
            </View>

            <View className={styles.rescheduleBanner}>
              <Text className={styles.rescheduleIcon}>🔄</Text>
              <Text className={styles.rescheduleText}>
                有 {rescheduledAppointments.length} 位客户已改期，请注意确认新预约时间
              </Text>
            </View>

            <View className={styles.rescheduleList}>
              {rescheduledAppointments.map((a) => (
                <View
                  key={a.id}
                  className={styles.rescheduleItem}
                  onClick={() =>
                    Taro.navigateTo({
                      url: `/pages/customer-detail/index?id=${a.customerId}&appointmentId=${a.id}`
                    })
                  }
                >
                  <View className={styles.rescheduleInfo}>
                    <Text className={styles.rescheduleName}>{a.name}</Text>
                    <Text className={styles.rescheduleDate}>
                      原 {formatDate(a.originalDate)} → {formatDate(a.newDate)} {a.newTime}
                    </Text>
                    <Text className={styles.rescheduleReason}>原因：{a.remark}</Text>
                  </View>
                  <Text className={styles.rescheduleArrow}>→</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.channelSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.titleIcon}>📈</Text>渠道来源分析
            </Text>
          </View>

          <View className={styles.channelList}>
            {channelStats.map((ch) => (
              <View key={ch.name} className={styles.channelItem}>
                <Text className={styles.channelName}>{ch.name}</Text>
                <View className={styles.channelBarWrap}>
                  <View
                    className={styles.channelBarFill}
                    style={{ width: `${ch.percent}%` }}
                  ></View>
                </View>
                <Text className={styles.channelCount}>{ch.count}人</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.todoSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.titleIcon}>✅</Text>未处理清单
            </Text>
            <Text className={styles.seeAll}>{todos.length}项待办</Text>
          </View>

          {todos.length > 0 ? (
            <View className={styles.todoList}>
              {todos.slice(0, 8).map((todo) => (
                <View
                  key={todo.id}
                  className={styles.todoItem}
                  onClick={() =>
                    Taro.navigateTo({ url: `/pages/customer-detail/index?id=${todo.customerId}` })
                  }
                >
                  <View
                    className={classnames(
                      styles.todoDot,
                      todo.priority === 'high' ? styles.todoHigh : styles.todoMedium
                    )}
                  ></View>
                  <View className={styles.todoContent}>
                    <Text className={styles.todoText}>{todo.content}</Text>
                    <Text className={styles.todoMeta}>
                      {todo.type === 'follow' && '📞 跟进'}
                      {todo.type === 'wakeup' && '🔔 唤醒'}
                      {todo.type === 'appointment' && '📅 预约'}
                      {todo.type === 'birthday' && '🎂 生日'}
                      {todo.type === 'reschedule' && '🔄 改期'}
                      {todo.priority === 'high' ? ' · 高优先级' : ' · 中优先级'}
                      {todo.time && ` · ${todo.time}`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyTodo}>
              <Text className={styles.emptyText}>🎉 今日待办已全部完成</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default ReportPage;
