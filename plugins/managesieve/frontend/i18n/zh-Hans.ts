export default {
  "settings": {
    "categories": {
      "filters": "过滤器",
      "autoReply": "自动回复"
    }
  },
  "managesieve": {
    "title": "过滤器",
    "description": '添加自定义规则，以决定如何处理和筛选邮件。',
    "loadError": "无法加载过滤器。",
    "loadErrorRetry": "重试",
    "tabs": {
      "switchToRaw": "原始编辑器"
    },
    "warningRawSwitchTitle": "切换到原始模式",
    "warningRawSwitchConfirm": "切换",
    "warningRawSwitch": '切换到原始模式意味着脚本将不再能够可视化编辑，是否继续？',
    "toast": {
      "saved": '规则已保存并激活。',
      "deactivated": "规则已停用。",
      "valid": "脚本有效！",
      "networkError": "发生网络错误。",
      "autoReplyOn": '自动回复功能已开启。请在 “自动回复” 设置中将其关闭，再让过滤器自行发送 “休假回复”。'
    },
    "visual": {
      "newRule": "新建规则",
      "noRules": '未定义规则。',
      "saveFilters": "保存",
      "deleteRule": "删除规则",
      "remove": "移除",
      "add": "添加",
      "if": "如果",
      "all": '所有',
      "any": '任意',
      "ofTheFollowing": "条件符合",
      "then": '那么',
      "value": "值",
      "ruleNumber": "规则 {number}",
      "conditionNumber": "条件 {number}",
      "actionNumber": "操作 {number}",
      "matchMode": '匹配条件',
      "field": "字段",
      "operator": '比较',
      "action": "操作",
      "folder": "文件夹",
      "actions": {
        "fileinto": '转移到文件夹',
        "discard": '丢弃 (删除)',
        "redirect": '重定向到电子邮件',
        "stop": '停止评估规则'
      },
      "fields": {
        "subject": "主题",
        "from": "发件人",
        "to": "收件人",
        "body": "正文",
        "size": "大小",
        "emailAddress": "电子邮件地址"
      },
      "operators": {
        "contains": "包含",
        "not_contains": "不包含",
        "is": '完全匹配',
        "not_is": '不完全匹配',
        "over": '超过',
        "under": '低于'
      }
    },
    "raw": {
      "validate": "验证",
      "save": "保存",
      "script": '筛选脚本'
    },
    "autoReply": {
      "title": "自动回复",
      "description": '当您不在时，自动回复给您发送邮件的人。',
      "enable": "发送自动回复",
      "stateActive": '当前正在向发件人发送自动回复。',
      "stateActiveUntil": '将向发件人发送自动回复，直至 {date}。',
      "stateScheduled": "计划于 {date} 开始。",
      "stateFinished": '结束日期已过，目前不再发送自动回复。',
      "subject": "主题",
      "subjectDesc": '可选。若不填写，邮件服务器将自动生成一个主题。',
      "subjectPlaceholder": '不在办公室',
      "message": '正文',
      "messageDesc": '所有给您发邮件的人都会收到此内容。',
      "messagePlaceholder": '我外出至 15 日，回来后会回复您。',
      "dates": "日期",
      "datesDesc": '可选。若不填写日期，则表示该端点不设限。一天的时间范围为您所在时区的午夜至午夜。',
      "startDate": "开始日期",
      "endDate": "结束日期",
      "interval": '再次回复同一发件人的间隔时间',
      "intervalDesc": '在此期间多次来信的发件人只会收到一次回复。来自邮件列表或自动发送系统的邮件不会收到回复。',
      "days": {
        "other": "{count} 天"
      },
      "save": "保存",
      "saved": "自动回复已保存。",
      "turnedOff": "自动回复已关闭。",
      "unsupported": '此邮件服务器不支持自动回复功能。',
      "ownVacation": '您的过滤器中已设置了自动回复。若要在此处进行设置，请先在 “过滤器” 部分的原始编辑器中将其移除。',
      "errors": {
        "emptyMessage": '请填写发送者将收到的消息内容，或关闭自动回复功能。',
        "invalidWindow": "开始日期不能晚于结束日期。",
        "loadError": "无法加载自动回复。",
        "saveError": "无法保存自动回复。"
      }
    }
  }
};
