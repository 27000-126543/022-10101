import React, { useState, useMemo } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useCustomerStore } from '@/store/customerStore';
import { STATUS_LABELS, CustomerStatus, STATUS_COLORS } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

const CustomerDetailPage: React.FC = () => {
  const router = useRouter();
  const { customers, updateCustomerStatus } = useCustomerStore();
  const customerId = router.params.id;

  const customer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  );

  const [referrerName, setReferrerName] = useState('');

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
    Taro.showToast({ title: '预约功能', icon: 'none' });
  };

  const handleRecordTransaction = () => {
    Taro.showToast({ title: '成交登记成功', icon: 'success' });
  };

  const handleBindReferrer = () => {
    if (!referrerName.trim()) {
      Taro.showToast({ title: '请输入推荐人姓名', icon: 'none' });
      return;
    }
    Taro.showToast({ title: `已绑定推荐人：${referrerName}`, icon: 'success' });
    setReferrerName('');
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.avatar}>
          <Text className={styles.avatarText}>{customer.name.charAt(0)}</Text>
        </View>
        <View className={styles.info}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{customer.name}</Text>
            {customer.isVip && <Text className={styles.vipBadge}>VIP</Text>}
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
              <Text className={styles.infoLabel}>推荐人</Text>
              <Text className={styles.infoValue}>{customer.referrerName || '—'}</Text>
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
            <View className={classnames(styles.followBtn, styles.btnTemplate)} onClick={handleSendMessage}>
              <Text>模板消息</Text>
            </View>
            <View className={classnames(styles.followBtn, styles.btnRemind)} onClick={handleMakeAppointment}>
              <Text>预约提醒</Text>
            </View>
            <View className={classnames(styles.followBtn, styles.btnBirthday)}>
              <Text>生日祝福</Text>
            </View>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>📝</Text>跟进记录
          </Text>
          <View className={styles.followHistory}>
            {customer.lastFollowAt ? (
              <View className={styles.historyItem}>
                <View className={styles.historyDot}></View>
                <View className={styles.historyLine}></View>
                <View className={styles.historyContent}>
                  <Text className={styles.historyText}>已发送首次问候消息，等待客户回复</Text>
                  <Text className={styles.historyMeta}>{customer.lastFollowAt} · 咨询顾问小美</Text>
                </View>
              </View>
            ) : (
              <View className={styles.emptyHistory}>
                <Text className={styles.emptyText}>暂无跟进记录，点击下方按钮开始跟进</Text>
              </View>
            )}
          </View>
        </View>

        <View className={styles.referralSection}>
          <Text className={styles.referralTitle}>
            <Text>🎁</Text>老客转介绍绑定
          </Text>
          <Input
            className={styles.referralInput}
            placeholder="输入推荐人姓名进行绑定"
            value={referrerName}
            onInput={(e) => setReferrerName(e.detail.value)}
          />
          <View className={styles.referralBtn} onClick={handleBindReferrer}>
            <Text>确认绑定</Text>
          </View>
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
    </View>
  );
};

export default CustomerDetailPage;
