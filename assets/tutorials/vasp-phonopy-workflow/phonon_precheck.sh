#!/bin/bash
#BSUB -q intel768
#BSUB -n 48
#BSUB -e precheck-%J.err
#BSUB -o precheck-%J.out
#BSUB -J phonon-precheck
#BSUB -R "span[ptile=48]"
#BSUB -R "select[hname!='r13n18']"

# 用法：
#   1. 确认主目录中已有 POSCAR-001、INCAR-st、KPOINTS_phonon 和 POTCAR。
#   2. 提交：bsub < phonon_precheck.sh
#   3. 默认检查 POSCAR-001。如需其他编号，可在提交前修改 DISP_ID。

set -o pipefail

DISP_ID="${DISP_ID:-001}"
VASP_BIN_DIR="/work/wangr/dxy/software/dmft/dmft/vasp/vasp.5.4.4-allbak/bin"

if [ -z "${LS_SUBCWD:-}" ] || [ -z "${LSB_DJOB_HOSTFILE:-}" ]; then
    echo "ERROR: This script must be submitted through LSF with bsub." >&2
    exit 2
fi

cd "$LS_SUBCWD" || exit 2

for input_file in INCAR-st KPOINTS_phonon POTCAR; do
    if [ ! -s "$input_file" ]; then
        echo "ERROR: Missing or empty input file: $input_file" >&2
        exit 2
    fi
done

if [ -s "POSCAR-${DISP_ID}" ]; then
    DISP_POSCAR="POSCAR-${DISP_ID}"
elif [ -s "disp-${DISP_ID}/POSCAR" ]; then
    DISP_POSCAR="disp-${DISP_ID}/POSCAR"
else
    echo "ERROR: Neither POSCAR-${DISP_ID} nor disp-${DISP_ID}/POSCAR exists." >&2
    exit 2
fi

PRECHECK_DIR="precheck-${DISP_ID}"
if [ -e "$PRECHECK_DIR" ]; then
    echo "ERROR: $PRECHECK_DIR already exists." >&2
    echo "Rename the old directory before rerunning, so results are not mixed." >&2
    exit 2
fi

mkdir "$PRECHECK_DIR" || exit 2
cp "$DISP_POSCAR" "$PRECHECK_DIR/POSCAR"
cp INCAR-st "$PRECHECK_DIR/INCAR"
cp KPOINTS_phonon "$PRECHECK_DIR/KPOINTS"
cp POTCAR "$PRECHECK_DIR/POTCAR"

cd "$PRECHECK_DIR" || exit 2

echo "===== Actual INCAR used by precheck ====="
grep -Ei "^[[:space:]]*(ALGO|IALGO|EDIFF|NELM|IBRION|NSW|LREAL|ENCUT)[[:space:]]*=" INCAR || true
echo "===== Actual KPOINTS used by precheck ====="
sed -n '1,8p' KPOINTS

if grep -Eqi "^[[:space:]]*ALGO[[:space:]]*=[[:space:]]*(Fast|VeryFast)" INCAR; then
    echo "ERROR: ALGO=Fast/VeryFast is not accepted for this precheck." >&2
    exit 2
fi

if grep -Eqi "^[[:space:]]*IALGO[[:space:]]*=[[:space:]]*48" INCAR; then
    echo "ERROR: IALGO=48 enables RMM-DIIS and is not accepted here." >&2
    exit 2
fi

if ! grep -Eqi "^[[:space:]]*ALGO[[:space:]]*=[[:space:]]*Normal" INCAR; then
    echo "ERROR: INCAR must explicitly contain ALGO=Normal." >&2
    exit 2
fi

source /work/software/intel/bin/compilervars.sh -arch intel64 -platform linux
export PATH="$VASP_BIN_DIR:$PATH"

NP=$(wc -l < "$LSB_DJOB_HOSTFILE")
echo "Running VASP precheck on $NP cores"

mpiexec.hydra -machinefile "$LSB_DJOB_HOSTFILE" -np "$NP" vasp_std > log 2>&1
vasp_status=$?

if [ "$vasp_status" -ne 0 ]; then
    echo "PRECHECK FAILED: VASP exit code is $vasp_status." >&2
    exit 1
fi

bad_pattern='ZHEGV|EDDRMM|BRMIX|ZBRENT|DAV: Sub-Space|ERROR|FATAL|NaN|killed|segmentation'
if grep -Ein "$bad_pattern" log OUTCAR > precheck-errors.txt 2>/dev/null; then
    echo "PRECHECK FAILED: Error or severe warning found." >&2
    cat precheck-errors.txt >&2
    exit 1
fi

if ! grep -q "General timing and accounting" OUTCAR 2>/dev/null; then
    echo "PRECHECK FAILED: OUTCAR does not contain the normal completion marker." >&2
    exit 1
fi

if ! grep -q "F=" OSZICAR 2>/dev/null; then
    echo "PRECHECK FAILED: OSZICAR does not contain the final F= line." >&2
    exit 1
fi

if ! grep -q "TOTAL-FORCE" OUTCAR 2>/dev/null; then
    echo "PRECHECK FAILED: OUTCAR does not contain TOTAL-FORCE." >&2
    exit 1
fi

if [ ! -s vasprun.xml ]; then
    echo "PRECHECK FAILED: vasprun.xml is missing or empty." >&2
    exit 1
fi

if ! tail -n 20 vasprun.xml | grep -q "</modeling>"; then
    echo "PRECHECK FAILED: vasprun.xml is incomplete." >&2
    exit 1
fi

echo "===== Final electronic and force summary ====="
tail -n 5 OSZICAR
grep "total drift" OUTCAR | tail -1 || true
echo "PRECHECK PASSED: This input set is ready for batch displacement calculations."
