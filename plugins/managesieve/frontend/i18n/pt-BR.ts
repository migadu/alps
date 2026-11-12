export default {
  settings: {
    categories: {
      filters: 'Filtros',
      autoReply: 'Resposta automática'
    }
  },
  managesieve: {
    title: 'Filtros',
    description: 'Adicione regras personalizadas sobre como as mensagens são processadas e organizadas em pastas.',
    loadError: 'Não foi possível carregar os filtros.',
    loadErrorRetry: 'Tentar novamente',
    tabs: {
      switchToRaw: 'Editor de script'
    },
    warningRawSwitchTitle: 'Mudar para o modo de script',
    warningRawSwitchConfirm: 'Mudar',
    warningRawSwitch: 'Ao mudar para o modo de script, não será mais possível editar o script visualmente. Continuar?',
    toast: {
      "saveError": "Não foi possível salvar os filtros. Tente novamente.",
      "validateError": "Não foi possível validar o script. Tente novamente.",

      saved: 'Regras salvas e ativadas.',
      deactivated: 'Regras desativadas.',
      valid: 'O script é válido!',
      networkError: 'Ocorreu um erro de rede.',
      autoReplyOn: 'A resposta automática está ativada. Desative-a em Resposta automática antes que os filtros enviem uma resposta de ausência própria.'
    },
    visual: {
      newRule: 'Nova regra',
      noRules: 'Nenhuma regra definida.',
      saveFilters: 'Salvar',
      deleteRule: 'Excluir regra',
      remove: 'Remover',
      add: 'Adicionar',
      if: 'Se',
      all: 'TODAS AS',
      any: 'UMA OU MAIS DAS',
      ofTheFollowing: 'condições a seguir forem atendidas',
      then: 'Então',
      value: 'Valor',
      ruleNumber: 'Regra {number}',
      conditionNumber: 'Condição {number}',
      actionNumber: 'Ação {number}',
      matchMode: 'Condições a atender',
      field: 'Campo',
      operator: 'Comparação',
      action: 'Ação',
      folder: 'Pasta',
      actions: {
        fileinto: 'Mover para a pasta',
        discard: 'Descartar (excluir)',
        redirect: 'Redirecionar para e-mail',
        stop: 'Parar de avaliar as regras'
      },
      fields: {
        subject: 'Assunto',
        from: 'De',
        to: 'Para',
        body: 'Corpo',
        size: 'Tamanho',
        emailAddress: 'Endereço de E-mail'
      },
      operators: {
        contains: 'contém',
        not_contains: 'não contém',
        is: 'é exatamente',
        not_is: 'não é exatamente',
        over: 'maior que',
        under: 'menor que'
      }
    },
    raw: {
      validate: 'Validar',
      save: 'Salvar',
      script: 'Script do filtro'
    },
    autoReply: {
      title: 'Resposta automática',
      description: 'Responda automaticamente às pessoas que enviarem mensagens durante sua ausência.',
      enable: 'Enviar uma resposta automática',
      stateActive: 'Respondendo aos remetentes agora.',
      stateActiveUntil: 'Respondendo aos remetentes até {date}.',
      stateScheduled: 'Agendada para começar em {date}.',
      stateFinished: 'A data de fim já passou, por isso ninguém recebe resposta.',
      subject: 'Assunto',
      subjectDesc: 'Opcional. Se ficar vazio, o servidor de e-mail escolhe um.',
      subjectPlaceholder: 'Ausente',
      message: 'Mensagem',
      messageDesc: 'O que todas as pessoas que enviarem mensagens receberão.',
      messagePlaceholder: 'Estou ausente até o dia 15 e responderei quando voltar.',
      dates: 'Datas',
      datesDesc: 'Opcional. Deixe uma data vazia para deixar esse limite em aberto. Um dia vai da meia-noite à meia-noite no seu fuso horário.',
      startDate: 'Data de início',
      endDate: 'Data de fim',
      interval: 'Responder ao mesmo remetente novamente após',
      intervalDesc: 'Quem escrever várias vezes nesse período recebe uma única resposta. Listas de e-mail e mensagens automáticas nunca recebem resposta.',
      days: {
        one: '{count} dia',
        many: '{count} dias',
        other: '{count} dias'
      },
      save: 'Salvar',
      saved: 'Resposta automática salva.',
      turnedOff: 'Resposta automática desativada.',
      unsupported: 'Este servidor de e-mail não oferece respostas automáticas.',
      ownVacation: 'Seus filtros já enviam uma resposta automática própria. Remova-a no editor de script em Filtros para configurar uma aqui.',
      errors: {
        emptyMessage: 'Escreva a mensagem que os remetentes vão receber, ou desative a resposta automática.',
        invalidWindow: 'A data de início não pode ser posterior à data de fim.',
        loadError: 'Não foi possível carregar a resposta automática.',
        saveError: 'Não foi possível salvar a resposta automática.'
      }
    }
  }
};
