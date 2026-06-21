import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface StatCardProps {
  title: string;
  value: number | string;
  color?: string;
  subtitle?: string;
  onClick?: () => void;
  isCurrency?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, subtitle, onClick, isCurrency }) => {
  const displayValue = isCurrency && typeof value === 'number'
    ? value.toLocaleString('zh-CN')
    : value;

  return (
    <View className={styles.card} onClick={onClick}>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.value} style={{ color: color || '#E91E8C' }}>
        {displayValue}
      </Text>
      {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

export default StatCard;
