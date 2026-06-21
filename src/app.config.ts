export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/queue/index',
    'pages/entry/index',
    'pages/appointment/index',
    'pages/report/index',
    'pages/customer-detail/index',
    'pages/activity-create/index',
    'pages/message-template/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '医美客资助手',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#E91E8C',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '工作台'
      },
      {
        pagePath: 'pages/queue/index',
        text: '客资队列'
      },
      {
        pagePath: 'pages/entry/index',
        text: '客资录入'
      },
      {
        pagePath: 'pages/appointment/index',
        text: '预约管理'
      },
      {
        pagePath: 'pages/report/index',
        text: '经营日报'
      }
    ]
  }
})
