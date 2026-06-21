import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, Toast } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useCustomerStore } from '@/store/customerStore';
import { PROJECT_OPTIONS } from '@/types';
import styles from './index.module.scss';

const ActivityLeadPage: React.FC = () => {
  const router = useRouter();
  const { activityId } = router.params;
  const { addCustomerFromActivity, getActivityById } = useCustomerStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activity, setActivity] = useState<{ name: string; description: string } | null>(null);

  useEffect(() => {
    if (activityId) {
      const act = getActivityById(activityId);
      if (act) {
        setActivity(act);
        Taro.setNavigationBarTitle({ title: act.name });
      }
    }
  }, [activityId, getActivityById]);

  const handleProjectToggle = (project: string) => {
    setSelectedProjects((prev) =>
      prev.includes(project) ? prev.filter((p) => p !== project) : [...prev, project]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Toast.show({ title: '请填写姓名', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Toast.show({ title: '请填写正确手机号', icon: 'none' });
      return;
    }
    if (selectedProjects.length === 0) {
      Toast.show({ title: '请至少选择一个关注项目', icon: 'none' });
      return;
    }
    if (!activityId) {
      Toast.show({ title: '活动信息异常', icon: 'none' });
      return;
    }

    const customerId = addCustomerFromActivity({
      name: name.trim(),
      phone: phone.trim(),
      projectPreference: selectedProjects,
      activityId
    });

    console.log('[ActivityLead] 提交成功，客户ID:', customerId);
    setShowSuccess(true);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setName('');
    setPhone('');
    setSelectedProjects([]);
  };

  if (!activity) {
    return (
      <View className={styles.page}>
        <View className={styles.activityHeader}>
          <Text className={styles.activityName}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.activityHeader}>
        <Text className={styles.activityName}>{activity.name}</Text>
        <Text className={styles.activityDesc}>{activity.description}</Text>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>填写预约信息</Text>

        <View className={styles.formGroup}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>姓名
          </Text>
          <Input
            className={styles.input}
            placeholder='请输入您的姓名'
            placeholderClass='input-placeholder'
            value={name}
            onInput={(e) => setName(e.detail.value)}
            maxlength={20}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>手机号
          </Text>
          <View className={styles.phonePrefix}>
            <Text className={styles.prefix}>+86</Text>
            <Input
              className={styles.input}
              type='number'
              placeholder='请输入手机号'
              placeholderClass='input-placeholder'
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
              maxlength={11}
            />
          </View>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>关注项目（可多选）
          </Text>
          <View className={styles.projectsGrid}>
            {PROJECT_OPTIONS.map((project) => (
              <View
                key={project}
                className={`${styles.projectTag} ${selectedProjects.includes(project) ? styles.active : ''}`}
                onClick={() => handleProjectToggle(project)}
              >
                {project}
              </View>
            ))}
          </View>
        </View>

        <Button className={styles.submitBtn} onClick={handleSubmit}>
          立即预约 · 尊享专属优惠
        </Button>
      </View>

      <View className={styles.tips}>
        <Text>提交后，<Text className={styles.highlight}>专属咨询顾问</Text>将在30分钟内与您联系</Text>
        <Text>{'\n'}我们承诺严格保护您的个人信息隐私</Text>
      </View>

      {showSuccess && (
        <View className={styles.successOverlay} onClick={handleCloseSuccess}>
          <View className={styles.successCard} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.successIcon}>🎉</Text>
            <Text className={styles.successTitle}>预约成功！</Text>
            <Text className={styles.successDesc}>
              感谢您对{activity.name}的关注{'\n'}
              我们的咨询顾问将尽快与您联系{'\n'}
              请保持手机畅通~
            </Text>
            <Button className={styles.doneBtn} onClick={handleCloseSuccess}>
              我知道了
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default ActivityLeadPage;
