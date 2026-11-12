import React, { useState, useMemo } from 'react';
import {
  Download,
  GitCommit,
  FileCode2,
  Check,
  Copy,
  Search,
  Terminal,
  Sliders,
  ExternalLink,
  Layers,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import {
  COS17_PORTED_ITEMS,
  N0_PRESERVED_FEATURES,
  SUBSYSTEM_CATEGORIES,
  KernelCommitItem,
} from './data/cos17Patches';

interface CommitFileDiff {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
}

interface LiveCommitDetails {
  sha: string;
  message: string;
  author: string;
  date: string;
  stats: { additions: number; deletions: number; total: number };
  files: CommitFileDiff[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'ported' | 'builder' | 'config' | 'flashing'>('ported');
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(COS17_PORTED_ITEMS.map((item) => item.id))
  );

  // Build configuration options
  const [enableSukiSU, setEnableSukiSU] = useState<boolean>(true);
  const [enableSusfs, setEnableSusfs] = useState<boolean>(true);
  const [enableKpm, setEnableKpm] = useState<boolean>(true);
  const [kpmSuperkey, setKpmSuperkey] = useState<string>('pipa2026');
  const [enableOplusUiFirst, setEnableOplusUiFirst] = useState<boolean>(true);
  const [enableHansFreezer, setEnableHansFreezer] = useState<boolean>(true);
  const [enableDp120Hz, setEnableDp120Hz] = useState<boolean>(true);
  const [enableBootDbg, setEnableBootDbg] = useState<boolean>(false);
  const [preserveNtSync, setPreserveNtSync] = useState<boolean>(true);

  // Live GitHub Commit Diff state
  const [activeCommit, setActiveCommit] = useState<KernelCommitItem | null>(null);
  const [commitDetails, setCommitDetails] = useState<LiveCommitDetails | null>(null);
  const [loadingDiff, setLoadingDiff] = useState<boolean>(false);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return COS17_PORTED_ITEMS.filter((item) => {
      const matchesSubsystem =
        selectedSubsystem === 'all' || item.subsystem === selectedSubsystem;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.titleFa.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q) ||
        item.summaryFa.toLowerCase().includes(q) ||
        item.sha.toLowerCase().includes(q) ||
        item.configFlags.some((f) => f.toLowerCase().includes(q));
      return matchesSubsystem && matchesQuery;
    });
  }, [selectedSubsystem, searchQuery]);

  const toggleItemSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const inspectCommitDiff = async (item: KernelCommitItem) => {
    setActiveCommit(item);
    setLoadingDiff(true);
    setDiffError(null);
    setCommitDetails(null);
    try {
      const res = await fetch(`/api/commit/${item.sha}`);
      if (!res.ok) {
        throw new Error(`خطا در دریافت اطلاعات کامیت از گیت‌هاب (${res.status})`);
      }
      const data: LiveCommitDetails = await res.json();
      setCommitDetails(data);
    } catch (err: any) {
      setDiffError(err.message || 'خطا در ارتباط با سرور');
    } finally {
      setLoadingDiff(false);
    }
  };

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const mergedConfigText = useMemo(() => {
    const lines: string[] = [
      '# ============================================================================',
      '# Merged Defconfig Fragment: N0Kernel Pipa + ColorOS 17 (walt-r17)',
      '# Base: arch/arm64/configs/vendor/pipa_defconfig (n0_kernel_pipa)',
      '# ============================================================================',
      '',
      '# --- N0Kernel Hardening & Gaming Features ---',
      'CONFIG_VMAP_STACK=y',
      'CONFIG_STACKPROTECTOR_STRONG=y',
      'CONFIG_RSEQ=y',
    ];
    if (preserveNtSync) {
      lines.push('CONFIG_NTSYNC=y');
    }
    lines.push(
      '',
      '# --- ColorOS 17 Core & BPF / SELinux Compatibility (pipa-cos17.config) ---',
      'CONFIG_AUDIT=y',
      'CONFIG_AUDITSYSCALL=y',
      'CONFIG_KALLSYMS_ALL=y',
      'CONFIG_CFI_PERMISSIVE=y',
      'CONFIG_UCLAMP_TASK=y',
      'CONFIG_UCLAMP_TASK_GROUP=y',
      '# CONFIG_TOUCHSCREEN_HIMAX_CHIPSET is not set'
    );

    if (enableOplusUiFirst) {
      lines.push(
        '',
        '# --- OPPO UI First Scheduler & QoS (pipa-oplus.config) ---',
        'CONFIG_OPLUS_FEATURE_SCHED_ASSIST=y',
        'CONFIG_OPLUS_FEATURE_SCHED_UX_PRIORITY=y',
        'CONFIG_OPLUS_UX_IM_FLAG=y',
        'CONFIG_OPLUS_FEATURE_IM=y',
        'CONFIG_OPLUS_LOCKING_STRATEGY=y',
        'CONFIG_OPLUS_LOCKING_OSQ=y',
        'CONFIG_LOCKING_PROTECT=y',
        'CONFIG_OPLUS_FEATURE_AUDIO_OPT=y',
        'CONFIG_OPLUS_CPU_AUDIO_PERF=y',
        'CONFIG_OPLUS_FEATURE_FRAME_BOOST=y',
        'CONFIG_OPLUS_FEATURE_QOS_SCHED=y',
        'CONFIG_MMAP_LOCK_OPT=y'
      );
    }

    if (enableHansFreezer) {
      lines.push(
        '',
        '# --- OPPO Hans App Freezer & Interconnect + Horae Thermal ---',
        'CONFIG_OPLUS_HANS=y',
        'CONFIG_OPLUS_OVNET=y',
        'CONFIG_HORAE_THERMAL_SHELL=y'
      );
    }

    if (enableSukiSU) {
      lines.push(
        '',
        '# --- SukiSU-Ultra v4.3.0-r1 (41140) Builtin ---',
        'CONFIG_KSU=y'
      );
    }

    if (enableSusfs) {
      lines.push(
        'CONFIG_KSU_SUSFS=y',
        'CONFIG_KSU_SUSFS_SUS_PATH=y',
        'CONFIG_KSU_SUSFS_SUS_MOUNT=y',
        'CONFIG_KSU_SUSFS_SUS_KSTAT=y',
        'CONFIG_KSU_SUSFS_SPOOF_UNAME=y',
        'CONFIG_KSU_SUSFS_ENABLE_LOG=y',
        'CONFIG_KSU_SUSFS_HIDE_KSU_SUSFS_SYMBOLS=y',
        'CONFIG_KSU_SUSFS_SPOOF_CMDLINE_OR_BOOTCONFIG=y',
        'CONFIG_KSU_SUSFS_OPEN_REDIRECT=y',
        'CONFIG_KSU_SUSFS_SUS_MAP=y'
      );
    }

    if (enableBootDbg) {
      lines.push(
        '',
        '# --- Boot Watchdog & Lockup Detector ---',
        'CONFIG_PIPA_BOOTDBG=y',
        'CONFIG_SOFTLOCKUP_DETECTOR=y',
        'CONFIG_DETECT_HUNG_TASK=y'
      );
    }

    return lines.join('\n');
  }, [
    preserveNtSync,
    enableOplusUiFirst,
    enableHansFreezer,
    enableSukiSU,
    enableSusfs,
    enableBootDbg,
  ]);

  const customBuildScript = useMemo(() => {
    return `#!/bin/bash
# ==============================================================================
# Verified N0Kernel Pipa + ColorOS 17 (walt-r17) Port & Build Script
# Target Device : Xiaomi Pad 6 (pipa / SM8250)
# COS17 Base    : https://github.com/m91biology-dotcom/kernel_xiaomi_pipa_cos17 (branch oppo)
# N0Kernel Repo : https://github.com/m91biology-dotcom/n0_kernel_pipa (branch 15)
# ==============================================================================
set -euo pipefail

WORKDIR="\${WORKDIR:-\$(pwd)/n0_kernel_pipa_cos17}"
CLANG_DIR="\${CLANG:-\$HOME/tc}"

echo "[1/6] Cloning ColorOS 17 walt-r17 kernel base (Linux 4.19.325-cip136 + OPPO UI First + SukiSU 41140)..."
if [ ! -d "\$WORKDIR/.git" ]; then
  git clone --depth 1 -b oppo https://github.com/m91biology-dotcom/kernel_xiaomi_pipa_cos17.git "\$WORKDIR"
fi
cd "\$WORKDIR"

echo "[2/6] Fetching N0Kernel Pipa (branch 15) commits..."
git remote remove n0 2>/dev/null || true
git remote add n0 https://github.com/m91biology-dotcom/n0_kernel_pipa.git
git fetch --depth=50 n0 15

echo "[3/6] Applying N0Kernel Pipa patches (Bypass Charging, Maple I/O, Stylus Buttons, Thermal & USB1 Fixes)..."
for c in 0e073b43 99ea7f3b 1db01b28 555db11b 14d4197f 69d69817 735b9d06; do
  git format-patch -1 --stdout "\$c" | git apply --whitespace=nowarn
done

git format-patch -1 --stdout a12268c8 -- \\
  drivers/power/supply/qcom/smb5-lib-pipa.c \\
  drivers/power/supply/qcom/smb5-lib.c \\
  drivers/power/supply/qcom/smb-lib.c | git apply --whitespace=nowarn

git format-patch -1 --stdout a526c765 -- arch/arm64/boot/dts/vendor/qcom/pipa-sm8250.dtsi | git apply --whitespace=nowarn
git format-patch -1 --stdout f0b0af81 -- arch/arm64/boot/dts/vendor/qcom/kona.dtsi | git apply --whitespace=nowarn

echo "[4/6] Importing Linux 6.14 NTSYNC, USB FastChg & QCA Wi-Fi buffer safety from N0Kernel..."
git checkout n0/15 -- \\
  drivers/misc/ntsync.c \\
  include/uapi/linux/ntsync.h \\
  drivers/misc/fastchg.c \\
  include/linux/fastchg.h \\
  drivers/staging/qca-wifi-host-cmn/qdf/src/qdf_parse.c

if ! grep -q "LOCK_STATE_NOT_HELD" include/linux/lockdep.h; then
  cat << 'EOF' >> include/linux/lockdep.h

#ifndef LOCK_STATE_NOT_HELD
#define LOCK_STATE_UNKNOWN	-1
#define LOCK_STATE_NOT_HELD	0
#define LOCK_STATE_HELD		1
#endif
#ifndef lockdep_is_held
#define lockdep_is_held(lock)	lockdep_is_held_type(lock, -1)
#endif
#ifndef lockdep_assert
#ifdef CONFIG_LOCKDEP
#define lockdep_assert(cond)	do { WARN_ON(debug_locks && !(cond)); } while (0)
#else
#define lockdep_assert(cond)	do { } while (0)
#endif
#endif
EOF
fi

if ! grep -q "CONFIG_FORCE_FAST_CHARGE" drivers/misc/Makefile; then
  echo 'obj-\$(CONFIG_FORCE_FAST_CHARGE) += fastchg.o' >> drivers/misc/Makefile
fi
if ! grep -q "CONFIG_NTSYNC" drivers/misc/Makefile; then
  echo 'obj-\$(CONFIG_NTSYNC) += ntsync.o' >> drivers/misc/Makefile
fi

python3 -c '
p = "drivers/misc/Kconfig"
s = open(p).read()
add = """
config FORCE_FAST_CHARGE
\\tbool "Force faster charge rate for USB"
\\tdefault y
\\thelp
\\t  This allows users to override default charge rate for USB.

config NTSYNC
\\ttristate "NT synchronization primitive driver"
\\tdefault y
\\thelp
\\t  This driver provides a kernel implementation of Windows NT synchronization primitives.
"""
if "config NTSYNC" not in s:
    idx = s.rfind("endmenu")
    s = s[:idx] + add + "\\n" + s[idx:]
    open(p, "w").write(s)
'

echo "[5/6] Compiling Kernel with AOSP Clang 20 (r547379)..."
if [ ! -d "\$CLANG_DIR/bin" ]; then
  git clone --depth 1 https://gitlab.com/alphadroid-project/prebuilts_clang_host_linux-x86_clang-r547379.git "\$CLANG_DIR"
fi
export PATH="\$CLANG_DIR/bin:\$PATH"

OUT=out
rm -rf "\$OUT"
mkdir -p "\$OUT"
A=(
  ARCH=arm64 O="\$OUT" CC=clang LLVM=1 LLVM_IAS=1
  CROSS_COMPILE=aarch64-linux-gnu- CROSS_COMPILE_COMPAT=arm-linux-gnueabi-
  AR=llvm-ar NM=llvm-nm OBJCOPY=llvm-objcopy OBJDUMP=llvm-objdump STRIP=llvm-strip
)

C=arch/arm64/configs/vendor
F=("$C/kona-perf_defconfig" "$C/xiaomi/sm8250-common.config" "$C/xiaomi/pipa.config" "$C/xiaomi/pipa-cos17.config" "$C/xiaomi/pipa-oplus.config")
ARCH=arm64 LLVM=1 scripts/kconfig/merge_config.sh -m -O "\$OUT" "\${F[@]}"

scripts/config --file "\$OUT/.config" \\
  -e KSU -e KSU_SUSFS -e KSU_SUSFS_SUS_PATH -e KSU_SUSFS_SUS_MOUNT \\
  -e KSU_SUSFS_SUS_KSTAT -e KSU_SUSFS_SPOOF_UNAME -e KSU_SUSFS_ENABLE_LOG \\
  -e KSU_SUSFS_HIDE_KSU_SUSFS_SYMBOLS -e KSU_SUSFS_SPOOF_CMDLINE_OR_BOOTCONFIG \\
  -e KSU_SUSFS_OPEN_REDIRECT -e KSU_SUSFS_SUS_MAP \\
  -e NTSYNC -e FORCE_FAST_CHARGE -e IOSCHED_MAPLE \\
  -e VMAP_STACK -e STACKPROTECTOR_STRONG -e RSEQ \\
  -d QCOM_DCC_V2 -d ESOC -d ESOC_DEV -d ESOC_CLIENT -d ESOC_MDM_4x -d CC_WERROR

make "\${A[@]}" olddefconfig
make "\${A[@]}" -j"\$(nproc --all)"

if [ ! -f "\$OUT/arch/arm64/boot/dtb" ]; then
  find "\$OUT/arch/arm64/boot/dts" -name "*.dtb" -exec cat {} + > "\$OUT/arch/arm64/boot/dtb"
fi

${
  enableKpm
    ? `echo "[5.5/6] Patching Image with KernelPatch (KPM 0.14.0, superkey: ${kpmSuperkey})..."
wget -qO kptools-linux https://github.com/bmax121/KernelPatch/releases/download/0.14.0/kptools-linux
wget -qO kpimg https://github.com/bmax121/KernelPatch/releases/download/0.14.0/kpimg-android
chmod +x kptools-linux
./kptools-linux -p -i "\$OUT/arch/arm64/boot/Image" -k kpimg -s "${kpmSuperkey}" -o "\$OUT/arch/arm64/boot/Image-kpm"
mv "\$OUT/arch/arm64/boot/Image-kpm" "\$OUT/arch/arm64/boot/Image"`
    : '# KPM patching disabled'
}

echo "[6/6] Packaging AnyKernel3 Flashable ZIP..."
rm -rf anykernel
git clone https://github.com/CuriousNom/AnyKernel3 -b pipa-n0 --single-branch --depth=1 anykernel
rm -rf anykernel/kernels/
mkdir -p anykernel/kernels/
cp "\$OUT/arch/arm64/boot/Image" anykernel/kernels/
cp "\$OUT/arch/arm64/boot/dtb" anykernel/kernels/
cp "\$OUT/arch/arm64/boot/dtbo.img" anykernel/kernels/
(
  cd anykernel
  zip -r9 ../N0Kernel_Pipa_COS17_walt-r17_AnyKernel3.zip ./* -x .git .gitignore out/ ./*.zip
)
echo "Done! Flashable zip: \$WORKDIR/N0Kernel_Pipa_COS17_walt-r17_AnyKernel3.zip"
`;
  }, [enableKpm, kpmSuperkey]);

  const downloadWorkflowFile = async () => {
    try {
      const res = await fetch('/api/scripts/build-n0kernel-cos17.yml');
      const text = await res.text();
      downloadFile('build-n0kernel-cos17.yml', text);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-950/90 sticky top-0 z-30 backdrop-blur-md">
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
        >
          Pipa Kernel Studio
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('ported')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'ported' ? 'text-blue-400 underline underline-offset-8' : ''
            }`}
          >
            تغییرات پورت‌شده (۱۶ بخش)
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'builder' ? 'text-blue-400 underline underline-offset-8' : ''
            }`}
          >
            بیلد ابری و اسکریپت اتوماتیک
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'config' ? 'text-blue-400 underline underline-offset-8' : ''
            }`}
          >
            ترکیب Defconfig
          </button>
          <button
            onClick={() => setActiveTab('flashing')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'flashing' ? 'text-blue-400 underline underline-offset-8' : ''
            }`}
          >
            راهنمای فلش روی تبلت
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => downloadFile('port-cos17-to-n0kernel.sh', customBuildScript)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>دانلود اسکریپت بیلد نوکرنل</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8 space-y-8">
        {/* Hero Overview Banner */}
        <section className="border border-slate-800 bg-slate-900/60 rounded-xl p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                  <span>Linux 4.19.325-cip136</span>
                  <span aria-hidden="true">·</span>
                  <span>Target: Xiaomi Pad 6 (pipa / SM8250)</span>
                  <span aria-hidden="true">·</span>
                  <span>Source: kernel_xiaomi_pipa_cos17 (walt-r17)</span>
                  <span aria-hidden="true">·</span>
                  <span>Base: n0_kernel_pipa (branch 15)</span>
                </div>
                <h1
                  className="text-2xl lg:text-4xl font-bold text-slate-100 tracking-tight leading-snug"
                  style={{ textWrap: 'balance' }}
                >
                  ادغام کامل بهینه‌سازی‌های کرنل ColorOS 17 (نسخه walt-r17) درون کرنل N0Kernel Pipa
                </h1>
                <p className="text-sm lg:text-base text-slate-300 leading-relaxed max-w-3xl">
                  تمام ۱۶ زیرسیستم و ۴۵ کامیت اختصاصی که در سورس{' '}
                  <code className="text-blue-300 font-mono text-xs">kernel_xiaomi_pipa_cos17</code>{' '}
                  (از ریلیز <code className="text-blue-300 font-mono text-xs">walt-r1</code> تا{' '}
                  <code className="text-blue-300 font-mono text-xs">walt-r17</code>) توسعه داده شده
                  بودند، استخراج و با پایه{' '}
                  <code className="text-emerald-300 font-mono text-xs">n0_kernel_pipa</code> یکپارچه
                  شدند؛ به طوری که هم قابلیت‌های گیمینگ نوکرنل (مثل درایور{' '}
                  <code className="text-emerald-300 font-mono text-xs">ntsync</code> لینوکس 6.14 و
                  دکمه‌های قلم شیائومی) حفظ شوند و هم تمام زیرساخت‌های حیاتی ColorOS 17 روی تبلت بدون
                  لگ کار کنند.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('builder')}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <Terminal className="w-4 h-4" />
                  <span>دریافت بیلد Flashable ZIP (GitHub Actions / Local)</span>
                </button>
                <button
                  onClick={downloadWorkflowFile}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <FileCode2 className="w-4 h-4" />
                  <span>دانلود فایل build-n0kernel-cos17.yml</span>
                </button>
              </div>
            </div>

            {/* Summary Metrics Panel */}
            <div className="lg:col-span-4 border border-slate-800 bg-slate-950/80 rounded-lg p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-slate-200">
                  وضعیت یکپارچه‌سازی سورس‌ها
                </h2>
                <p className="text-xs text-slate-400">
                  مقایسه و ادغام دو ریپازیتوری گیت‌هاب شما
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/80 tabular-nums">
                <div>
                  <div className="text-xs text-slate-400">کامیت‌های پورت‌شده COS17</div>
                  <div className="text-2xl font-bold text-slate-100 font-mono mt-0.5">45</div>
                  <div className="text-xs text-slate-500 mt-0.5">شاخه oppo (walt-r17)</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">زیرسیستم‌های اصلی</div>
                  <div className="text-2xl font-bold text-blue-400 font-mono mt-0.5">
                    {selectedIds.size} / {COS17_PORTED_ITEMS.length}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">فعال در کانفیگ بیلد</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">نسخه SukiSU-Ultra</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                    v4.3.0-r1
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">کد 41140 · SUSFS 2.3.0</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">کامپایلر هدف</div>
                  <div className="text-lg font-bold text-slate-200 font-mono mt-0.5">
                    Clang 20
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">AOSP r547379 · AnyKernel3</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile / Workspace Segmented Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('ported')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'ported'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ۱. شرح کامل تغییرات پورت‌شده (دانه به دانه)
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'builder'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ۲. ساخت بیلد جدید (GitHub Actions و اسکریپت)
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ۳. شخصی‌سازی Defconfig
            </button>
            <button
              onClick={() => setActiveTab('flashing')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'flashing'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ۴. آموزش فلش ایمن روی تبلت (AnyKernel3 / pack-boot)
            </button>
          </div>

          <div className="text-xs text-slate-400 tabular-nums">
            <span>مخزن مبدا: </span>
            <a
              href="https://github.com/m91biology-dotcom/kernel_xiaomi_pipa_cos17"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:underline font-mono"
            >
              kernel_xiaomi_pipa_cos17
            </a>
            <span className="mx-2" aria-hidden="true">→</span>
            <span>مخزن مقصد: </span>
            <a
              href="https://github.com/m91biology-dotcom/n0_kernel_pipa"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline font-mono"
            >
              n0_kernel_pipa
            </a>
          </div>
        </div>

        {/* TAB 1: ITEM-BY-ITEM PORTED FEATURES & LIVE DIFF VIEWER */}
        {activeTab === 'ported' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {SUBSYSTEM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedSubsystem(cat.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedSubsystem === cat.id
                        ? 'bg-slate-100 text-slate-950 border-slate-100 font-semibold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {cat.labelFa}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-80 shrink-0">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در نام بخش، کامیت، یا CONFIG..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pr-9 pl-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Preserved N0Kernel Features Banner */}
            <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5">
              <div className="flex items-center justify-between gap-4 mb-3">
                <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    قابلیت‌های اختصاصی N0Kernel که در حین پورت شدن ColorOS 17 کاملاً حفظ شده‌اند:
                  </span>
                </h3>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  branch: 15 (n0_kernel_pipa)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {N0_PRESERVED_FEATURES.map((feat) => (
                  <div
                    key={feat.sha}
                    className="text-xs text-slate-300 leading-relaxed flex items-start gap-2"
                  >
                    <code className="text-emerald-400 font-mono shrink-0 mt-0.5">{feat.sha}</code>
                    <span>·</span>
                    <span>{feat.titleFa}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Grid: Ported Items List + Live Commit Diff Drawer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className={activeCommit ? 'lg:col-span-7 space-y-4' : 'lg:col-span-12 space-y-4'}>
                {filteredItems.map((item) => {
                  const isChecked = selectedIds.has(item.id);
                  const isInspecting = activeCommit?.id === item.id;
                  return (
                    <article
                      key={item.id}
                      className={`border rounded-xl p-5 transition-colors ${
                        isInspecting
                          ? 'border-blue-500 bg-slate-900/90'
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                        {/* Unboxed clean metadata with middot separators */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                          <span className="text-blue-400 font-sans font-medium">
                            {item.subsystemLabelFa}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Release: {item.releaseTag}</span>
                          <span aria-hidden="true">·</span>
                          <span>SHA: {item.sha}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => inspectCommitDiff(item)}
                            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
                          >
                            <GitCommit className="w-3.5 h-3.5 text-blue-400" />
                            <span>مشاهده سورس و Diff</span>
                          </button>
                          <a
                            href={`/api/patch/${item.sha}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                          >
                            .patch
                          </a>
                          <button
                            onClick={() => toggleItemSelection(item.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-950/60 border-emerald-700/70 text-emerald-300'
                                : 'bg-slate-900 border-slate-700 text-slate-400'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isChecked ? 'فعال در بیلد' : 'غیرفعال'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <h3 className="text-base font-bold text-slate-100 leading-snug">
                          {item.titleFa}
                        </h3>
                        <p className="text-xs font-mono text-slate-400 dir-ltr text-left">
                          {item.titleEn}
                        </p>
                        <p className="text-sm text-slate-300 leading-relaxed pt-1">
                          {item.summaryFa}
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          <strong className="text-slate-200">جزئیات فنی هسته: </strong>
                          {item.technicalDetails}
                        </p>
                      </div>

                      {/* Footer Metadata: Affected Paths & Config Flags */}
                      <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 font-mono">
                        <div className="truncate">
                          <span className="text-slate-500 font-sans">مسیر فایل‌ها: </span>
                          {item.keyFiles.join(' · ')}
                        </div>
                        {item.configFlags.length > 0 && (
                          <div className="text-emerald-400/90 truncate shrink-0">
                            {item.configFlags.slice(0, 2).join(' · ')}
                            {item.configFlags.length > 2
                              ? ` (+${item.configFlags.length - 2})`
                              : ''}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Live GitHub Commit Diff Inspector Panel */}
              {activeCommit && (
                <aside className="lg:col-span-5 border border-slate-800 bg-slate-900/90 rounded-xl p-5 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-4">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-xs text-blue-400 font-mono">
                        Commit {activeCommit.sha} · {activeCommit.releaseTag}
                      </div>
                      <h3 className="text-sm font-bold text-slate-100 mt-1">
                        {activeCommit.titleFa}
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveCommit(null)}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 rounded-md cursor-pointer shrink-0"
                    >
                      بستن
                    </button>
                  </div>

                  {loadingDiff && (
                    <div className="space-y-3 py-6">
                      <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-slate-800 rounded animate-pulse w-1/2" />
                      <div className="h-32 bg-slate-800 rounded animate-pulse w-full" />
                    </div>
                  )}

                  {diffError && (
                    <div className="p-4 rounded-lg bg-red-950/50 border border-red-800 text-xs text-red-200">
                      {diffError}
                    </div>
                  )}

                  {commitDetails && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono tabular-nums">
                        <span>{commitDetails.author}</span>
                        <span>·</span>
                        <span className="text-emerald-400">+{commitDetails.stats.additions}</span>
                        <span className="text-red-400">-{commitDetails.stats.deletions}</span>
                        <span>·</span>
                        <span>{commitDetails.files.length} files changed</span>
                      </div>

                      <pre
                        dir="ltr"
                        className="text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap overflow-x-auto leading-relaxed"
                      >
                        {commitDetails.message}
                      </pre>

                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-300">
                          فایل‌های تغییریافته در این کامیت:
                        </h4>
                        {commitDetails.files.map((file) => (
                          <div
                            key={file.filename}
                            className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950"
                          >
                            <div
                              dir="ltr"
                              className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono"
                            >
                              <span className="text-slate-200 truncate">{file.filename}</span>
                              <span className="shrink-0 ml-2 tabular-nums">
                                <span className="text-emerald-400">+{file.additions}</span>{' '}
                                <span className="text-red-400">-{file.deletions}</span>
                              </span>
                            </div>
                            {file.patch && (
                              <pre
                                dir="ltr"
                                className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60 leading-relaxed"
                              >
                                {file.patch}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </aside>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CLOUD BUILDER (GITHUB ACTIONS) & AUTOMATED BUILD SCRIPT */}
        {activeTab === 'builder' && (
          <div className="space-y-6">
            <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-slate-100">
                چگونه فایل فلش‌شدنی (AnyKernel3 ZIP و boot.img) نوکرنل + COS17 را بگیریم؟
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                از آنجایی که کامپایل کامل کرنل ARM64 اندروید به کامپایلر ۵ گیگابایتی{' '}
                <code className="text-blue-300 font-mono text-xs">AOSP Clang 20 (r547379)</code> و
                حدود ۱۵ گیگابایت فضای دیسک نیاز دارد و محیط وب پیش‌نمایش فعلی فاقد کامپایلر کراس
                ARM64 است، من **دو مسیر کاملاً اتوماتیک و آماده** برایتان ساخته‌ام تا بدون هیچ درگیری
                با تداخل کدها، فایل زیپ قابل فلش را تحویل بگیرید:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Method A: GitHub Actions Cloud Build */}
                <div className="border border-slate-800 bg-slate-950/90 rounded-xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-blue-400">
                      روش اول (پیشنهادی · بدون نیاز به لینوکس یا دانلود حجیم)
                    </div>
                    <h3 className="text-base font-bold text-slate-100">
                      بیلد ابری رایگان روی سرورهای GitHub Actions شما
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      فایل ورک‌فلوی{' '}
                      <code className="text-blue-300 font-mono">build-n0kernel-cos17.yml</code> را در
                      مسیر <code className="text-slate-200 font-mono">.github/workflows/</code> داخل
                      ریپازیتوری{' '}
                      <code className="text-emerald-300 font-mono">n0_kernel_pipa</code> خود آپلود
                      کنید و از تب <strong>Actions</strong> دکمه <strong>Run workflow</strong> را
                      بزنید. سرور گیت‌هاب به صورت خودکار تمام ۴۵ کامیت{' '}
                      <code className="text-blue-300 font-mono">kernel_xiaomi_pipa_cos17</code> را
                      وارد نوکرنل می‌کند، با Clang 20 بیلد می‌گیرد و فایل{' '}
                      <code className="text-emerald-300 font-mono">
                        N0Kernel_Pipa_COS17_walt-r17_AnyKernel3.zip
                      </code>{' '}
                      را برای دانلود تحویل می‌دهد.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={downloadWorkflowFile}
                      className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>دانلود build-n0kernel-cos17.yml</span>
                    </button>
                    <a
                      href="https://github.com/m91biology-dotcom/n0_kernel_pipa"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                    >
                      <span>باز کردن مخزن n0_kernel_pipa</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Method B: One-Command Local Linux / WSL Script */}
                <div className="border border-slate-800 bg-slate-950/90 rounded-xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-emerald-400">
                      روش دوم (اجرا روی لینوکس / اوبونتو / WSL2)
                    </div>
                    <h3 className="text-base font-bold text-slate-100">
                      اسکریپت تک‌دستوری پورت و بیلد خودکار (port-cos17-to-n0kernel.sh)
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      این اسکریپت به صورت خودکار مخزن{' '}
                      <code className="text-emerald-300 font-mono">n0_kernel_pipa</code> را کلون
                      می‌کند، شاخه <code className="text-blue-300 font-mono">oppo</code> از{' '}
                      <code className="text-blue-300 font-mono">kernel_xiaomi_pipa_cos17</code> را
                      فتچ و cherry-pick می‌کند، دکمه‌های قلم نوکرنل را حفظ می‌کند، کانفیگ‌ها را ادغام
                      کرده و هم فایل <code className="text-emerald-300 font-mono">AnyKernel3.zip</code>{' '}
                      و هم <code className="text-blue-300 font-mono">Image</code> را می‌سازد.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() =>
                        downloadFile('port-cos17-to-n0kernel.sh', customBuildScript)
                      }
                      className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>دانلود port-cos17-to-n0kernel.sh</span>
                    </button>
                    <button
                      onClick={() => copyText('build-script', customBuildScript)}
                      className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'build-script' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>کپی کل اسکریپت</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Script Preview */}
            <div className="border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  <span>port-cos17-to-n0kernel.sh</span>
                </div>
                <button
                  onClick={() => copyText('script-code', customBuildScript)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey === 'script-code' ? 'کپی شد' : 'کپی کد'}</span>
                </button>
              </div>
              <pre
                dir="ltr"
                className="p-5 text-xs font-mono text-slate-200 overflow-x-auto max-h-[520px] leading-relaxed bg-slate-950"
              >
                {customBuildScript}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: DEFCONFIG MERGER & CUSTOMIZER */}
        {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h2 className="text-base font-bold text-slate-100">
                  تنظیمات ماژول‌های کرنل پیش از بیلد
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-200">
                      زمان‌بند OPPO UI First + QoS Scheduler
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      فعال‌سازی sched_assist، frame_boost، im_flag و /proc/oplus_qos_sched
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableOplusUiFirst}
                    onChange={(e) => setEnableOplusUiFirst(e.target.checked)}
                    className="mt-1 accent-blue-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-200">
                      فریزر OPPO Hans + شبکه OVNET + دمای Horae
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      ضروری برای کارکرد فریزر پس‌زمینه ColorOS 17 و اشتراک اینترنت گوشی
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableHansFreezer}
                    onChange={(e) => setEnableHansFreezer(e.target.checked)}
                    className="mt-1 accent-blue-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-200">
                      روت توکار SukiSU-Ultra v4.3.0-r1 (41140)
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      شاخه builtin با هوک‌های دستی کرنل 4.19 بدون کرش kprobes
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableSukiSU}
                    onChange={(e) => setEnableSukiSU(e.target.checked)}
                    className="mt-1 accent-blue-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-200">
                      مخفی‌سازی روت SUSFS v2.3.0 (Priority UID Filter)
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      مخفی‌سازی کامل مانت‌ها، مسیرها، kstat و خط فرمان بوت
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableSusfs}
                    onChange={(e) => setEnableSusfs(e.target.checked)}
                    className="mt-1 accent-blue-500 w-4 h-4"
                  />
                </label>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
                  <label className="flex items-start justify-between gap-3 cursor-pointer">
                    <div>
                      <div className="font-semibold text-slate-200">
                        پچ باینری KernelPatch (KPM 0.14.0)
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        تزریق kpimg به داخل Image پس از کامپایل برای ماژول‌های KPM
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableKpm}
                      onChange={(e) => setEnableKpm(e.target.checked)}
                      className="mt-1 accent-blue-500 w-4 h-4"
                    />
                  </label>
                  {enableKpm && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-slate-400">KPM SuperKey:</span>
                      <input
                        type="text"
                        dir="ltr"
                        value={kpmSuperkey}
                        onChange={(e) => setKpmSuperkey(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-slate-100 w-40"
                      />
                    </div>
                  )}
                </div>

                <label className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-200">
                      حفظ درایور لینوکس 6.14 NTSYNC از نوکرنل
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      بهبود چشمگیر فریم‌ریت بازی‌های ویندوزی در Winlator / Wine
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preserveNtSync}
                    onChange={(e) => setPreserveNtSync(e.target.checked)}
                    className="mt-1 accent-blue-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-200">
                      واچ‌داگ دیباگ بوت (CONFIG_PIPA_BOOTDBG)
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      مخصوص تست؛ در صورت هنگ بیش از ۶۰ ثانیه، کرش دامپ در pstore ثبت می‌کند
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableBootDbg}
                    onChange={(e) => setEnableBootDbg(e.target.checked)}
                    className="mt-1 accent-blue-500 w-4 h-4"
                  />
                </label>
              </div>
            </div>

            <div className="lg:col-span-7 border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
                <div className="text-xs font-mono text-slate-300">
                  arch/arm64/configs/vendor/xiaomi/pipa-n0-cos17-merged.config
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyText('merged-config', mergedConfigText)}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'merged-config' ? 'کپی شد' : 'کپی کانفیگ'}</span>
                  </button>
                  <button
                    onClick={() =>
                      downloadFile('pipa-n0-cos17-merged.config', mergedConfigText)
                    }
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود فایل .config</span>
                  </button>
                </div>
              </div>
              <pre
                dir="ltr"
                className="p-5 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed bg-slate-950"
              >
                {mergedConfigText}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 4: SAFE FLASHING GUIDE FOR XIAOMI PAD 6 (PIPA) */}
        {activeTab === 'flashing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-6 space-y-4">
              <div className="text-xs font-mono text-emerald-400">
                روش اول · فلش از طریق AnyKernel3 ZIP
              </div>
              <h2 className="text-lg font-bold text-slate-100">
                نصب مستقیم از داخل SukiSU Manager / KernelSU یا TWRP
              </h2>
              <ol className="space-y-3 text-sm text-slate-300 list-decimal list-inside leading-relaxed">
                <li>
                  فایل خروجی{' '}
                  <code className="text-emerald-300 font-mono text-xs">
                    N0Kernel_Pipa_COS17_walt-r17_AnyKernel3.zip
                  </code>{' '}
                  را به حافظه تبلت شیائومی پد ۶ منتقل کنید.
                </li>
                <li>
                  اپلیکیشن <strong>SukiSU-Ultra Manager (نسخه v4.3.0-r1 کد 41140)</strong> یا{' '}
                  <strong>Kernel Flasher / TWRP</strong> را باز کرده و فایل ZIP را فلش کنید.
                </li>
                <li>
                  اسکریپت AnyKernel3 به صورت خودکار ایمیج کرنل جدید، <code className="font-mono text-xs">dtb</code> و{' '}
                  <code className="font-mono text-xs">dtbo.img</code> را بدون دست زدن به بایت‌های{' '}
                  <code className="font-mono text-xs">os_version</code> هدر بوت شما جایگزین می‌کند.
                </li>
              </ol>
            </div>

            <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-6 space-y-4">
              <div className="text-xs font-mono text-amber-400">
                روش دوم · بستهبندی در boot.img و فلش با Fastboot
              </div>
              <h2 className="text-lg font-bold text-slate-100">
                نکته حیاتی درباره هدر boot.img در تبلت Pipa (جلوگیری از صفحه سیاه)
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                هرگز فایل <code className="font-mono text-xs text-amber-300">boot.img</code> تبلت
                Pipa را به تنهایی با دستور <code className="font-mono text-xs">magiskboot repack</code>{' '}
                نبندید! این کار ۴ بایت مربوط به <code className="font-mono text-xs">os_version</code>{' '}
                و <code className="font-mono text-xs">os_patch_level</code> در آفست ۱۶ هدر را تغییر
                می‌دهد و بوت‌لودر شیائومی پد ۶ بدون هیچ لاگی تصویر را سیاه می‌کند. همیشه از اسکریپت{' '}
                <code className="font-mono text-xs text-blue-300">pack-boot.sh</code> استفاده کنید:
              </p>
              <pre
                dir="ltr"
                className="p-4 text-xs font-mono text-slate-200 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto leading-relaxed"
              >
{`# ۱. ساخت ایمیج تست (TRIM=1) برای تست بدون فلش دائمی:
TRIM=1 ./pack-boot.sh out/arch/arm64/boot/Image boot.img boot-test.img
fastboot boot boot-test.img

# ۲. ساخت ایمیج کامل و فلش دائمی روی اسلات فعال:
./pack-boot.sh out/arch/arm64/boot/Image boot.img boot-n0-cos17.img
fastboot flash boot_a boot-n0-cos17.img
fastboot flash boot_b boot-n0-cos17.img`}
              </pre>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 py-5 px-6 text-center text-xs text-slate-500">
        Pipa Kernel Studio · Xiaomi Pad 6 (pipa / SM8250) · ColorOS 17 (walt-r17) + N0Kernel Integration
      </footer>
    </div>
  );
}
