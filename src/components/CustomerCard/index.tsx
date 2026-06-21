import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import StatusTag from '@/components/StatusTag';
import { Customer, STATUS_LABELS } from '@/types';
import styles from './index.module.scss';
import classnames from 'classnames';

interface CustomerCardProps {
  customer: Customer;
  onClick?: () => void;
  showStatus?: boolean;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onClick, showStatus = true }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/customer-detail/index?id=${customer.id}`
      });
    }
  };

  const followInfo = useMemo(() => {
    const now = new Date();
    const nextFollow = customer.nextFollowAt ? new Date(customer.nextFollowAt.replace(/-/g, '/')) : null;
    const firstConsult = customer.firstConsultReminder ? new Date(customer.firstConsultReminder.replace(/-/g, '/')) : null;

    let statusHint = '';
    let hintType: 'normal' | 'urgent' | 'overdue' = 'normal';

    if (customer.status === 'new' && firstConsult) {
      const diffMinutes = (firstConsult.getTime() - now.getTime()) / (1000 * 60);
      if (diffMinutes <= 0) {
        statusHint = '首咨已超时！';
        hintType = 'overdue';
      } else if (diffMinutes <= 30) {
        statusHint = `首咨提醒：${Math.round(diffMinutes)}分钟后`;
        hintType = 'urgent';
      } else {
        statusHint = `首咨：${customer.firstConsultReminder.split(' ')[1]}`;
      }
    } else if (customer.status === 'wakeup') {
      statusHint = `沉睡${customer.followCount}次未回复`;
      hintType = 'overdue';
    } else if (nextFollow) {
      const diffHours = (nextFollow.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours <= 0) {
        statusHint = '跟进已超时！';
        hintType = 'overdue';
      } else if (diffHours <= 2) {
        statusHint = `跟进：${Math.round(diffHours * 60)}分钟后`;
        hintType = 'urgent';
      } else if (diffHours <= 24) {
        statusHint = `下次跟进：${nextFollow.getHours()}:${String(nextFollow.getMinutes()).padStart(2, '0')}`;
      } else {
        statusHint = `下次跟进：${nextFollow.getMonth() + 1}/${nextFollow.getDate()}`;
      }
    }

    return { statusHint, hintType };
  }, [customer]);

  return (
    <View className={classnames(styles.card, styles[customer.status])} onClick={handleClick}>
      <View className={styles.leftBorder}></View>
      <View className={styles.content}>
        <View className={styles.header}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{customer.name}</Text>
            {customer.isVip && <Text className={styles.vipBadge}>VIP</Text>}
            {customer.referrerName && <Text className={styles.referBadge}>🎁转介绍</Text>}
          </View>
          {showStatus && <StatusTag status={customer.status} />}
        </View>

        {followInfo.statusHint && (
          <View className={classnames(styles.followHint, styles[`hint-${followInfo.hintType}`])}>
            <Text className={styles.hintIcon}>
              {followInfo.hintType === 'overdue' ? '⏰' : followInfo.hintType === 'urgent' ? '🔔' : '📅'}
            </Text>
            <Text className={styles.hintText}>{followInfo.statusHint}</Text>
          </View>
        )}

        <Text className={styles.phone}>{customer.phone}</Text>

        <View className={styles.projects}>
          {customer.projectPreference.slice(0, 3).map((p, idx) => (
            <Text key={idx} className={styles.projectTag}>
              {p}
            </Text>
          ))}
        </View>

        <View className={styles.footer}>
          <Text className={styles.channel}>来源：{customer.channel}</Text>
          {customer.activityName && (
            <Text className={styles.activity}>{customer.activityName}</Text>
          )}
        </View>

        {customer.referrerName && (
          <View className={styles.referrer}>
            <Text className={styles.referrerText}>转介绍：{customer.referrerName}</Text>
          </View>
        )}

        <View className={styles.meta}>
          <Text className={styles.metaText}>跟进{customer.followCount}次</Text>
          {customer.totalConsumption && customer.totalConsumption > 0 && (
            <Text className={styles.metaText}>消费¥{customer.totalConsumption}</Text>
          )}
          {customer.followStage && (
            <Text className={styles.metaText}>阶段{customer.followStage}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default CustomerCard;
