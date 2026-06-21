import React, { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useCustomerStore } from '@/store/customerStore';
import { MessageTemplate } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

type TemplateType = 'all' | MessageTemplate['type'];

const typeOptions: { key: TemplateType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'greeting', label: '问候' },
  { key: 'case', label: '案例' },
  { key: 'discount', label: '优惠' },
  { key: 'reminder', label: '提醒' },
  { key: 'birthday', label: '生日' }
];

const MessageTemplatePage: React.FC = () => {
  const router = useRouter();
  const { customers, messageTemplates, updateCustomerStatus } = useCustomerStore();
  const customerId = router.params.id;
  const customer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  );

  const [selectedType, setSelectedType] = useState<TemplateType>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const filteredTemplates = useMemo(() => {
    if (selectedType === 'all') return messageTemplates;
    return messageTemplates.filter((t) => t.type === selectedType);
  }, [messageTemplates, selectedType]);

  const selectedTemplate = messageTemplates.find((t) => t.id === selectedTemplateId);

  const renderPreview = (template: MessageTemplate) => {
    if (!customer) return template.content;
    return template.content
      .replace('{name}', customer.name)
      .replace('{project}', customer.projectPreference[0] || '项目')
      .replace('{activity}', customer.activityName || '专属活动')
      .replace('{date}', '明天')
      .replace('{time}', '14:00');
  };

  const handleSend = () => {
    if (!selectedTemplateId) {
      Taro.showToast({ title: '请选择消息模板', icon: 'none' });
      return;
    }
    if (customer) {
      updateCustomerStatus(customer.id, 'contacted');
    }
    Taro.showToast({ title: '消息发送成功', icon: 'success' });
    setTimeout(() => {
      Taro.navigateBack();
    }, 1000);
  };

  return (
    <View className={styles.page}>
      {customer && (
        <View className={styles.customerBar}>
          <View className={styles.customerAvatar}>
            <Text className={styles.avatarText}>{customer.name.charAt(0)}</Text>
          </View>
          <View className={styles.customerInfo}>
            <Text className={styles.customerName}>{customer.name}</Text>
            <Text className={styles.customerProject}>
              关注：{customer.projectPreference.join('、')}
            </Text>
          </View>
        </View>
      )}

      <View className={styles.typeTabs}>
        {typeOptions.map((opt) => (
          <View
            key={opt.key}
            className={classnames(styles.typeTab, selectedType === opt.key && styles.activeType)}
            onClick={() => setSelectedType(opt.key)}
          >
            <Text className={styles.typeText}>{opt.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.templateList}>
        {filteredTemplates.map((template) => (
          <View
            key={template.id}
            className={classnames(
              styles.templateCard,
              selectedTemplateId === template.id && styles.templateSelected
            )}
            onClick={() => setSelectedTemplateId(template.id)}
          >
            <View className={styles.templateHeader}>
              <Text className={styles.templateName}>{template.name}</Text>
              <Text className={styles.templateType}>
                {typeOptions.find((t) => t.key === template.type)?.label}
              </Text>
            </View>
            <Text className={styles.templateContent}>{renderPreview(template)}</Text>
          </View>
        ))}
      </View>

      <View className={styles.previewSection}>
        <Text className={styles.previewLabel}>消息预览</Text>
        <Text className={styles.previewContent}>
          {selectedTemplate ? renderPreview(selectedTemplate) : '请选择消息模板'}
        </Text>
        <View
          className={classnames(
            styles.sendBtn,
            !selectedTemplateId && styles.sendBtnDisabled
          )}
          onClick={handleSend}
        >
          <Text>发送给 {customer?.name || '客户'}</Text>
        </View>
      </View>
    </View>
  );
};

export default MessageTemplatePage;
