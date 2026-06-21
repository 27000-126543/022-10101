import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useCustomerStore } from '@/store/customerStore';
import { Appointment, TIME_SLOTS } from '@/types';
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
  const appointments = useCustomerStore((s) => s.appointments);
  const storeCustomers = useCustomerStore((s) => s.customers);
  const updateAppointmentStatus = useCustomerStore((s) => s.updateAppointmentStatus);
  const rescheduleAppointment = useCustomerStore((s) => s.rescheduleAppointment);

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleRemark, setRescheduleRemark] = useState('');

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
  }, [appointments]);

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
      arrived: dayAppts.filter((a) => a.status === 'arrived').length,
      rescheduled: appointments.filter((a) => a.status === 'rescheduled').length
    };
  }, [appointments, selectedDate]);

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNewDate(selectedDate);
    setNewTime('');
    setRescheduleRemark('');
    setShowRescheduleModal(true);
  };

  const handleSubmitReschedule = () => {
    if (!selectedAppointment) return;
    if (!newDate) {
      Taro.showToast({ title: '请选择新日期', icon: 'none' });
      return;
    }
    if (!newTime) {
      Taro.showToast({ title: '请选择新时间', icon: 'none' });
      return;
    }
    if (!rescheduleRemark.trim()) {
      Taro.showToast({ title: '请填写改期原因', icon: 'none' });
      return;
    }

    rescheduleAppointment(selectedAppointment.id, newDate, newTime, rescheduleRemark.trim());
    Taro.showToast({ title: '改期成功', icon: 'success' });
    setShowRescheduleModal(false);

    const newDateIdx = weekDays.findIndex((d) => d.date === newDate);
    if (newDateIdx >= 0 && newDateIdx !== selectedDateIndex) {
      setTimeout(() => {
        setSelectedDateIndex(newDateIdx);
        setStatusFilter('rescheduled');
      }, 300);
    }

    setSelectedAppointment(null);
  };

  const handleAction = (appointment: Appointment, action: string) => {
    const customer = storeCustomers.find((c) => c.id === appointment.customerId);
    switch (action) {
      case 'arrive':
        updateAppointmentStatus(appointment.id, 'arrived');
        if (customer && customer.status !== 'pending') {
          console.log('[Appointment] 客户到院，状态更新');
        }
        Taro.showToast({ title: '签到成功', icon: 'success' });
        break;
      case 'confirm':
        updateAppointmentStatus(appointment.id, 'confirmed');
        Taro.showToast({ title: '已确认', icon: 'success' });
        break;
      case 'reschedule':
        handleReschedule(appointment);
        break;
      case 'viewNew':
        Taro.navigateTo({
          url: `/pages/customer-detail/index?id=${appointment.customerId}`
        });
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr.replace(/-/g, '/'));
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

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
          {stats.rescheduled > 0 && (
            <View className={styles.statItem}>
              <Text className={classnames(styles.statValue, styles.statValue4)}>{stats.rescheduled}</Text>
              <Text className={styles.statLabel}>待处理改期</Text>
            </View>
          )}
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
                  {appt.originalDate && (
                    <Text className={styles.rescheduleText}>
                      🔄 改期：原{formatDate(appt.originalDate)} → {formatDate(appt.date)}
                    </Text>
                  )}
                  {appt.rescheduleRemark && (
                    <Text className={styles.rescheduleRemarkText}>
                      改期原因：{appt.rescheduleRemark}
                    </Text>
                  )}
                  {appt.remark && !appt.rescheduleRemark && (
                    <Text className={styles.remarkText}>备注：{appt.remark}</Text>
                  )}
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
                    <View
                      className={classnames(styles.actionBtn, styles.btnPrimary)}
                      onClick={() => handleAction(appt, 'viewNew')}
                    >
                      <Text>查看客户详情</Text>
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

      {showRescheduleModal && selectedAppointment && (
        <View className={styles.modalOverlay} onClick={() => setShowRescheduleModal(false)}>
          <View className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>预约改期</Text>

            <View className={styles.currentAppt}>
              <Text className={styles.currentLabel}>当前预约</Text>
              <Text className={styles.currentInfo}>
                {selectedAppointment.date} {selectedAppointment.time} · {selectedAppointment.project}
              </Text>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>新预约日期
              </Text>
              <Picker
                mode='date'
                value={newDate}
                start={new Date().toISOString().split('T')[0]}
                onChange={(e) => setNewDate(e.detail.value)}
              >
                <View className={styles.pickerBox}>
                  <Text className={newDate ? styles.pickerText : styles.placeholder}>
                    {newDate || '请选择日期'}
                  </Text>
                  <Text className={styles.pickerArrow}>▼</Text>
                </View>
              </Picker>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>新预约时间
              </Text>
              <View className={styles.timeGrid}>
                {TIME_SLOTS.map((time) => (
                  <View
                    key={time}
                    className={classnames(
                      styles.timeTag,
                      newTime === time && styles.timeTagActive
                    )}
                    onClick={() => setNewTime(time)}
                  >
                    <Text>{time}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>改期原因
              </Text>
              <Input
                className={styles.formInput}
                placeholder='请填写改期原因，便于后续跟进'
                value={rescheduleRemark}
                onInput={(e) => setRescheduleRemark(e.detail.value)}
              />
            </View>

            <View className={styles.modalActions}>
              <View
                className={classnames(styles.modalBtn, styles.modalBtnCancel)}
                onClick={() => setShowRescheduleModal(false)}
              >
                <Text>取消</Text>
              </View>
              <View
                className={classnames(styles.modalBtn, styles.modalBtnWarning)}
                onClick={handleSubmitReschedule}
              >
                <Text>确认改期</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default AppointmentPage;
