import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useCustomerStore } from '@/store/customerStore';
import { STATUS_LABELS } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

const ReportPage: React.FC = () => {
  const { customers, getDailyStats, getTodayTodos, appointments } = useCustomerStore();
  const stats = useMemo(() => getDailyStats(), [getDailyStats]);
  const todos = useMemo(() => getTodayTodos(), [getTodayTodos]);

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;

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

  const todayArrived = appointments.filter(
    (a) => a.date === today.toISOString().split('T')[0] && a.status === 'arrived'
  ).length;

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
      </View>

      <View className={styles.content}>
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
                      {todo.priority === 'high' ? '高优先级' : '中优先级'}
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
