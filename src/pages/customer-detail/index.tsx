import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView, Picker } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useCustomerStore } from '@/store/customerStore';
import { STATUS_LABELS, CustomerStatus, PROJECT_OPTIONS, TIME_SLOTS } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

const CustomerDetailPage: React.FC = () => {
  const router = useRouter();
  const customerId = router.params.id!;

  const storeCustomers = useCustomerStore((s) => s.customers);
  const storeAppointments = useCustomerStore((s) => s.appointments);
  const storeFollowUpRecords = useCustomerStore((s) => s.followUpRecords);
  const storeTransactions = useCustomerStore((s) => s.transactions);

  const updateCustomerStatus = useCustomerStore((s) => s.updateCustomerStatus);
  const addAppointment = useCustomerStore((s) => s.addAppointment);
  const addTransaction = useCustomerStore((s) => s.addTransaction);
  const bindReferrer = useCustomerStore((s) => s.bindReferrer);
  const recordFollowUp = useCustomerStore((s) => s.recordFollowUp);
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);

  const customer = useMemo(
    () => storeCustomers.find((c) => c.id === customerId),
    [storeCustomers, customerId]
  );

  const appointments = useMemo(
    () => storeAppointments.filter((a) => a.customerId === customerId),
    [storeAppointments, customerId]
  );

  const followUpRecords = useMemo(
    () =>
      storeFollowUpRecords
        .filter((r) => r.customerId === customerId)
        .sort((a, b) => new Date(b.createdAt.replace(/-/g, '/')).getTime() - new Date(a.createdAt.replace(/-/g, '/')).getTime()),
    [storeFollowUpRecords, customerId]
  );

  const customerTransactions = useMemo(
    () => storeTransactions.filter((t) => t.customerId === customerId),
    [storeTransactions, customerId]
  );

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showReferrerModal, setShowReferrerModal] = useState(false);

  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentProject, setAppointmentProject] = useState('');
  const [appointmentRemark, setAppointmentRemark] = useState('');

  const [transactionProject, setTransactionProject] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionRemark, setTransactionRemark] = useState('');

  const [referrerName, setReferrerName] = useState('');
  const [referrerPhone, setReferrerPhone] = useState('');

  if (!customer) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text>客户不存在</Text>
        </View>
      </View>
    );
  }

  const statusOptions: { key: CustomerStatus; activeClass: string }[] = [
    { key: 'new', activeClass: 'activeNew' },
    { key: 'contacted', activeClass: 'activeContacted' },
    { key: 'pending', activeClass: 'activePending' },
    { key: 'wakeup', activeClass: 'activeWakeup' }
  ];

  const handleStatusChange = (status: CustomerStatus) => {
    updateCustomerStatus(customer.id, status);
    Taro.showToast({ title: `状态已更新为${STATUS_LABELS[status]}`, icon: 'success' });
  };

  const handleSendMessage = () => {
    Taro.navigateTo({
      url: `/pages/message-template/index?id=${customer.id}`
    });
  };

  const handleMakeAppointment = () => {
    const today = new Date().toISOString().split('T')[0];
    setAppointmentDate(today);
    setAppointmentTime('');
    setAppointmentProject(customer.projectPreference[0] || '');
    setAppointmentRemark('');
    setShowAppointmentModal(true);
  };

  const handleSubmitAppointment = () => {
    if (!appointmentDate) {
      Taro.showToast({ title: '请选择预约日期', icon: 'none' });
      return;
    }
    if (!appointmentTime) {
      Taro.showToast({ title: '请选择预约时间', icon: 'none' });
      return;
    }
    if (!appointmentProject) {
      Taro.showToast({ title: '请选择预约项目', icon: 'none' });
      return;
    }

    addAppointment({
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      project: appointmentProject,
      date: appointmentDate,
      time: appointmentTime,
      status: 'pending',
      remark: appointmentRemark || undefined
    });

    recordFollowUp(customer.id, 'reminder', `已预约${appointmentProject}，时间：${appointmentDate} ${appointmentTime}`);

    Taro.showToast({ title: '预约成功', icon: 'success' });
    setShowAppointmentModal(false);
  };

  const handleRecordTransaction = () => {
    setTransactionProject(customer.projectPreference[0] || '');
    setTransactionAmount('');
    setTransactionRemark('');
    setShowTransactionModal(true);
  };

  const handleSubmitTransaction = () => {
    if (!transactionProject) {
      Taro.showToast({ title: '请选择成交项目', icon: 'none' });
      return;
    }
    if (!transactionAmount || Number(transactionAmount) <= 0) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }

    addTransaction({
      customerId: customer.id,
      customerName: customer.name,
      project: transactionProject,
      amount: Number(transactionAmount),
      remark: transactionRemark || undefined
    });

    recordFollowUp(customer.id, 'other', `成交登记：${transactionProject}，金额¥${transactionAmount}`);

    Taro.showToast({ title: '成交登记成功', icon: 'success' });
    setShowTransactionModal(false);
  };

  const handleBindReferrer = () => {
    setReferrerName(customer.referrerName || '');
    setReferrerPhone(customer.referrerPhone || '');
    setShowReferrerModal(true);
  };

  const handleSubmitReferrer = () => {
    if (!referrerName.trim()) {
      Taro.showToast({ title: '请输入推荐人姓名', icon: 'none' });
      return;
    }

    bindReferrer(customer.id, referrerName.trim(), referrerPhone.trim() || undefined);

    Taro.showToast({ title: `已绑定推荐人：${referrerName}`, icon: 'success' });
    setShowReferrerModal(false);
    setReferrerName('');
    setReferrerPhone('');
  };

  const handleQuickFollow = (type: 'greeting' | 'case' | 'discount' | 'reminder') => {
    const typeNames = {
      greeting: '问候消息',
      case: '案例分享',
      discount: '优惠说明',
      reminder: '预约提醒'
    };
    recordFollowUp(customer.id, type, `发送${typeNames[type]}，客户${customer.status === 'new' ? '首次' : '继续'}跟进`);
    Taro.showToast({ title: `已发送${typeNames[type]}`, icon: 'success' });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { text: string; className: string }> = {
      pending: { text: '待确认', className: 'statusPending' },
      confirmed: { text: '已确认', className: 'statusConfirmed' },
      arrived: { text: '已到院', className: 'statusArrived' },
      cancelled: { text: '已取消', className: 'statusCancelled' },
      rescheduled: { text: '已改期', className: 'statusRescheduled' }
    };
    return map[status] || { text: status, className: '' };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr.replace(/-/g, '/'));
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${month}月${day}日 ${weekdays[date.getDay()]}`;
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.avatar}>
          <Text className={styles.avatarText}>{customer.name.charAt(0)}</Text>
        </View>
        <View className={styles.info}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{customer.name}</Text>
            {customer.isVip && <Text className={styles.vipBadge}>VIP</Text>}
            {customer.referrerName && <Text className={styles.referBadge}>🎁转介绍</Text>}
          </View>
          <Text className={styles.phone}>{customer.phone}</Text>
          <View className={styles.tags}>
            {customer.tags.map((tag, idx) => (
              <Text key={idx} className={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>📋</Text>客户状态
          </Text>
          <View className={styles.statusSelector}>
            {statusOptions.map((opt) => (
              <View
                key={opt.key}
                className={classnames(
                  styles.statusBtn,
                  customer.status === opt.key && styles[opt.activeClass]
                )}
                onClick={() => handleStatusChange(opt.key)}
              >
                <Text>{STATUS_LABELS[opt.key]}</Text>
              </View>
            ))}
          </View>
          {customer.nextFollowAt && (
            <View className={styles.followSchedule}>
              <Text className={styles.scheduleLabel}>📅 跟进节奏</Text>
              <View className={styles.scheduleInfo}>
                <Text className={styles.scheduleText}>下次跟进：{customer.nextFollowAt}</Text>
                {customer.followStage && (
                  <Text className={styles.scheduleStage}>第{customer.followStage}阶段</Text>
                )}
              </View>
            </View>
          )}
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>👤</Text>基本信息
          </Text>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>来源渠道</Text>
              <Text className={styles.infoValue}>{customer.channel}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>录入时间</Text>
              <Text className={styles.infoValue}>{customer.createdAt.split(' ')[0]}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>关联活动</Text>
              <Text className={styles.infoValue}>{customer.activityName || '—'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>生日</Text>
              <Text className={styles.infoValue}>{customer.birthday || '未填写'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>跟进次数</Text>
              <Text className={styles.infoValue}>{customer.followCount}次</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>累计消费</Text>
              <Text className={styles.infoValue}>
                {customer.totalConsumption ? `¥${customer.totalConsumption}` : '—'}
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>💄</Text>关注项目
          </Text>
          <View className={styles.projects}>
            {customer.projectPreference.map((p, idx) => (
              <Text key={idx} className={styles.projectTag}>
                {p}
              </Text>
            ))}
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>💬</Text>快捷跟进
          </Text>
          <View className={styles.followBtns}>
            <View
              className={classnames(styles.followBtn, styles.btnTemplate)}
              onClick={() => handleQuickFollow('greeting')}
            >
              <Text>问候消息</Text>
            </View>
            <View
              className={classnames(styles.followBtn, styles.btnCase)}
              onClick={() => handleQuickFollow('case')}
            >
              <Text>案例分享</Text>
            </View>
            <View
              className={classnames(styles.followBtn, styles.btnDiscount)}
              onClick={() => handleQuickFollow('discount')}
            >
              <Text>优惠说明</Text>
            </View>
          </View>
        </View>

        {appointments.length > 0 && (
          <View className={styles.card}>
            <Text className={styles.cardTitle}>
              <Text className={styles.titleIcon}>📅</Text>预约记录
            </Text>
            <View className={styles.appointmentList}>
              {appointments.map((appt) => {
                const badge = getStatusBadge(appt.status);
                return (
                  <View key={appt.id} className={styles.appointmentItem}>
                    <View className={styles.appointmentHeader}>
                      <View className={styles.appointmentMain}>
                        <Text className={styles.appointmentProject}>{appt.project}</Text>
                        <Text className={classnames(styles.appointmentBadge, styles[badge.className])}>
                          {badge.text}
                        </Text>
                      </View>
                      <Text className={styles.appointmentTime}>
                        {formatDate(appt.date)} {appt.time}
                      </Text>
                    </View>
                    {appt.originalDate && (
                      <Text className={styles.appointmentOriginal}>
                        原预约：{formatDate(appt.originalDate)} {appt.originalTime}
                      </Text>
                    )}
                    {appt.rescheduleRemark && (
                      <Text className={styles.appointmentRescheduleRemark}>
                        改期原因：{appt.rescheduleRemark}
                      </Text>
                    )}
                    {appt.remark && !appt.rescheduleRemark && (
                      <Text className={styles.appointmentRemark}>备注：{appt.remark}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {customerTransactions.length > 0 && (
          <View className={styles.card}>
            <Text className={styles.cardTitle}>
              <Text className={styles.titleIcon}>💰</Text>成交记录
            </Text>
            <View className={styles.transactionList}>
              {customerTransactions.map((t) => (
                <View key={t.id} className={styles.transactionItem}>
                  <View className={styles.transactionInfo}>
                    <Text className={styles.transactionProject}>{t.project}</Text>
                    <Text className={styles.transactionDate}>{t.date}</Text>
                  </View>
                  <Text className={styles.transactionAmount}>¥{t.amount}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>📝</Text>跟进记录
          </Text>
          <View className={styles.followHistory}>
            {followUpRecords.length > 0 ? (
              followUpRecords.map((record, idx) => (
                <View key={record.id} className={styles.historyItem}>
                  <View className={styles.historyDot}></View>
                  {idx < followUpRecords.length - 1 && <View className={styles.historyLine}></View>}
                  <View className={styles.historyContent}>
                    <Text className={styles.historyText}>{record.content}</Text>
                    <Text className={styles.historyMeta}>
                      {record.createdAt} · {record.operator}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View className={styles.emptyHistory}>
                <Text className={styles.emptyText}>暂无跟进记录，点击下方按钮开始跟进</Text>
              </View>
            )}
          </View>
        </View>

        <View className={styles.referralSection} onClick={handleBindReferrer}>
          <Text className={styles.referralTitle}>
            <Text>🎁</Text>老客转介绍绑定
          </Text>
          {customer.referrerName ? (
            <View className={styles.referralBound}>
              <Text className={styles.boundLabel}>已绑定推荐人</Text>
              <Text className={styles.boundName}>
                {customer.referrerName}
                {customer.referrerPhone && ` (${customer.referrerPhone})`}
              </Text>
            </View>
          ) : (
            <View className={styles.referralHint}>
              <Text className={styles.hintText}>点击绑定推荐人，享受老客转介绍奖励</Text>
              <Text className={styles.hintArrow}>→</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={classnames(styles.bottomBtn, styles.btnSecondary)} onClick={handleSendMessage}>
          <Text>发送消息</Text>
        </View>
        <View className={classnames(styles.bottomBtn, styles.btnPrimary)} onClick={handleMakeAppointment}>
          <Text>预约到院</Text>
        </View>
        <View className={classnames(styles.bottomBtn, styles.btnSuccess)} onClick={handleRecordTransaction}>
          <Text>成交登记</Text>
        </View>
      </View>

      {showAppointmentModal && (
        <View className={styles.modalOverlay} onClick={() => setShowAppointmentModal(false)}>
          <View className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>新增预约</Text>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>预约日期
              </Text>
              <Picker
                mode='date'
                value={appointmentDate}
                start={new Date().toISOString().split('T')[0]}
                onChange={(e) => setAppointmentDate(e.detail.value)}
              >
                <View className={styles.pickerBox}>
                  <Text className={appointmentDate ? styles.pickerText : styles.placeholder}>
                    {appointmentDate || '请选择日期'}
                  </Text>
                  <Text className={styles.pickerArrow}>▼</Text>
                </View>
              </Picker>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>预约时间
              </Text>
              <View className={styles.timeGrid}>
                {TIME_SLOTS.map((time) => (
                  <View
                    key={time}
                    className={classnames(
                      styles.timeTag,
                      appointmentTime === time && styles.timeTagActive
                    )}
                    onClick={() => setAppointmentTime(time)}
                  >
                    <Text>{time}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>预约项目
              </Text>
              <View className={styles.projectGrid}>
                {PROJECT_OPTIONS.map((project) => (
                  <View
                    key={project}
                    className={classnames(
                      styles.projectItem,
                      appointmentProject === project && styles.projectItemActive
                    )}
                    onClick={() => setAppointmentProject(project)}
                  >
                    <Text>{project}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>备注（选填）</Text>
              <Input
                className={styles.formInput}
                placeholder='请输入备注信息'
                value={appointmentRemark}
                onInput={(e) => setAppointmentRemark(e.detail.value)}
              />
            </View>

            <View className={styles.modalActions}>
              <View
                className={classnames(styles.modalBtn, styles.modalBtnCancel)}
                onClick={() => setShowAppointmentModal(false)}
              >
                <Text>取消</Text>
              </View>
              <View
                className={classnames(styles.modalBtn, styles.modalBtnConfirm)}
                onClick={handleSubmitAppointment}
              >
                <Text>确认预约</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {showTransactionModal && (
        <View className={styles.modalOverlay} onClick={() => setShowTransactionModal(false)}>
          <View className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>成交登记</Text>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>成交项目
              </Text>
              <View className={styles.projectGrid}>
                {PROJECT_OPTIONS.map((project) => (
                  <View
                    key={project}
                    className={classnames(
                      styles.projectItem,
                      transactionProject === project && styles.projectItemActive
                    )}
                    onClick={() => setTransactionProject(project)}
                  >
                    <Text>{project}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>成交金额（元）
              </Text>
              <Input
                className={styles.formInput}
                type='digit'
                placeholder='请输入成交金额'
                value={transactionAmount}
                onInput={(e) => setTransactionAmount(e.detail.value)}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>备注（选填）</Text>
              <Input
                className={styles.formInput}
                placeholder='请输入备注信息'
                value={transactionRemark}
                onInput={(e) => setTransactionRemark(e.detail.value)}
              />
            </View>

            <View className={styles.modalActions}>
              <View
                className={classnames(styles.modalBtn, styles.modalBtnCancel)}
                onClick={() => setShowTransactionModal(false)}
              >
                <Text>取消</Text>
              </View>
              <View
                className={classnames(styles.modalBtn, styles.modalBtnSuccess)}
                onClick={handleSubmitTransaction}
              >
                <Text>确认登记</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {showReferrerModal && (
        <View className={styles.modalOverlay} onClick={() => setShowReferrerModal(false)}>
          <View className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>绑定推荐人</Text>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>推荐人姓名
              </Text>
              <Input
                className={styles.formInput}
                placeholder='请输入推荐人姓名'
                value={referrerName}
                onInput={(e) => setReferrerName(e.detail.value)}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>推荐人电话（选填）</Text>
              <Input
                className={styles.formInput}
                type='number'
                placeholder='请输入推荐人电话'
                value={referrerPhone}
                onInput={(e) => setReferrerPhone(e.detail.value)}
                maxlength={11}
              />
            </View>

            <View className={styles.modalActions}>
              <View
                className={classnames(styles.modalBtn, styles.modalBtnCancel)}
                onClick={() => setShowReferrerModal(false)}
              >
                <Text>取消</Text>
              </View>
              <View
                className={classnames(styles.modalBtn, styles.modalBtnWarning)}
                onClick={handleSubmitReferrer}
              >
                <Text>确认绑定</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default CustomerDetailPage;
