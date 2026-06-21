import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useCustomerStore } from '@/store/customerStore';
import { CustomerStatus, STATUS_LABELS, STATUS_COLORS } from '@/types';
import CustomerCard from '@/components/CustomerCard';
import classnames from 'classnames';
import styles from './index.module.scss';

type FilterType = 'all' | CustomerStatus;

const QueuePage: React.FC = () => {
  const { customers, getDailyStats, searchCustomers, checkAndUpdateWakeupStatus } = useCustomerStore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  const stats = useMemo(() => getDailyStats(), [getDailyStats]);

  useDidShow(() => {
    console.log('[QueuePage] 页面显示，检查需唤醒客户...');
    checkAndUpdateWakeupStatus();
  });

  useEffect(() => {
    checkAndUpdateWakeupStatus();
  }, [checkAndUpdateWakeupStatus]);

  const filters: { key: FilterType; label: string; count: number; colorKey: string }[] = [
    { key: 'all', label: '全部', count: customers.length, colorKey: 'active' },
    { key: 'new', label: STATUS_LABELS.new, count: stats.newLeads, colorKey: 'newActive' },
    { key: 'contacted', label: STATUS_LABELS.contacted, count: stats.contacted, colorKey: 'contactedActive' },
    { key: 'pending', label: STATUS_LABELS.pending, count: stats.pending, colorKey: 'pendingActive' },
    { key: 'wakeup', label: STATUS_LABELS.wakeup, count: stats.wakeup, colorKey: 'wakeupActive' }
  ];

  const filteredCustomers = useMemo(() => {
    let result = searchKeyword ? searchCustomers(searchKeyword) : customers;
    if (activeFilter !== 'all') {
      result = result.filter((c) => c.status === activeFilter);
    }
    return result;
  }, [customers, activeFilter, searchKeyword, searchCustomers]);

  const handleFilterClick = (key: FilterType) => {
    setActiveFilter(key);
  };

  return (
    <View className={styles.page}>
      <View className={styles.searchBar}>
        <View className={styles.searchInput} onClick={() => setShowSearchInput(true)}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Text className={styles.searchPlaceholder}>
            {searchKeyword || '搜索客户姓名、电话、项目'}
          </Text>
        </View>
      </View>

      <ScrollView scrollX className={styles.filterTabs} enableFlex>
        {filters.map((filter) => (
          <View
            key={filter.key}
            className={classnames(
              styles.filterTab,
              activeFilter === filter.key && styles[filter.colorKey]
            )}
            onClick={() => handleFilterClick(filter.key)}
          >
            <Text className={styles.tabText}>{filter.label}</Text>
            <Text className={styles.tabCount}>{filter.count}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView scrollY className={styles.customerList}>
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无客户数据</Text>
            <Text
              className={styles.emptyAction}
              onClick={() => Taro.switchTab({ url: '/pages/entry/index' })}
            >
              录入新客户
            </Text>
          </View>
        )}
      </ScrollView>

      {showSearchInput && (
        <View className={styles.inputOverlay} onClick={() => setShowSearchInput(false)}>
          <View className={styles.inputContainer} onClick={(e) => e.stopPropagation()}>
            <View className={styles.inputBox}>
              <Input
                className={styles.realInput}
                placeholder="搜索客户姓名、电话、项目"
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
    </View>
  );
};

export default QueuePage;
