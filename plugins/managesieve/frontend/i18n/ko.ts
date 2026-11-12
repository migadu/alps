export default {
  settings: {
    categories: {
      filters: '필터',
      autoReply: '자동 응답'
    }
  },
  managesieve: {
    title: '필터',
    description: '메일을 처리하고 분류하는 방식에 대한 사용자 지정 규칙을 추가합니다.',
    loadError: '필터를 불러오지 못했습니다.',
    loadErrorRetry: '다시 시도',
    tabs: {
      switchToRaw: '스크립트 편집기'
    },
    warningRawSwitchTitle: '스크립트 모드로 전환',
    warningRawSwitchConfirm: '전환',
    warningRawSwitch: '스크립트 모드로 전환하면 더 이상 시각적 편집기로 스크립트를 편집할 수 없습니다. 계속할까요?',
    toast: {
      "saveError": "필터를 저장하지 못했습니다. 다시 시도하세요.",
      "validateError": "스크립트를 검증하지 못했습니다. 다시 시도하세요.",

      saved: '규칙을 저장하고 활성화했습니다.',
      deactivated: '규칙을 비활성화했습니다.',
      valid: '올바른 스크립트입니다.',
      networkError: '네트워크 오류가 발생했습니다.',
      autoReplyOn: '자동 응답이 켜져 있습니다. 필터에서 자체 부재중 응답을 보내게 하려면 먼저 자동 응답에서 끄세요.'
    },
    visual: {
      newRule: '새 규칙',
      noRules: '정의된 규칙이 없습니다.',
      saveFilters: '저장',
      deleteRule: '규칙 삭제',
      remove: '삭제',
      add: '추가',
      if: '조건',
      all: '모든 조건',
      any: '하나 이상의 조건',
      ofTheFollowing: '일치 시',
      then: '실행',
      value: '값',
      ruleNumber: '규칙 {number}',
      conditionNumber: '조건 {number}',
      actionNumber: '동작 {number}',
      matchMode: '일치 방식',
      field: '항목',
      operator: '비교',
      action: '동작',
      folder: '폴더',
      actions: {
        fileinto: '폴더로 이동',
        discard: '버리기(삭제)',
        redirect: '다른 주소로 리디렉션',
        stop: '이후 규칙 처리 중지'
      },
      fields: {
        subject: '제목',
        from: '보낸사람',
        to: '받는사람',
        body: '본문',
        size: '크기',
        emailAddress: '이메일 주소'
      },
      operators: {
        contains: '포함',
        not_contains: '포함하지 않음',
        is: '정확히 일치',
        not_is: '정확히 일치하지 않음',
        over: '초과',
        under: '미만'
      }
    },
    raw: {
      validate: '유효성 검사',
      save: '저장',
      script: '필터 스크립트'
    },
    autoReply: {
      title: '자동 응답',
      description: '자리를 비운 동안 메일을 보낸 사람에게 자동으로 답장합니다.',
      enable: '자동 응답 보내기',
      stateActive: '지금 발신자에게 자동 응답을 보내고 있습니다.',
      stateActiveUntil: '{date}까지 발신자에게 자동 응답을 보냅니다.',
      stateScheduled: '{date}에 시작하도록 예약되었습니다.',
      stateFinished: '종료 날짜가 지나 자동 응답을 보내지 않습니다.',
      subject: '제목',
      subjectDesc: '선택 사항입니다. 비워 두면 메일 서버가 제목을 정합니다.',
      subjectPlaceholder: '부재중',
      message: '메시지',
      messageDesc: '메일을 보낸 모든 사람이 받는 내용입니다.',
      messagePlaceholder: '15일까지 자리를 비웁니다. 돌아오는 대로 답장하겠습니다.',
      dates: '날짜',
      datesDesc: '선택 사항입니다. 날짜를 비워 두면 그쪽 기간은 제한이 없습니다. 하루는 내 시간대 기준 자정부터 다음 날 자정까지입니다.',
      startDate: '시작 날짜',
      endDate: '종료 날짜',
      interval: '같은 발신자에게 다시 응답하는 간격',
      intervalDesc: '이 기간 안에 여러 번 메일을 보낸 사람은 응답을 한 번만 받습니다. 메일링 리스트와 자동 발송 메일에는 응답하지 않습니다.',
      days: {
        other: '{count}일'
      },
      save: '저장',
      saved: '자동 응답을 저장했습니다.',
      turnedOff: '자동 응답을 껐습니다.',
      unsupported: '이 메일 서버는 자동 응답을 지원하지 않습니다.',
      ownVacation: '필터에서 이미 자체 자동 응답을 보내고 있습니다. 여기에서 설정하려면 필터의 스크립트 편집기에서 해당 응답을 삭제하세요.',
      errors: {
        emptyMessage: '발신자가 받을 내용을 입력하거나 자동 응답을 끄세요.',
        invalidWindow: '시작 날짜는 종료 날짜보다 늦을 수 없습니다.',
        loadError: '자동 응답을 불러오지 못했습니다.',
        saveError: '자동 응답을 저장하지 못했습니다.'
      }
    }
  }
};
