export default {
  settings: {
    categories: {
      filters: 'المرشحات',
      autoReply: 'الرد التلقائي'
    }
  },
  managesieve: {
    title: 'المرشحات',
    description: 'أضف قواعد مخصصة لكيفية معالجة الرسائل وحفظها في المجلدات.',
    loadError: 'تعذر تحميل المرشحات.',
    loadErrorRetry: 'إعادة المحاولة',
    tabs: {
      switchToRaw: 'المحرر النصي'
    },
    warningRawSwitchTitle: 'التبديل إلى الوضع النصي',
    warningRawSwitchConfirm: 'تبديل',
    warningRawSwitch: 'عند التبديل إلى الوضع النصي، لن يعود بالإمكان تعديل البرنامج النصي مرئيًا. هل تريد المتابعة؟',
    toast: {
      saved: 'حُفظت القواعد وفُعِّلت.',
      deactivated: 'أُلغي تفعيل القواعد.',
      valid: 'البرنامج النصي صالح!',
      networkError: 'حدث خطأ في الشبكة.',
      autoReplyOn: 'الرد التلقائي مفعّل. أوقفه من «الرد التلقائي» قبل أن ترسل المرشحات رد غياب خاصًا بها.'
    },
    visual: {
      newRule: 'قاعدة جديدة',
      noRules: 'لم تُحدَّد أي قواعد.',
      saveFilters: 'حفظ',
      deleteRule: 'حذف القاعدة',
      remove: 'إزالة',
      add: 'إضافة',
      if: 'إذا',
      all: 'تحققت كل',
      any: 'تحقق أيٌّ من',
      ofTheFollowing: 'الشروط التالية',
      then: 'عندئذٍ',
      value: 'القيمة',
      ruleNumber: 'القاعدة {number}',
      conditionNumber: 'الشرط {number}',
      actionNumber: 'الإجراء {number}',
      matchMode: 'الشروط الواجب تحققها',
      field: 'الحقل',
      operator: 'المقارنة',
      action: 'الإجراء',
      folder: 'المجلد',
      actions: {
        fileinto: 'نقل إلى مجلد',
        discard: 'تجاهل (حذف)',
        redirect: 'إعادة التوجيه إلى عنوان بريد',
        stop: 'إيقاف تقييم القواعد'
      },
      fields: {
        subject: 'الموضوع',
        from: 'من',
        to: 'إلى',
        body: 'المحتوى',
        size: 'الحجم',
        emailAddress: 'عنوان البريد الإلكتروني'
      },
      operators: {
        contains: 'يحتوي على',
        not_contains: 'لا يحتوي على',
        is: 'يساوي تمامًا',
        not_is: 'لا يساوي تمامًا',
        over: 'أكبر من',
        under: 'أصغر من'
      }
    },
    raw: {
      validate: 'التحقق من الصحة',
      save: 'حفظ',
      script: 'برنامج التصفية النصي'
    },
    autoReply: {
      title: 'الرد التلقائي',
      description: 'أرسل ردًا تلقائيًا إلى من يراسلك أثناء غيابك.',
      enable: 'إرسال رد تلقائي',
      stateActive: 'يجري الرد على المرسلين الآن.',
      stateActiveUntil: 'يجري الرد على المرسلين حتى {date}.',
      stateScheduled: 'من المقرر أن يبدأ في {date}.',
      stateFinished: 'انقضى تاريخ الانتهاء، لذا لا تُرسَل ردود.',
      subject: 'الموضوع',
      subjectDesc: 'اختياري. إذا تُرك فارغًا، يختار خادم البريد موضوعًا.',
      subjectPlaceholder: 'خارج المكتب',
      message: 'الرسالة',
      messageDesc: 'ما يتلقاه كل من يراسلك.',
      messagePlaceholder: 'أنا غائب حتى يوم 15، وسأرد عند عودتي.',
      dates: 'التواريخ',
      datesDesc: 'اختياري. اترك تاريخًا فارغًا لإبقاء ذلك الطرف مفتوحًا. يمتد اليوم من منتصف الليل إلى منتصف الليل حسب منطقتك الزمنية.',
      startDate: 'تاريخ البدء',
      endDate: 'تاريخ الانتهاء',
      interval: 'الرد على المرسل نفسه مجددًا بعد',
      intervalDesc: 'من يراسلك عدة مرات خلال تلك المدة يتلقى ردًا واحدًا. لا تتلقى القوائم البريدية والرسائل الآلية أي رد.',
      days: {
        zero: '{count} يوم',
        one: 'يوم واحد',
        two: 'يومان',
        few: '{count} أيام',
        many: '{count} يومًا',
        other: '{count} يوم'
      },
      save: 'حفظ',
      saved: 'حُفظ الرد التلقائي.',
      turnedOff: 'أُوقف الرد التلقائي.',
      unsupported: 'خادم البريد هذا لا يوفر الردود التلقائية.',
      ownVacation: 'ترسل مرشحاتك ردًا تلقائيًا خاصًا بها بالفعل. أزله في المحرر النصي ضمن «المرشحات» لإعداد رد هنا.',
      errors: {
        emptyMessage: 'اكتب الرسالة التي سيتلقاها المرسلون، أو أوقف الرد التلقائي.',
        invalidWindow: 'لا يمكن أن يكون تاريخ البدء بعد تاريخ الانتهاء.',
        loadError: 'تعذر تحميل الرد التلقائي.',
        saveError: 'تعذر حفظ الرد التلقائي.'
      }
    }
  }
};
