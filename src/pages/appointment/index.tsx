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
  const [weekStartOffset, setWeekStartOffset] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleRemark, setRescheduleRemark] = useState('');

  const today = new Date();
  const DAYS_SHOWN = 30;
  const weekDays = useMemo(() => {
    const base = new Date(today);
    base.setDate(today.getDate() + weekStartOffset);
    return Array.from({ length: DAYS_SHOWN }, (_, i) => {
      const date = new Date(base);
      date.setDate(base.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const count = appointments.filter((a) => a.date === dateStr).length;
      return {
        date: dateStr,
        day: date.getDate(),
        week: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
        count
      };
    });
  }, [appointments, weekStartOffset]);

  const selectedDate = weekDays[selectedDateIndex].date;

  const todayStr = today.toISOString().split('T')[0];
  const searchResults = useMemo(() => {
    if (!searchKeyword.trim()) return [];
    const kw = searchKeyword.toLowerCase().trim();

    const matchedCustomerIds = storeCustomers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(kw) ||
          c.phone.includes(kw) ||
          c.projectPreference.some((p) => p.includes(kw))
      )
      .map((c) => c.id);

    return appointments
      .filter(
        (a) =>
          matchedCustomerIds.includes(a.customerId) ||
          a.project.includes(kw) ||
          a.customerName.toLowerCase().includes(kw) ||
          a.customerPhone.includes(kw)
      )
      .filter((a) => a.status !== 'cancelled')
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
  }, [searchKeyword, appointments, storeCustomers]);

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

    setTimeout(() => {
      const newDateObj = new Date(newDate.replace(/-/g, '/'));
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((newDateObj.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));

      let targetOffset = weekStartOffset;
      if (diffDays < weekStartOffset || diffDays >= weekStartOffset + DAYS_SHOWN) {
        targetOffset = Math.max(0, diffDays - Math.floor(DAYS_SHOWN / 2));
        setWeekStartOffset(targetOffset);
      }
      const relativeIdx = diffDays - targetOffset;
      if (relativeIdx >= 0 && relativeIdx < DAYS_SHOWN) {
        setSelectedDateIndex(relativeIdx);
      }
      setStatusFilter('rescheduled');
    }, 300);

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
      <View className={styles.searchSection}>
        <View className={styles.searchBar} onClick={() => setShowSearchInput(true)}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Text className={styles.searchPlaceholder}>
            {searchKeyword || '搜索客户姓名、电话、预约项目'}
          </Text>
        </View>
      </View>

      {searchKeyword.trim() ? (
        <View className={styles.searchResults}>
          <View className={styles.searchResultHeader}>
            <Text className={styles.searchResultTitle}>搜索结果</Text>
            <Text className={styles.searchResultCount}>共 {searchResults.length} 条预约</Text>
          </View>
          {searchResults.length > 0 ? (
            <View className={styles.searchResultList}>
              {searchResults.map((appt) => (
                <View
                  key={appt.id}
                  className={styles.searchResultItem}
                  onClick={() =>
                    Taro.navigateTo({
                      url: `/pages/customer-detail/index?id=${appt.customerId}&appointmentId=${appt.id}`
                    })
                  }
                >
                  <View className={styles.searchResultMain}>
                    <View className={styles.searchResultInfo}>
                      <Text className={styles.searchResultName}>{appt.customerName}</Text>
                      <Text className={styles.searchResultPhone}>{appt.customerPhone}</Text>
                    </View>
                    <Text className={classnames(styles.statusBadge, styles[getBadgeClass(appt.status)])}>
                      {statusLabels[appt.status]}
                    </Text>
                  </View>
                  <View className={styles.searchResultDetail}>
                    <Text className={styles.searchResultProject}>📋 {appt.project}</Text>
                    <Text className={styles.searchResultDateTime}>📅 {formatDate(appt.date)} {appt.time}</Text>
                  </View>
                  {appt.rescheduleRemark && (
                    <Text className={styles.searchResultRemark}>
                      🔄 改期原因：{appt.rescheduleRemark}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptySearch}>
              <Text className={styles.emptySearchIcon}>🔍</Text>
              <Text className={styles.emptySearchText}>未找到相关预约</Text>
            </View>
          )}
        </View>
      ) : (
        <>
          <View className={styles.dateSection}>
        <View className={styles.dateNav}>
          <View
            className={classnames(styles.navBtn, weekStartOffset === 0 && styles.navBtnDisabled)}
            onClick={() => {
              if (weekStartOffset > 0) {
                setWeekStartOffset(Math.max(0, weekStartOffset - 7));
                setSelectedDateIndex(Math.min(selectedDateIndex, DAYS_SHOWN - 1));
              }
            }}
          >
            <Text className={styles.navBtnText}>‹</Text>
          </View>
          <Text className={styles.currentDate}>
            {weekStartOffset === 0 ? currentDateStr : `${currentDateStr}+${weekStartOffset}天`}
          </Text>
          <View
            className={styles.navBtn}
            onClick={() => {
              setWeekStartOffset(weekStartOffset + 7);
              setSelectedDateIndex(Math.min(selectedDateIndex, DAYS_SHOWN - 1));
            }}
          >
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
        </>
      )}

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

      {showSearchInput && (
        <View className={styles.inputOverlay} onClick={() => setShowSearchInput(false)}>
          <View className={styles.inputContainer} onClick={(e) => e.stopPropagation()}>
            <View className={styles.inputBox}>
              <Input
                className={styles.realInput}
                placeholder="搜索客户姓名、电话、预约项目"
                value={searchKeyword}
                onInput={(e) => setSearchKeyword(e.detail.value)}
                focus
                confirmType="search"
              />
              <Text
                className={styles.cancelBtn}
                onClick={() => {
                  setShowSearchInput(false);
                  setSearchKeyword('');
                }}
              >
                取消
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default AppointmentPage;
