#!/bin/bash
# ==============================================================================
# Verified Port & Build Script: ColorOS 17 (walt-r17) + N0Kernel Pipa
# COS17 Repo  : https://github.com/m91biology-dotcom/kernel_xiaomi_pipa_cos17 (branch: oppo)
# N0 Repo     : https://github.com/m91biology-dotcom/n0_kernel_pipa (branch: 15)
# Device      : Xiaomi Pad 6 (pipa / SM8250)
# ==============================================================================
set -euo pipefail

WORKDIR="${WORKDIR:-$(pwd)/n0_kernel_pipa_cos17_build}"
CLANG_DIR="${CLANG:-$HOME/tc}"

echo "[1/6] Cloning ColorOS 17 walt-r17 kernel base (Linux 4.19.325-cip136 + OPPO UI First + SukiSU 41140)..."
if [ ! -d "$WORKDIR/.git" ]; then
  git clone --depth 1 -b oppo https://github.com/m91biology-dotcom/kernel_xiaomi_pipa_cos17.git "$WORKDIR"
fi
cd "$WORKDIR"

echo "[2/6] Fetching N0Kernel Pipa (branch 15) commits..."
git remote remove n0 2>/dev/null || true
git remote add n0 https://github.com/m91biology-dotcom/n0_kernel_pipa.git
git fetch --depth=150 n0 15

echo "[3/6] Applying N0Kernel Pipa patches onto COS17 walt-r17..."
for c in 0e073b43 99ea7f3b 1db01b28 555db11b 14d4197f 69d69817 735b9d06; do
  echo "  -> Applying N0Kernel commit $c..."
  git format-patch -1 --stdout "$c" | git apply --whitespace=nowarn
done

git format-patch -1 --stdout a12268c8 -- \
  drivers/power/supply/qcom/smb5-lib-pipa.c \
  drivers/power/supply/qcom/smb5-lib.c \
  drivers/power/supply/qcom/smb-lib.c | git apply --whitespace=nowarn

git format-patch -1 --stdout a526c765 -- arch/arm64/boot/dts/vendor/qcom/pipa-sm8250.dtsi | git apply --whitespace=nowarn
git format-patch -1 --stdout f0b0af81 -- arch/arm64/boot/dts/vendor/qcom/kona.dtsi | git apply --whitespace=nowarn

echo "[4/6] Importing Linux 6.14 NTSYNC & USB FastChg from N0Kernel..."
git checkout n0/15 -- \
  drivers/misc/ntsync.c \
  include/uapi/linux/ntsync.h \
  drivers/misc/fastchg.c \
  include/linux/fastchg.h

git checkout HEAD -- drivers/staging/qca-wifi-host-cmn/qdf/src/qdf_parse.c

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
  echo 'obj-$(CONFIG_FORCE_FAST_CHARGE) += fastchg.o' >> drivers/misc/Makefile
fi
if ! grep -q "CONFIG_NTSYNC" drivers/misc/Makefile; then
  echo 'obj-$(CONFIG_NTSYNC) += ntsync.o' >> drivers/misc/Makefile
fi

python3 -c '
p = "drivers/misc/Kconfig"
s = open(p).read()
add = """
config FORCE_FAST_CHARGE
\tbool "Force faster charge rate for USB"
\tdefault y
\thelp
\t  This allows users to override default charge rate for USB.

config NTSYNC
\ttristate "NT synchronization primitive driver"
\tdefault y
\thelp
\t  This driver provides a kernel implementation of Windows NT synchronization primitives.
"""
if "config NTSYNC" not in s:
    idx = s.rfind("endmenu")
    s = s[:idx] + add + "\n" + s[idx:]
    open(p, "w").write(s)
'

echo "[5/6] Setting up AOSP Clang 20 (r547379) & Compiling..."
if [ ! -d "$CLANG_DIR/bin" ]; then
  mkdir -p "$CLANG_DIR"
  curl -sL "https://android.googlesource.com/platform/prebuilts/clang/host/linux-x86/+archive/refs/heads/main/clang-r547379.tar.gz" | tar -xz -C "$CLANG_DIR"
fi
export PATH="$CLANG_DIR/bin:$PATH"

OUT=out
rm -rf "$OUT"
mkdir -p "$OUT"

A=(
  ARCH=arm64 O="$OUT" CC=clang LLVM=1 LLVM_IAS=1
  CROSS_COMPILE=aarch64-linux-gnu- CROSS_COMPILE_COMPAT=arm-linux-gnueabi-
  AR=llvm-ar NM=llvm-nm OBJCOPY=llvm-objcopy OBJDUMP=llvm-objdump STRIP=llvm-strip
)

C=arch/arm64/configs/vendor
F=(
  "$C/kona-perf_defconfig"
  "$C/xiaomi/sm8250-common.config"
  "$C/xiaomi/pipa.config"
  "$C/xiaomi/pipa-cos17.config"
  "$C/xiaomi/pipa-oplus.config"
)

ARCH=arm64 LLVM=1 scripts/kconfig/merge_config.sh -m -O "$OUT" "${F[@]}"

scripts/config --file "$OUT/.config" \
  -e KSU -e KSU_SUSFS -e KSU_SUSFS_SUS_PATH -e KSU_SUSFS_SUS_MOUNT \
  -e KSU_SUSFS_SUS_KSTAT -e KSU_SUSFS_SPOOF_UNAME -e KSU_SUSFS_ENABLE_LOG \
  -e KSU_SUSFS_HIDE_KSU_SUSFS_SYMBOLS -e KSU_SUSFS_SPOOF_CMDLINE_OR_BOOTCONFIG \
  -e KSU_SUSFS_OPEN_REDIRECT -e KSU_SUSFS_SUS_MAP \
  -e NTSYNC -e FORCE_FAST_CHARGE -e IOSCHED_MAPLE \
  -e VMAP_STACK -e STACKPROTECTOR_STRONG -e RSEQ \
  -d QCOM_DCC_V2 -d ESOC -d ESOC_DEV -d ESOC_CLIENT -d ESOC_MDM_4x -d CC_WERROR

make "${A[@]}" olddefconfig
make "${A[@]}" -j"$(nproc --all)"

if [ ! -f "$OUT/arch/arm64/boot/dtb" ]; then
  find "$OUT/arch/arm64/boot/dts" -name "*.dtb" -exec cat {} + > "$OUT/arch/arm64/boot/dtb"
fi

echo "[6/6] Packaging Flashable AnyKernel3 ZIP..."
rm -rf anykernel
git clone https://github.com/CuriousNom/AnyKernel3 -b pipa-n0 --single-branch --depth=1 anykernel
rm -rf anykernel/kernels/
mkdir -p anykernel/kernels/
cp "$OUT/arch/arm64/boot/Image" anykernel/kernels/
cp "$OUT/arch/arm64/boot/dtb" anykernel/kernels/
cp "$OUT/arch/arm64/boot/dtbo.img" anykernel/kernels/
(
  cd anykernel
  zip -r9 ../N0Kernel_Pipa_COS17_walt-r17_AnyKernel3.zip ./* -x .git .gitignore out/ ./*.zip
)
echo "BUILD COMPLETE: $WORKDIR/N0Kernel_Pipa_COS17_walt-r17_AnyKernel3.zip"
