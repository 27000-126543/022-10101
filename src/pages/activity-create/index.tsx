import React, { useState } from 'react';
import { View, Text, Input, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useCustomerStore } from '@/store/customerStore';
import classnames from 'classnames';
import styles from './index.module.scss';

const presetTemplates = [
  {
    name: '水光补水体验',
    description: '新人专享体验价，首次到院赠送皮肤检测一次'
  },
  {
    name: '双眼皮面诊',
    description: '专家一对一免费面诊，定制个性化双眼皮方案'
  },
  {
    name: '祛斑专场',
    description: '皮秒祛斑7折优惠，疗程套餐更划算'
  },
  {
    name: '闺蜜同行',
    description: '两人同行一人免单，推荐好友各得500元代金券'
  }
];

const ActivityCreatePage: React.FC = () => {
  const { addActivity } = useCustomerStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(-1);

  const handleSelectTemplate = (index: number) => {
    setSelectedTemplate(index);
    setName(presetTemplates[index].name);
    setDescription(presetTemplates[index].description);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入活动名称', icon: 'none' });
      return;
    }
    if (!description.trim()) {
      Taro.showToast({ title: '请输入活动描述', icon: 'none' });
      return;
    }

    addActivity({
      name: name.trim(),
      description: description.trim(),
      status: 'active'
    });

    Taro.showToast({ title: '活动创建成功', icon: 'success' });
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/entry/index' });
    }, 1000);
  };

  return (
    <View className={styles.page}>
      <View className={styles.formCard}>
        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>
            <Text>✨</Text>快速模板
          </Text>
          <View className={styles.templates}>
            {presetTemplates.map((tpl, index) => (
              <View
                key={index}
                className={classnames(
                  styles.templateItem,
                  selectedTemplate === index && styles.templateSelected
                )}
                onClick={() => handleSelectTemplate(index)}
              >
                <Text className={styles.templateName}>{tpl.name}</Text>
                <Text className={styles.templateDesc}>{tpl.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.formCard}>
        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.required}>*</Text>活动信息
          </Text>

          <View className={styles.formItem}>
            <Text className={styles.label}>
              活动名称 <Text className={styles.required}>*</Text>
            </Text>
            <Input
              className={styles.input}
              placeholder="例：水光补水体验"
              placeholderClass={styles.placeholder}
              value={name}
              onInput={(e) => setName(e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>
              活动描述 <Text className={styles.required}>*</Text>
            </Text>
            <Textarea
              className={classnames(styles.input, styles.textarea)}
              placeholder="请输入活动的详细描述、优惠信息等"
              placeholderClass={styles.placeholder}
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
            />
          </View>
        </View>
      </View>

      {name && (
        <View className={styles.previewSection}>
          <Text className={styles.previewTitle}>{name}</Text>
          <Text className={styles.previewDesc}>{description}</Text>
          <View className={styles.qrPreview}>
            <Text className={styles.qrIcon}>📱</Text>
          </View>
          <Text className={styles.qrHint}>活动创建后可查看并下载活动二维码</Text>
        </View>
      )}

      <View className={styles.submitBtn} onClick={handleSubmit}>
        <Text>创建活动并生成二维码</Text>
      </View>
    </View>
  );
};

export default ActivityCreatePage;
