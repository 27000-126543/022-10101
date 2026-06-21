import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

interface QuickActionItem {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  onClick: () => void;
}

interface QuickActionProps {
  items: QuickActionItem[];
}

const QuickAction: React.FC<QuickActionProps> = ({ items }) => {
  return (
    <View className={styles.container}>
      {items.map((item, index) => (
        <View key={index} className={styles.item} onClick={item.onClick}>
          <View className={styles.iconWrapper} style={{ background: item.bgColor }}>
            <Text className={styles.icon} style={{ color: item.color }}>
              {item.icon}
            </Text>
          </View>
          <Text className={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

export default QuickAction;
