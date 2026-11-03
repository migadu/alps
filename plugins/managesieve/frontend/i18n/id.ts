export default {
  settings: {
    categories: {
      filters: 'Filter',
      autoReply: 'Balasan otomatis'
    }
  },
  managesieve: {
    title: 'Filter',
    description: 'Tambahkan aturan khusus tentang cara pesan diproses dan disimpan ke folder.',
    loadError: 'Filter tidak dapat dimuat.',
    loadErrorRetry: 'Coba lagi',
    tabs: {
      switchToRaw: 'Editor Skrip'
    },
    warningRawSwitchTitle: 'Beralih ke Mode Skrip',
    warningRawSwitchConfirm: 'Beralih',
    warningRawSwitch: 'Setelah beralih ke mode skrip, skrip tidak dapat lagi diedit secara visual. Lanjutkan?',
    toast: {
      saved: 'Aturan disimpan dan diaktifkan.',
      deactivated: 'Aturan dinonaktifkan.',
      valid: 'Skrip valid!',
      networkError: 'Terjadi kesalahan jaringan.',
      autoReplyOn: 'Balasan otomatis sedang aktif. Nonaktifkan di bagian Balasan otomatis sebelum filter mengirim balasan otomatisnya sendiri.'
    },
    visual: {
      newRule: 'Aturan baru',
      noRules: 'Belum ada aturan.',
      saveFilters: 'Simpan',
      deleteRule: 'Hapus aturan',
      remove: 'Hapus',
      add: 'Tambah',
      if: 'Jika',
      all: 'SEMUA',
      any: 'SALAH SATU',
      ofTheFollowing: 'kondisi berikut terpenuhi',
      then: 'Maka',
      value: 'Nilai',
      ruleNumber: 'Aturan {number}',
      conditionNumber: 'Kondisi {number}',
      actionNumber: 'Tindakan {number}',
      matchMode: 'Kondisi yang harus terpenuhi',
      field: 'Bidang',
      operator: 'Perbandingan',
      action: 'Tindakan',
      folder: 'Folder',
      actions: {
        fileinto: 'Pindahkan ke folder',
        discard: 'Buang (Hapus)',
        redirect: 'Alihkan ke email',
        stop: 'Hentikan evaluasi aturan'
      },
      fields: {
        subject: 'Subjek',
        from: 'Dari',
        to: 'Kepada',
        body: 'Isi',
        size: 'Ukuran',
        emailAddress: 'Alamat Email'
      },
      operators: {
        contains: 'mengandung',
        not_contains: 'tidak mengandung',
        is: 'sama persis dengan',
        not_is: 'tidak sama persis dengan',
        over: 'lebih dari',
        under: 'kurang dari'
      }
    },
    raw: {
      validate: 'Validasi',
      save: 'Simpan',
      script: 'Skrip filter'
    },
    autoReply: {
      title: 'Balasan otomatis',
      description: 'Balas secara otomatis orang yang menghubungi Anda saat Anda tidak tersedia.',
      enable: 'Kirim balasan otomatis',
      stateActive: 'Sedang membalas pengirim.',
      stateActiveUntil: 'Membalas pengirim hingga {date}.',
      stateScheduled: 'Dijadwalkan mulai pada {date}.',
      stateFinished: 'Tanggal akhir telah berlalu, sehingga tidak ada yang menerima balasan.',
      subject: 'Subjek',
      subjectDesc: 'Opsional. Jika dikosongkan, server email akan memilih subjeknya.',
      subjectPlaceholder: 'Di luar kantor',
      message: 'Pesan',
      messageDesc: 'Pesan yang diterima setiap orang yang menghubungi Anda.',
      messagePlaceholder: 'Saya tidak tersedia hingga tanggal 15 dan akan membalas setelah kembali.',
      dates: 'Tanggal',
      datesDesc: 'Opsional. Kosongkan tanggal agar batas tersebut tetap terbuka. Satu hari berlangsung dari tengah malam hingga tengah malam di zona waktu Anda.',
      startDate: 'Tanggal mulai',
      endDate: 'Tanggal akhir',
      interval: 'Balas pengirim yang sama lagi setelah',
      intervalDesc: 'Orang yang menulis beberapa kali dalam rentang waktu tersebut hanya mendapat satu balasan. Milis dan email otomatis tidak pernah mendapat balasan.',
      days: {
        other: '{count} hari'
      },
      save: 'Simpan',
      saved: 'Balasan otomatis disimpan.',
      turnedOff: 'Balasan otomatis dinonaktifkan.',
      unsupported: 'Server email ini tidak menyediakan balasan otomatis.',
      ownVacation: 'Filter Anda sudah mengirim balasan otomatisnya sendiri. Hapus balasan itu di editor skrip pada Filter untuk mengaturnya di sini.',
      errors: {
        emptyMessage: 'Tulis pesan yang akan diterima pengirim, atau nonaktifkan balasan otomatis.',
        invalidWindow: 'Tanggal mulai tidak boleh setelah tanggal akhir.',
        loadError: 'Balasan otomatis tidak dapat dimuat.',
        saveError: 'Balasan otomatis tidak dapat disimpan.'
      }
    }
  }
};
