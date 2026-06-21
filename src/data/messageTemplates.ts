import { MessageTemplate } from '@/types';

export const mockMessageTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: '首次问候',
    type: 'greeting',
    content: '亲爱的{name}您好！感谢您关注我们医美门诊，我是您的专属咨询顾问小美。看到您对{project}很感兴趣，我给您发一些我们医院做过的真实案例参考一下吧~'
  },
  {
    id: '2',
    name: '活动邀约',
    type: 'greeting',
    content: '亲爱的{name}，您好！我们本月正好有{activity}的专属优惠活动，体验价仅需XXX元，还赠送皮肤检测，您这周有空来院体验吗？'
  },
  {
    id: '3',
    name: '二次唤醒',
    type: 'reminder',
    content: '亲爱的{name}，之前和您聊到{project}的方案，不知道您考虑得怎么样了？有任何疑问都可以随时问我哦，我们这周末有专家坐诊，需要帮您预约面诊吗？'
  },
  {
    id: '4',
    name: '水光补水案例',
    type: 'case',
    content: '这是我们上周刚做的水光补水案例哦~小姐姐做完后皮肤明显水润透亮了很多，毛孔也细腻了。{name}您的肤质也很适合做这个项目，现在活动价很划算呢！'
  },
  {
    id: '5',
    name: '双眼皮案例',
    type: 'case',
    content: '{name}您好！这是我们院长做的双眼皮恢复过程分享，术后7天基本消肿，一个月就很自然了。我们会根据您的眼型和五官比例设计专属方案，有时间可以来院免费面诊哦~'
  },
  {
    id: '6',
    name: '新人专属优惠',
    type: 'discount',
    content: '亲爱的{name}，为您申请了新人专属优惠！{project}项目首次体验立减500元，还送价值299元的医用面膜一盒。优惠仅限三天，需要帮您预留名额吗？'
  },
  {
    id: '7',
    name: '生日祝福',
    type: 'birthday',
    content: '亲爱的{name}，生日快乐！！在这个特别的日子里，我们为您准备了一份生日专属礼包：项目7折券一张+精美礼品一份。祝您越来越美丽，天天开心！'
  },
  {
    id: '8',
    name: '预约确认',
    type: 'reminder',
    content: '亲爱的{name}，已为您预约{date} {time}的{project}项目，请您准时到院哦~来院前有任何问题可以随时联系我。地址：XX路XX号XX医美，期待您的光临！'
  }
];
