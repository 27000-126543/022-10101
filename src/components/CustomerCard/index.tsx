import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import StatusTag from '@/components/StatusTag';
import { Customer } from '@/types';
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

  return (
    <View className={classnames(styles.card, styles[customer.status])} onClick={handleClick}>
      <View className={styles.leftBorder}></View>
      <View className={styles.content}>
        <View className={styles.header}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{customer.name}</Text>
            {customer.isVip && <Text className={styles.vipBadge}>VIP</Text>}
          </View>
          {showStatus && <StatusTag status={customer.status} />}
        </View>

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
          {customer.nextFollowAt && (
            <Text className={styles.metaText}>下次：{customer.nextFollowAt.split(' ')[1] || customer.nextFollowAt}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default CustomerCard;
