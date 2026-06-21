import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface SectionHeaderProps {
  title: string;
  extra?: React.ReactNode;
  showMore?: boolean;
  onMore?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, extra, showMore, onMore }) => {
  return (
    <View className={styles.header}>
      <View className={styles.titleRow}>
        <View className={styles.titleBar}></View>
        <Text className={styles.title}>{title}</Text>
      </View>
      <View className={styles.extra}>
        {extra}
        {showMore && (
          <Text className={styles.more} onClick={onMore}>
            查看更多
          </Text>
        )}
      </View>
    </View>
  );
};

export default SectionHeader;
