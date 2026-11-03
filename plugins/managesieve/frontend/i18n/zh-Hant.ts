export default {
  settings: {
    categories: {
      filters: '過濾器',
      autoReply: '自動回覆'
    }
  },
  managesieve: {
    title: '過濾器',
    description: '新增自訂規則，決定郵件的處理與歸檔方式。',
    loadError: '無法載入過濾器。',
    loadErrorRetry: '重試',
    tabs: {
      switchToRaw: '指令碼編輯器'
    },
    warningRawSwitchTitle: '切換至指令碼模式',
    warningRawSwitchConfirm: '切換',
    warningRawSwitch: '切換至指令碼模式後，將無法再以視覺化方式編輯此指令碼。要繼續嗎？',
    toast: {
      saved: '規則已儲存並啟用。',
      deactivated: '規則已停用。',
      valid: '指令碼有效。',
      networkError: '發生網路錯誤。',
      autoReplyOn: '自動回覆已開啟。請先在「自動回覆」中將其關閉，再讓過濾器傳送自己的休假回覆。'
    },
    visual: {
      newRule: '新規則',
      noRules: '尚未定義規則。',
      saveFilters: '儲存',
      deleteRule: '刪除規則',
      remove: '移除',
      add: '新增',
      if: '如果',
      all: '符合全部',
      any: '符合任一',
      ofTheFollowing: '下列條件',
      then: '則',
      value: '值',
      ruleNumber: '規則 {number}',
      conditionNumber: '條件 {number}',
      actionNumber: '操作 {number}',
      matchMode: '比對方式',
      field: '欄位',
      operator: '比較方式',
      action: '操作',
      folder: '資料夾',
      actions: {
        fileinto: '移至資料夾',
        discard: '丟棄（刪除）',
        redirect: '重新導向至其他位址',
        stop: '停止處理後續規則'
      },
      fields: {
        subject: '主旨',
        from: '寄件者',
        to: '收件者',
        body: '正文',
        size: '大小',
        emailAddress: '信箱位址'
      },
      operators: {
        contains: '包含',
        not_contains: '不包含',
        is: '完全符合',
        not_is: '不完全符合',
        over: '大於',
        under: '小於'
      }
    },
    raw: {
      validate: '驗證',
      save: '儲存',
      script: '過濾指令碼'
    },
    autoReply: {
      title: '自動回覆',
      description: '您不在時，自動回覆給您寫郵件的人。',
      enable: '傳送自動回覆',
      stateActive: '目前正在自動回覆寄件者。',
      stateActiveUntil: '將自動回覆寄件者至 {date}。',
      stateScheduled: '定於 {date} 開始。',
      stateFinished: '結束日期已過，目前不會自動回覆。',
      subject: '主旨',
      subjectDesc: '選填。若留空，將由郵件伺服器決定主旨。',
      subjectPlaceholder: '外出中',
      message: '郵件內容',
      messageDesc: '所有給您寫郵件的人將收到的內容。',
      messagePlaceholder: '我將於15日返回，回來後會回覆您的郵件。',
      dates: '日期',
      datesDesc: '選填。日期留空表示該端不設限。一天是指您所在時區的午夜到下一個午夜。',
      startDate: '開始日期',
      endDate: '結束日期',
      interval: '再次回覆同一寄件者的間隔',
      intervalDesc: '在此期間內多次來信的人只會收到一封回覆。郵寄清單和自動傳送的郵件一律不會收到回覆。',
      days: {
        other: '{count} 天'
      },
      save: '儲存',
      saved: '自動回覆已儲存。',
      turnedOff: '自動回覆已關閉。',
      unsupported: '此郵件伺服器不提供自動回覆。',
      ownVacation: '您的過濾器已會自行傳送自動回覆。若要在這裡設定，請先在「過濾器」的指令碼編輯器中將其移除。',
      errors: {
        emptyMessage: '請填寫要發給寄件者的回覆內容，或關閉自動回覆。',
        invalidWindow: '開始日期不能晚於結束日期。',
        loadError: '無法載入自動回覆。',
        saveError: '無法儲存自動回覆。'
      }
    }
  }
};
