import React, { useState } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useCustomerStore } from '@/store/customerStore';
import { PROJECT_OPTIONS, CHANNEL_OPTIONS, Customer } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

type TabType = 'manual' | 'activity';

const EntryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const { addCustomer, activities, addActivity } = useCustomerStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [sourceRemark, setSourceRemark] = useState('');
  const [birthday, setBirthday] = useState('');
  const [showQr, setShowQr] = useState<string | null>(null);

  const toggleProject = (project: string) => {
    setSelectedProjects((prev) =>
      prev.includes(project) ? prev.filter((p) => p !== project) : [...prev, project]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入客户姓名', icon: 'none' });
      return;
    }
    if (!phone.trim()) {
      Taro.showToast({ title: '请输入手机号码', icon: 'none' });
      return;
    }
    if (selectedProjects.length === 0) {
      Taro.showToast({ title: '请选择关注项目', icon: 'none' });
      return;
    }

    const activity = activities.find((a) => a.id === selectedActivity);

    addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      status: 'new',
      channel: selectedChannel || '手动录入',
      projectPreference: selectedProjects,
      activityId: selectedActivity || undefined,
      activityName: activity?.name,
      sourceRemark: sourceRemark || undefined,
      birthday: birthday || undefined,
      tags: []
    });

    Taro.showToast({ title: '录入成功', icon: 'success' });

    setName('');
    setPhone('');
    setSelectedProjects([]);
    setSelectedChannel('');
    setSelectedActivity('');
    setSourceRemark('');
    setBirthday('');

    setTimeout(() => {
      Taro.switchTab({ url: '/pages/queue/index' });
    }, 1000);
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, activeTab === 'manual' && styles.activeTab)}
          onClick={() => setActiveTab('manual')}
        >
          <Text className={styles.tabText}>手动录入</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'activity' && styles.activeTab)}
          onClick={() => setActiveTab('activity')}
        >
          <Text className={styles.tabText}>活动二维码</Text>
        </View>
      </View>

      {activeTab === 'manual' && (
        <View className={styles.formCard}>
          <View className={styles.formSection}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.required}>*</Text>基本信息
            </Text>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                客户姓名 <Text className={styles.required}>*</Text>
              </Text>
              <View className={styles.input}>
                <Input
                  className={styles.inputText}
                  placeholder="请输入客户姓名"
                  placeholderClass={styles.placeholder}
                  value={name}
                  onInput={(e) => setName(e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                手机号码 <Text className={styles.required}>*</Text>
              </Text>
              <View className={styles.input}>
                <Input
                  className={styles.inputText}
                  type="number"
                  maxlength={11}
                  placeholder="请输入手机号码"
                  placeholderClass={styles.placeholder}
                  value={phone}
                  onInput={(e) => setPhone(e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>生日（选填）</Text>
              <View className={styles.input}>
                <Input
                  className={styles.inputText}
                  placeholder="例：1995-08-15"
                  placeholderClass={styles.placeholder}
                  value={birthday}
                  onInput={(e) => setBirthday(e.detail.value)}
                />
              </View>
            </View>
          </View>

          <View className={styles.formSection}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.required}>*</Text>关注项目
            </Text>
            <View className={styles.projectGrid}>
              {PROJECT_OPTIONS.map((project) => (
                <View
                  key={project}
                  className={classnames(
                    styles.projectItem,
                    selectedProjects.includes(project) && styles.projectSelected
                  )}
                  onClick={() => toggleProject(project)}
                >
                  <Text className={styles.projectText}>{project}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formSection}>
            <Text className={styles.sectionTitle}>来源渠道</Text>
            <View className={styles.channelList}>
              {CHANNEL_OPTIONS.map((channel) => (
                <View
                  key={channel}
                  className={classnames(
                    styles.channelItem,
                    selectedChannel === channel && styles.channelSelected
                  )}
                  onClick={() => setSelectedChannel(channel)}
                >
                  <Text className={styles.channelText}>{channel}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formSection}>
            <Text className={styles.sectionTitle}>关联活动</Text>
            <View className={styles.activityList}>
              {activities.map((activity) => (
                <View
                  key={activity.id}
                  className={classnames(
                    styles.activityItem,
                    selectedActivity === activity.id && styles.activitySelected
                  )}
                  onClick={() =>
                    setSelectedActivity(selectedActivity === activity.id ? '' : activity.id)
                  }
                >
                  <Text className={styles.activityName}>{activity.name}</Text>
                  <Text
                    className={styles.activityDesc}
                    style={{ color: selectedActivity === activity.id ? '#E91E8C' : undefined }}
                  >
                    {activity.description}
                  </Text>
                  <Text className={styles.activityCount}>
                    已有 {activity.customerCount} 位客户参与
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formSection}>
            <Text className={styles.sectionTitle}>渠道备注</Text>
            <View className={styles.input}>
              <Input
                className={styles.inputText}
                placeholder="例：抖音XX视频评论区咨询"
                placeholderClass={styles.placeholder}
                value={sourceRemark}
                onInput={(e) => setSourceRemark(e.detail.value)}
              />
            </View>
          </View>

          <View className={styles.submitBtn} onClick={handleSubmit}>
            <Text>确认录入</Text>
          </View>
        </View>
      )}

      {activeTab === 'activity' && (
        <View>
          {activities.map((activity) => (
            <View key={activity.id} className={styles.activityCard}>
              <View className={styles.activityHeader}>
                <Text className={styles.activityTitle}>{activity.name}</Text>
                <Text
                  className={classnames(
                    styles.activityStatus,
                    activity.status === 'active' ? styles.statusActive : styles.statusInactive
                  )}
                >
                  {activity.status === 'active' ? '进行中' : '已结束'}
                </Text>
              </View>
              <Text className={styles.activityDescription}>{activity.description}</Text>
              <View className={styles.activityMeta}>
                <Text className={styles.activityDate}>创建于 {activity.createdAt}</Text>
                <View className={styles.qrBtn} onClick={() => setShowQr(activity.id)}>
                  <Text>查看二维码</Text>
                </View>
              </View>
            </View>
          ))}

          <View
            className={styles.createActivityBtn}
            onClick={() => Taro.navigateTo({ url: '/pages/activity-create/index' })}
          >
            <Text>+ 创建新活动</Text>
          </View>
        </View>
      )}

      {showQr && (
        <View className={styles.qrModal} onClick={() => setShowQr(null)}>
          <View className={styles.qrContainer} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.qrTitle}>
              {activities.find((a) => a.id === showQr)?.name}
            </Text>
            <Text className={styles.qrSubtitle}>客户扫码后自动进入客资队列</Text>
            <View className={styles.qrCodeBox}>
              <Text className={styles.qrCodeText}>📱</Text>
            </View>
            <Text className={styles.qrTips}>
              请保存此二维码并打印或分享到朋友圈、微信群{'\n'}
              客户扫码填写姓名、电话和关注项目即可自动录入
            </Text>
            <View className={styles.closeQrBtn} onClick={() => setShowQr(null)}>
              <Text>关闭</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default EntryPage;
