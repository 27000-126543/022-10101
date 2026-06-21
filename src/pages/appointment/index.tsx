import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useCustomerStore } from '@/store/customerStore';
import { Appointment } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'arrived' | 'rescheduled';

const statusLabels: Record<Appointment['status'], string> = {
  pending: '待确认',
  confirmed: '已确认',
  arrived: '已到院',
  cancelled: '已取消',
  rescheduled: '已改期'
};

const AppointmentPage: React.FC = () => {
  const { appointments, updateAppointmentStatus } = useCustomerStore();
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const today = new Date();
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const count = appointments.filter((a) => a.date === dateStr).length;
      return {
        date: dateStr,
        day: date.getDate(),
        week: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
        count
      };
    });
  }, [appointments, today]);

  const selectedDate = weekDays[selectedDateIndex].date;

  const filteredAppointments = useMemo(() => {
    let result = appointments.filter((a) => a.date === selectedDate);
    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }
    return result.sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate, statusFilter]);

  const stats = useMemo(() => {
    const dayAppts = appointments.filter((a) => a.date === selectedDate);
    return {
      total: dayAppts.length,
      pending: dayAppts.filter((a) => a.status === 'pending').length,
      arrived: dayAppts.filter((a) => a.status === 'arrived').length
    };
  }, [appointments, selectedDate]);

  const handleAction = (appointment: Appointment, action: string) => {
    switch (action) {
      case 'arrive':
        updateAppointmentStatus(appointment.id, 'arrived');
        Taro.showToast({ title: '签到成功', icon: 'success' });
        break;
      case 'confirm':
        updateAppointmentStatus(appointment.id, 'confirmed');
        Taro.showToast({ title: '已确认', icon: 'success' });
        break;
      case 'reschedule':
        Taro.showToast({ title: '改期功能', icon: 'none' });
        break;
      case 'cancel':
        Taro.showModal({
          title: '确认取消',
          content: `确定要取消 ${appointment.customerName} 的预约吗？`,
          success: (res) => {
            if (res.confirm) {
              updateAppointmentStatus(appointment.id, 'cancelled');
              Taro.showToast({ title: '已取消', icon: 'success' });
            }
          }
        });
        break;
    }
  };

  const getStatusClass = (status: Appointment['status']) => {
    const map = {
      pending: 'statusPending',
      confirmed: 'statusConfirmed',
      arrived: 'statusArrived',
      cancelled: 'statusCancelled',
      rescheduled: 'statusRescheduled'
    };
    return map[status];
  };

  const getBadgeClass = (status: Appointment['status']) => {
    const map = {
      pending: 'badgePending',
      confirmed: 'badgeConfirmed',
      arrived: 'badgeArrived',
      cancelled: 'badgeCancelled',
      rescheduled: 'badgeRescheduled'
    };
    return map[status];
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待确认' },
    { key: 'confirmed', label: '已确认' },
    { key: 'arrived', label: '已到院' },
    { key: 'rescheduled', label: '已改期' }
  ];

  const currentDateStr = `${today.getFullYear()}年${today.getMonth() + 1}月`;

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.dateSection}>
        <View className={styles.dateNav}>
          <View className={styles.navBtn}>
            <Text className={styles.navBtnText}>‹</Text>
          </View>
          <Text className={styles.currentDate}>{currentDateStr}</Text>
          <View className={styles.navBtn}>
            <Text className={styles.navBtnText}>›</Text>
          </View>
        </View>

        <View className={styles.weekDays}>
          {weekDays.map((day, index) => (
            <View
              key={day.date}
              className={classnames(styles.dayItem, index === selectedDateIndex && styles.activeDay)}
              onClick={() => setSelectedDateIndex(index)}
            >
              <Text className={styles.dayWeek}>周{day.week}</Text>
              <Text className={styles.dayDate}>{day.day}</Text>
              <Text className={styles.dayCount}>{day.count > 0 ? `${day.count}单` : '—'}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.statsBar}>
        <View className={styles.statsContainer}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>今日预约</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statValue, styles.statValue2)}>{stats.pending}</Text>
            <Text className={styles.statLabel}>待确认</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statValue, styles.statValue3)}>{stats.arrived}</Text>
            <Text className={styles.statLabel}>已到院</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        {filters.map((f) => (
          <View
            key={f.key}
            className={classnames(styles.filterItem, statusFilter === f.key && styles.activeFilter)}
            onClick={() => setStatusFilter(f.key)}
          >
            <Text className={styles.filterText}>{f.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.appointmentList}>
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appt) => (
            <View key={appt.id} className={styles.appointmentCard}>
              <View className={classnames(styles.cardLeftBar, styles[getStatusClass(appt.status)])}></View>
              <View className={styles.cardContent}>
                <View className={styles.cardHeader}>
                  <View className={styles.customerInfo}>
                    <Text className={styles.customerName}>{appt.customerName}</Text>
                    <Text className={styles.customerPhone}>{appt.customerPhone}</Text>
                  </View>
                  <Text className={classnames(styles.statusBadge, styles[getBadgeClass(appt.status)])}>
                    {statusLabels[appt.status]}
                  </Text>
                </View>

                <View className={styles.projectInfo}>
                  <Text className={styles.projectName}>{appt.project}</Text>
                  <View className={styles.timeRow}>
                    <Text className={styles.timeIcon}>🕐</Text>
                    <Text className={styles.timeText}>{appt.time} 到院</Text>
                  </View>
                  {appt.remark && <Text className={styles.remarkText}>备注：{appt.remark}</Text>}
                </View>

                <View className={styles.actionRow}>
                  {appt.status === 'pending' && (
                    <>
                      <View
                        className={classnames(styles.actionBtn, styles.btnSecondary)}
                        onClick={() => handleAction(appt, 'cancel')}
                      >
                        <Text>取消</Text>
                      </View>
                      <View
                        className={classnames(styles.actionBtn, styles.btnPrimary)}
                        onClick={() => handleAction(appt, 'confirm')}
                      >
                        <Text>确认预约</Text>
                      </View>
                    </>
                  )}
                  {appt.status === 'confirmed' && (
                    <>
                      <View
                        className={classnames(styles.actionBtn, styles.btnWarning)}
                        onClick={() => handleAction(appt, 'reschedule')}
                      >
                        <Text>改期</Text>
                      </View>
                      <View
                        className={classnames(styles.actionBtn, styles.btnSuccess)}
                        onClick={() => handleAction(appt, 'arrive')}
                      >
                        <Text>到院签到</Text>
                      </View>
                    </>
                  )}
                  {appt.status === 'arrived' && (
                    <View className={classnames(styles.actionBtn, styles.btnSuccess)}>
                      <Text>✓ 已签到</Text>
                    </View>
                  )}
                  {appt.status === 'rescheduled' && (
                    <View className={classnames(styles.actionBtn, styles.btnPrimary)}>
                      <Text>查看新预约</Text>
                    </View>
                  )}
                  {appt.status === 'cancelled' && (
                    <View className={classnames(styles.actionBtn, styles.btnSecondary)}>
                      <Text>已取消</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📅</Text>
            <Text className={styles.emptyText}>今日暂无预约</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default AppointmentPage;
