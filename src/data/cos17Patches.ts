export interface KernelCommitItem {
  id: string;
  sha: string;
  releaseTag: string;
  subsystem: 'sched_oplus' | 'display_dp' | 'touch_input' | 'root_sukisu' | 'network_wifi' | 'thermal_power' | 'core_bpf';
  subsystemLabelFa: string;
  titleEn: string;
  titleFa: string;
  summaryFa: string;
  technicalDetails: string;
  configFlags: string[];
  keyFiles: string[];
  defaultSelected: boolean;
}

export const SUBSYSTEM_CATEGORIES = [
  { id: 'all', labelFa: 'همه بخش‌ها (۱۷ قابلیت اصلی)', count: 17 },
  { id: 'sched_oplus', labelFa: 'زمان‌بند OPPO UI First و QoS', count: 6 },
  { id: 'display_dp', labelFa: 'تصویر E404 و خروجی DisplayPort', count: 3 },
  { id: 'touch_input', labelFa: 'تاچ NT36532، قلم و کیبورد', count: 2 },
  { id: 'root_sukisu', labelFa: 'روت SukiSU-Ultra + SUSFS + KPM', count: 2 },
  { id: 'network_wifi', labelFa: 'وای‌فای سریع و اشتراک شبکه OVNET', count: 2 },
  { id: 'thermal_power', labelFa: 'فریزر Hans و دمای Horae', count: 2 },
  { id: 'core_bpf', labelFa: 'هسته، BPF اندروید ۱۷ و دیباگ بوت', count: 2 },
] as const;

export const COS17_PORTED_ITEMS: KernelCommitItem[] = [
  {
    id: 'oplus-ui-first-sched-assist',
    sha: '191c4c6e',
    releaseTag: 'walt-r1..r5',
    subsystem: 'sched_oplus',
    subsystemLabelFa: 'زمان‌بند OPPO UI First و Frame Boost',
    titleEn: 'oppo: ColorOS 16/17 UI First interface (sched_assist, frame_boost, ux_task ioctls)',
    titleFa: '۱. موتور زمان‌بند OPPO UI First (Sched Assist & Frame Boost)',
    summaryFa:
      'پورت کامل زیرسیستم زمان‌بند اختصاصی اوپو (از کرنل OPD2101 و رابط ux_task اسنپدراگون ۸ نسل ۳ برای ColorOS 17). این بخش تردهای رابط کاربری (UI و RenderThread) را شناسایی کرده و هنگام انیمیشن و لمس صفحه، اولویت CPU و فرکانس کلاسترهای بزرگ را بدون لگ تنظیم می‌کند.',
    technicalDetails:
      'ایجاد گره‌های /proc/oplus_scheduler/sched_assist/* و /proc/sys/fbg/*، پشتیبانی از ioctlهای ux_task و ux_task_app، ارث‌بری اولویت UX در Binder و قفل‌های هسته (osq / rwsem / mutex uxchain_v2) و اولویت‌بندی صدای کم‌تاخیر (Audio Perf).',
    configFlags: [
      'CONFIG_OPLUS_FEATURE_SCHED_ASSIST=y',
      'CONFIG_OPLUS_FEATURE_SCHED_UX_PRIORITY=y',
      'CONFIG_OPLUS_FEATURE_FRAME_BOOST=y',
      'CONFIG_OPLUS_LOCKING_STRATEGY=y',
      'CONFIG_OPLUS_LOCKING_OSQ=y',
      'CONFIG_LOCKING_PROTECT=y',
      'CONFIG_OPLUS_FEATURE_AUDIO_OPT=y',
      'CONFIG_OPLUS_CPU_AUDIO_PERF=y',
      'CONFIG_MMAP_LOCK_OPT=y',
    ],
    keyFiles: [
      'kernel/sched_assist/',
      'kernel/tuning/',
      'drivers/soc/oplus/im/',
      'init/init_task.c',
    ],
    defaultSelected: true,
  },
  {
    id: 'oplus-qos-sched',
    sha: '4ebf956c',
    releaseTag: 'walt-r12..r13',
    subsystem: 'sched_oplus',
    subsystemLabelFa: 'زمان‌بند QoS سطح ترد در ColorOS 17',
    titleEn: 'sched_assist: OPPO qos_sched (/proc/oplus_qos_sched) + hardening + no-op cpu.schedtune.boost',
    titleFa: '۲. درایور زمان‌بند QoS کالراواس ۱۷ (/proc/oplus_qos_sched) و مقاوم‌سازی امنیتی',
    summaryFa:
      'در ColorOS 17 سرویس QosSchedulerManager (`qos_sched.so`) برای تنظیم سطح عملکرد تردها به `/proc/oplus_qos_sched` نیاز دارد. علاوه بر پورت کامل این درایور، در نسخه r13 تمام باگ‌های حافظه (شمارنده مرجع LUT در هر VMA/fd، صفر کردن صفحات، قفل RCU و ریست uclamp) برطرف شد و فایل مجازی `cpu.schedtune.boost` اضافه گردید تا ستاپ cgroup در ColorOS 17 با خطا مواجه نشود.',
    technicalDetails:
      'پیاده‌سازی ABI کامل ioctl برای /proc/oplus_qos_sched با وابستگی به CONFIG_UCLAMP_TASK، مدیریت جدول LUT با refcount مستقل و افزودن گره no-op برای cpu.schedtune.boost در cgroup.',
    configFlags: [
      'CONFIG_OPLUS_FEATURE_QOS_SCHED=y',
      'CONFIG_UCLAMP_TASK=y',
      'CONFIG_UCLAMP_TASK_GROUP=y',
    ],
    keyFiles: [
      'kernel/sched_assist/qos_sched.c',
      'kernel/sched_assist/qos_sched_lut.c',
      'kernel/sched/core.c',
    ],
    defaultSelected: true,
  },
  {
    id: 'oplus-im-flag-table',
    sha: '1c75ded2',
    releaseTag: 'walt-r11',
    subsystem: 'sched_oplus',
    subsystemLabelFa: 'جدول پرچم‌های IM_FLAG کالراواس ۱۶ و ۱۷',
    titleEn: 'sched_assist: IM_FLAG table of ColorOS 16+ (sm8750) and the IM_FLAG_CLEAR form',
    titleFa: '۳. جدول جدید IM_FLAG (از اسنپدراگون 8 الیت / ColorOS 16+) و فرمت IM_FLAG_CLEAR',
    summaryFa:
      'در ColorOS 16 و 17 شماره پرچم‌های حیاتی تردها (مثل 11 برای forbid affinity تا 18 برای RenderThread) تغییر کرده و برای پاک کردن پرچم، مقدار `64 + N` ارسال می‌شود. بدون این پچ، تردهای اصلی `system_server` پرچم خود را از دست می‌دادند و عدد 70/74 به اشتباه باقی می‌ماند.',
    technicalDetails:
      'به‌روزرسانی جدول IM_FLAG مطابق کرنل sm8750 اوپو و پشتیبانی از منطق پاک‌سازی بیت با آفست ۶۴ (IM_FLAG_CLEAR).',
    configFlags: [
      'CONFIG_OPLUS_UX_IM_FLAG=y',
      'CONFIG_OPLUS_FEATURE_IM=y',
    ],
    keyFiles: [
      'drivers/soc/oplus/im/im.c',
      'kernel/sched_assist/sched_assist_common.c',
    ],
    defaultSelected: true,
  },
  {
    id: 'oplus-binder-ux-flag',
    sha: 'fc7e4330',
    releaseTag: 'walt-r10',
    subsystem: 'sched_oplus',
    subsystemLabelFa: 'گره Binder UX برای حذف اسپم لاگ',
    titleEn: 'sched_assist: /proc/oplus_binder/ux_flag accepts ColorOS 16+ binder ux ioctl',
    titleFa: '۴. گره `/proc/oplus_binder/ux_flag` برای سازگاری با Binder در ColorOS 17',
    summaryFa:
      'فریم‌ورک ColorOS 17 به طور مداوم روی `/proc/oplus_binder/ux_flag` فراخوانی ioctl انجام می‌دهد. ایجاد این گره و پذیرش ioctl جدید باعث توقف کامل اسپم خطای `SchedAssist fd-invalid` در logcat و کاهش بار اضافی پردازنده می‌شود.',
    technicalDetails:
      'ثبت procfs برای /proc/oplus_binder/ux_flag و هندل کردن ioctlهای اختصاصی ColorOS 16/17 بدون بازگرداندن خطای ENOTTY/EBADF.',
    configFlags: ['CONFIG_OPLUS_FEATURE_SCHED_ASSIST=y'],
    keyFiles: ['drivers/android/binder.c', 'kernel/sched_assist/'],
    defaultSelected: true,
  },
  {
    id: 'sf-gpu-big-cluster-walt',
    sha: 'ccd5ee79',
    releaseTag: 'walt-r5',
    subsystem: 'sched_oplus',
    subsystemLabelFa: 'شتاب‌دهی SurfaceFlinger، رندرینگ ۱۲۰ هرتز و WALT uclamp',
    titleEn: 'sched/walt + kgsl + sched_assist: SurfaceFlinger top GPU ringbuffer, RenderEngine off little cores, 120Hz default, WALT uclamp',
    titleFa: '۵. اولویت ویژه SurfaceFlinger روی GPU و هسته‌های بزرگ + اتصال WALT به uclamp',
    summaryFa:
      'چهار بهینه‌سازی کلیدی برای روانی ۱۲۰ هرتز: ۱) قرار دادن کانتکست GPU مربوط به SurfaceFlinger روی بالاترین Ringbuffer گرافیک آدرنو (kgsl) و هم‌سطح کردن SystemUI با لانچر؛ ۲) جلوگیری از افتادن SurfaceFlinger و RenderEngine روی هسته‌های کوچک (Little cores)؛ ۳) هدایت تردهای سنگین UX به کلاستر بزرگ (`kernel.ux_prefer_big`) و نرخ فریم پیش‌فرض ۱۲۰؛ ۴) اتصال زمان‌بند WALT به `cpu.uclamp` چون اندروید ۱۷ دیگر schedtune ندارد.',
    technicalDetails:
      'شامل کامیت‌های ccd5ee79، fe2b0ba8، 9b1b4567 و 4f051b44 برای هماهنگی کامل WALT با uclamp و اولویت‌بندی رندرینگ در صحنه‌های اسکرول و انیمیشن.',
    configFlags: ['CONFIG_UCLAMP_TASK=y', 'CONFIG_UCLAMP_TASK_GROUP=y'],
    keyFiles: [
      'drivers/gpu/msm/adreno_ringbuffer.c',
      'kernel/sched/walt.c',
      'kernel/sched_assist/sched_assist_fair.c',
    ],
    defaultSelected: true,
  },
  {
    id: 'oppo-hans-freezer',
    sha: 'e8a3f616',
    releaseTag: 'walt-r6',
    subsystem: 'thermal_power',
    subsystemLabelFa: 'کانال فریزر برنامه‌های پس‌زمینه OPPO Hans',
    titleEn: 'hans: OPPO Hans app freezer kernel channel (netlink 29, binder/signal/network reports) + real 4.19 uname for hans',
    titleFa: '۶. سیستم فریز برنامه‌های پس‌زمینه OPPO Hans (کاهش مصرف باتری در استندبای)',
    summaryFa:
      'پورت کانال هسته `CONFIG_OPLUS_HANS` (از طریق Netlink 29 همراه با گزارش‌های تراکنش Binder، سیگنال و پکت‌های شبکه). در ColorOS اگر دیمون `hans` نتواند به این کانال وصل شود، نه تنها خودش غیرفعال می‌شود بلکه فریزر پیش‌فرض اندروید (AOSP Freezer) را هم وتو و خاموش می‌کند و هیچ برنامه‌ای در پس‌زمینه فریز نمی‌شود! همچنین در کامیت `68186305` کاری کردیم که دیمون hans نسخه واقعی کرنل `4.19` را ببیند تا از همین کانال پایدار استفاده کند.',
    technicalDetails:
      'پیاده‌سازی کامل drivers/staging/android/hans.c و هوک‌های گزارش‌دهی در binder.c، signal.c و شبکه به همراه استثنای uname spoof برای پروسه hans.',
    configFlags: ['CONFIG_OPLUS_HANS=y'],
    keyFiles: ['drivers/staging/android/hans.c', 'drivers/staging/android/hans_netfilter.c', 'kernel/sys.c'],
    defaultSelected: true,
  },
  {
    id: 'horae-shell-temp',
    sha: '9b0ab5cc',
    releaseTag: 'walt-r16',
    subsystem: 'thermal_power',
    subsystemLabelFa: 'حسگر مجازی دمای بدنه برای سرویس Horae',
    titleEn: 'thermal: /proc/shell-temp for ColorOS horae (port of OPPO horae_shell_temp)',
    titleFa: '۷. رابط حرارتی `/proc/shell-temp` برای دیمون کنترل دمای ColorOS Horae',
    summaryFa:
      'سرویس کنترل حرارت کالراواس (`horae`) دمای محاسبه‌شده بدنه تبلت را با فرمت `<index> <m°C>` داخل `/proc/shell-temp` می‌نویسد و بیشترین دما را از آن می‌خواند. با پورت `horae_shell_temp`، دیمون حرارتی ColorOS 17 بدون تداخل با مدیریت حرارتی اصلی شیائومی/کوالکام به درستی کار می‌کند.',
    technicalDetails:
      'ایجاد درایور CONFIG_HORAE_THERMAL_SHELL و ثبت /proc/shell-temp بدون ثبت thermal_zone اضافی روی pipa.',
    configFlags: ['CONFIG_HORAE_THERMAL_SHELL=y'],
    keyFiles: ['drivers/thermal/horae_shell_temp.c'],
    defaultSelected: true,
  },
  {
    id: 'e404-display-driver',
    sha: '3d22ab4e',
    releaseTag: 'walt-r1..r4',
    subsystem: 'display_dp',
    subsystemLabelFa: 'درایور نمایشگر E404 و نودهای رنگ PCC',
    titleEn: 'techpack/display: use E404 pipa display driver + PCC colour transform nodes + lockdown info layout',
    titleFa: '۸. درایور نمایشگر E404 مخصوص Pipa به همراه ماتریس رنگ PCC و خواندن Lockdown Info',
    summaryFa:
      'جایگزینی درایور نمایشگر با نسخه بهینه‌شده E404 برای پنل M82 شیائومی پد ۶، افزودن نودهای sysfs برای تبدیل رنگ PCC (`connector_kdev`)، اصلاح خواندن اطلاعات Lockdown پنل، و رفع باگ شمارنده مرجع `drm_device` در وضعیت اتمی از پیش تخصیص‌یافته به همراه سازگاری کامل با CFI.',
    technicalDetails:
      'شامل کامیت‌های 3d22ab4e، fe409c52، 4868b8d9، e3d5d57c، 4b63f36f و a4b21f06 روی techpack/display و drivers/gpu/drm.',
    configFlags: ['CONFIG_CFI_PERMISSIVE=y'],
    keyFiles: [
      'techpack/display/msm/',
      'drivers/gpu/drm/drm_sysfs.c',
      'drivers/gpu/drm/msm/',
    ],
    defaultSelected: true,
  },
  {
    id: 'dp-8bpc-and-max-refresh',
    sha: 'e9fb37ec',
    releaseTag: 'walt-r14..r15',
    subsystem: 'display_dp',
    subsystemLabelFa: 'رفع قطع تصویر مانیتورهای USB-C / DisplayPort و نرخ نوسازی بالا',
    titleEn: 'DP: at most 8 bpc by default + preferred mode = highest refresh at preferred resolution that fits link',
    titleFa: '۹. بهبود خروجی تصویر USB-C (DisplayPort): پیش‌فرض 8-bpc و انتخاب بالاترین هرتز مانیتور',
    summaryFa:
      'دو مشکل بزرگ اتصال تبلت به مانیتور اکسترنال حل شد: ۱) در r14 عمق رنگ پیش‌فرض DisplayPort به حداکثر 8bpc محدود شد چون مانیتورهایی مثل GO27Q24 در حالت 10bpc سیگنال HPD را قطع می‌کردند؛ ۲) در r15 چون SurfaceFlinger همیشه روی اولین مد تصویر می‌ماند، مد ترجیحی (Preferred Mode) به بالاترین نرخ نوسازی (مثلاً 2560x1440@120Hz به جای 60Hz) که در پهنای باند لینک جا می‌شود تغییر یافت (همراه با محافظت خودکار در صورت دو بار قطع سریع HPD).',
    technicalDetails:
      'افزودن پارامترهای ماژول pipa_dp_hdcp، pipa_dp_max_bpc، pipa_dp_log و pipa_dp_prefer_max_rate در /sys/module/msm_drm/parameters/ (کامیت‌های 00952a1a و e9fb37ec).',
    configFlags: [],
    keyFiles: [
      'techpack/display/msm/dp/dp_panel.c',
      'techpack/display/msm/dp/dp_display.c',
    ],
    defaultSelected: true,
  },
  {
    id: 'nt36532-touch-charger-mode',
    sha: 'a3161aeb',
    releaseTag: 'walt-r9',
    subsystem: 'touch_input',
    subsystemLabelFa: 'درایور تاچ E404 NT36532 و حذف لگ تاچ هنگام شارژ',
    titleEn: 'nt36532: E404 touch driver + tell firmware USB/charger state (0x53 plug in, 0x51 out)',
    titleFa: '۱۰. درایور تاچ E404 NT36532 + ارسال وضعیت شارژر به فریم‌ور تاچ (حذف لگ لمس در حین شارژ)',
    summaryFa:
      'استفاده از درایور تاچ NT36532 و `xiaomi_touch` نسخه E404 (و حذف درایور غیرضروری Himax) به همراه قابلیت جدید نسخه r9: ارسال کد `0x53` هنگام اتصال کابل USB/شارژر و `0x51` هنگام جدا شدن به فریم‌ور تاچ Novatek تا فیلتر نویز شارژر فعال شود و هیچ گونه لگ یا پرش تاچ هنگام شارژ رخ ندهد (با حفظ دکمه‌های استاندارد `BTN_STYLUS` قلم در نوکرنل).',
    technicalDetails:
      'شامل کامیت‌های 6667e906 و a3161aeb در drivers/input/touchscreen/nt36532/ همراه با ثبت notifier وضعیت USB.',
    configFlags: ['# CONFIG_TOUCHSCREEN_HIMAX_CHIPSET is not set'],
    keyFiles: [
      'drivers/input/touchscreen/nt36532/nt36xxx.c',
      'drivers/input/touchscreen/xiaomi/xiaomi_touch.c',
    ],
    defaultSelected: true,
  },
  {
    id: 'nanosic-keypad-attach',
    sha: '6e7293b6',
    releaseTag: 'walt-r7',
    subsystem: 'touch_input',
    subsystemLabelFa: 'بهینه‌سازی کیبورد مغناطیسی شیائومی (Nanosic)',
    titleEn: 'nanosic: create the keypad input devices only while the keypad is attached',
    titleFa: '۱۱. درایور کیبورد Nanosic: ایجاد دستگاه ورودی کیبورد فقط در زمان اتصال فیزیکی',
    summaryFa:
      'در حالت عادی درایور `nanosic` حتی وقتی کیبورد فیزیکی به تبلت وصل نیست، یک دستگاه ورودی کیبورد و تاچ‌پد مجازی در اندروید ثبت می‌کند که باعث اختلال در رفتار کیبورد روی صفحه (On-screen keyboard) در ColorOS می‌شود. با این تغییر، دستگاه ورودی فقط زمانی که کیبورد واقعاً به پین‌های مغناطیسی متصل شود ساخته می‌شود و به محض جدا شدن حذف می‌گردد.',
    technicalDetails:
      'مدیریت داینامیک ثبت و حذف input_dev در درایور nanosic بر اساس وضعیت اتصال پین پوگو.',
    configFlags: [],
    keyFiles: ['drivers/input/keyboard/nanosic_driver/'],
    defaultSelected: true,
  },
  {
    id: 'cnss2-fast-wifi',
    sha: '6cff683e',
    releaseTag: 'walt-r7',
    subsystem: 'network_wifi',
    subsystemLabelFa: 'روشن شدن سریع وای‌فای (۱۱.۵ ثانیه سریع‌تر)',
    titleEn: 'cnss2: skip the NV MAC wait by default (Wi-Fi starts ~11.5 s sooner)',
    titleFa: '۱۲. حذف انتظار بی‌مورد NV MAC در درایور cnss2 (روشن شدن وای‌فای ۱۱.۵ ثانیه سریع‌تر)',
    summaryFa:
      'درایور کوالکام `cnss2` هنگام بوت به صورت پیش‌فرض منتظر دریافت مک‌آدرس از NV می‌ماند که حدود ۱۱.۵ ثانیه راه‌اندازی وای‌فای را به تاخیر می‌اندازد. با رد کردن این انتظار بی‌مورد به طور پیش‌فرض (در کنار فیکس تأخیر خاموش/روشن کردن سریع وای‌فای در نوکرنل)، وای‌فای بلافاصله پس از بوت آماده به کار می‌شود.',
    technicalDetails:
      'تغییر رفتار پیش‌فرض انتظار NV MAC در drivers/net/wireless/cnss2/main.c.',
    configFlags: [],
    keyFiles: ['drivers/net/wireless/cnss2/main.c'],
    defaultSelected: true,
  },
  {
    id: 'oppo-ovnet-interconnect',
    sha: '986d8896',
    releaseTag: 'walt-r7ov',
    subsystem: 'network_wifi',
    subsystemLabelFa: 'درایور شبکه مجازی OVNET برای اشتراک اینترنت اوپو',
    titleEn: 'net: ovnet, OPPO interconnect virtual netdev for network sharing',
    titleFa: '۱۳. درایور شبکه مجازی `ovnet` برای قابلیت اشتراک اینترنت گوشی و تبلت در ColorOS',
    summaryFa:
      'در اکوسیستم ColorOS 17، قابلیت اشتراک خودکار اینترنت سیم‌کارت گوشی با تبلت (Communication Sharing) از یک رابط شبکه مجازی به نام `ovnet0` روی `p2p0` استفاده می‌کند. این درایور به صورت توکار (Built-in) به کرنل اضافه شد تا `netd` بلافاصله و بدون نیاز به ماژول خارجی لینک `ovnet` را برقرار کند.',
    technicalDetails:
      'پورت درایور drivers/net/ovnet/ و فعال‌سازی CONFIG_OPLUS_OVNET=y به صورت built-in.',
    configFlags: ['CONFIG_OPLUS_OVNET=y'],
    keyFiles: ['drivers/net/ovnet/'],
    defaultSelected: true,
  },
  {
    id: 'sukisu-ultra-susfs-kpm',
    sha: '81cc3f4d',
    releaseTag: 'walt-r8..r17',
    subsystem: 'root_sukisu',
    subsystemLabelFa: 'روت هسته SukiSU-Ultra v4.3.0-r1 + مخفی‌سازی SUSFS v2.3.0 + KPM',
    titleEn: 'walt-r17: SukiSU-Ultra builtin 1cfa5734 (v4.3.0-r1, 41140) + susfs 2.3.0 priority uid filter + KPM 0.14.0',
    titleFa: '۱۴. یکپارچه‌سازی SukiSU-Ultra v4.3.0-r1 (نسخه 41140) + SUSFS v2.3.0 + پشتیبانی KPM',
    summaryFa:
      'ارتقا به آخرین نسخه SukiSU-Ultra شاخه `builtin` (کامیت `1cfa5734`، نسخه 41140، uapi 6) با هوک‌های دستی بهینه‌شده برای کرنل 4.19 (بدون نیاز به kprobes که باعث ناپایداری می‌شد)، به همراه سیستم مخفی‌سازی کامل روت `susfs v2.3.0` (با بک‌پورت فیلتر UID اولویت‌دار) و قابلیت پچ کردن باینری Image با `KernelPatch (KPM 0.14.0)`.',
    technicalDetails:
      'شامل کامیت‌های a40d8ad7، e4624c1d، 8b082e03، d04e1553 و 81cc3f4d روی fs/، kernel/، security/selinux/ و دایرکتوری KernelSU/.',
    configFlags: [
      'CONFIG_KSU=y',
      'CONFIG_KSU_SUSFS=y',
      'CONFIG_KSU_SUSFS_SUS_PATH=y',
      'CONFIG_KSU_SUSFS_SUS_MOUNT=y',
      'CONFIG_KSU_SUSFS_SUS_KSTAT=y',
      'CONFIG_KSU_SUSFS_SPOOF_UNAME=y',
      'CONFIG_KSU_SUSFS_HIDE_KSU_SUSFS_SYMBOLS=y',
      'CONFIG_KSU_SUSFS_SPOOF_CMDLINE_OR_BOOTCONFIG=y',
      'CONFIG_KSU_SUSFS_OPEN_REDIRECT=y',
      'CONFIG_KSU_SUSFS_SUS_MAP=y',
    ],
    keyFiles: ['KernelSU/', 'fs/susfs.c', 'include/linux/susfs.h', 'security/selinux/'],
    defaultSelected: true,
  },
  {
    id: 'uname-spoof-audit-bpf',
    sha: 'bc7bcc75',
    releaseTag: 'walt-r1..r6',
    subsystem: 'core_bpf',
    subsystemLabelFa: 'سازگاری با BPF اندروید ۱۷ و SELinux Audit',
    titleEn: 'kernel: spoof uname for Android 17 BPF loaders + enable CONFIG_AUDIT/AUDITSYSCALL',
    titleFa: '۱۵. جعل هوشمند نسخه کرنل (uname spoof) برای لودرهای BPF اندروید ۱۷ و فعال‌سازی Audit',
    summaryFa:
      'لودرهای BPF در اندروید ۱۷ (ColorOS 17) در صورت دیدن شماره نسخه `4.19` از بارگذاری برنامه‌های BPF خودداری می‌کنند و سیستم بوت نمی‌شود. با این پچ، نسخه کرنل برای لودرهای BPF اندروید ۱۷ جعل می‌شود (در حالی که دیمون `hans` نسخه واقعی `4.19` را می‌بیند). همچنین `CONFIG_AUDIT` و `CONFIG_AUDITSYSCALL` برای ابزارهای SELinux رام فعال شدند.',
    technicalDetails:
      'اصلاح sys_newuname در kernel/sys.c بر اساس نام پروسه فراخوانی‌کننده و فعال‌سازی AUDIT در کانفیگ.',
    configFlags: [
      'CONFIG_AUDIT=y',
      'CONFIG_AUDITSYSCALL=y',
      'CONFIG_KALLSYMS_ALL=y',
    ],
    keyFiles: ['kernel/sys.c', 'arch/arm64/configs/vendor/xiaomi/pipa-cos17.config'],
    defaultSelected: true,
  },
  {
    id: 'pstore-ramoops-bootdbg',
    sha: 'e3ee0ff8',
    releaseTag: 'walt-r1..r2',
    subsystem: 'core_bpf',
    subsystemLabelFa: 'چیدمان حافظه عیب‌یابی Pstore/Ramoops و واچ‌داگ بوت',
    titleEn: 'pstore: E404/joeyzhu ramoops layout on pipa + pipa_bootdbg boot watchdog',
    titleFa: '۱۶. چیدمان استاندارد Pstore/Ramoops برای ثبت لاگ کرش و ماژول واچ‌داگ بوت (`pipa_bootdbg`)',
    summaryFa:
      'تنظیم آدرس‌های حافظه `ramoops` و `pstore` مطابق چیدمان استاندارد pipa تا در صورت ریبوت ناگهانی، لاگ‌های `/sys/fs/pstore/console-ramoops-0` به درستی ذخیره شوند؛ به همراه ماژول اختیاری `CONFIG_PIPA_BOOTDBG` برای تشخیص قفل شدن احتمالی در مراحل اولیه بوت.',
    technicalDetails:
      'شامل کامیت‌های 9d4ce967 و e3ee0ff8 در arch/arm64/boot/dts و kernel/.',
    configFlags: ['CONFIG_PIPA_BOOTDBG=n'],
    keyFiles: ['kernel/pipa_bootdbg.c', 'arch/arm64/boot/dts/vendor/qcom/'],
    defaultSelected: true,
  },
];

export const N0_PRESERVED_FEATURES = [
  {
    sha: 'dadfec20',
    titleFa: 'درایور همگام‌سازی NTSYNC بک‌پورت‌شده از لینوکس 6.14 (مخصوص اجرای روان شبیه‌سازهای ویندوز/Winlator)',
  },
  {
    sha: '735b9d06',
    titleFa: 'پشتیبانی از دکمه‌های استاندارد BTN_STYLUS روی قلم شیائومی در درایور تاچ NT36532',
  },
  {
    sha: '14d4197f',
    titleFa: 'اصلاح محافظت حرارتی و تعلیق ورودی شارژ در درایور smb5-lib-pipa',
  },
  {
    sha: '69d69817',
    titleFa: 'اصلاح تایپوی status = "disable" روی نود usb1 در Device Tree تبلت pipa',
  },
  {
    sha: 'fce889f5',
    titleFa: 'فعال‌سازی CONFIG_VMAP_STACK، CONFIG_STACKPROTECTOR_STRONG و CONFIG_RSEQ در دیف‌کانفیگ نوکرنل',
  },
];
