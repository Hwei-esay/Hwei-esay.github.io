#!/bin/bash

# 在包含 disp-001、disp-002……的声子计算主目录中运行：
#   bash check_phonon_disps.sh
#
# 退出码：
#   0 = 所有找到的 disp-* 目录均通过基本检查
#   1 = 至少一个目录失败或未完成
#   2 = 没有找到 disp-* 目录

set -o pipefail

bad_pattern='ZHEGV|EDDRMM|BRMIX|ZBRENT|DAV: Sub-Space|ERROR|FATAL|NaN|killed|segmentation'
found=0
failed=0
passed=0

for disp_dir in disp-[0-9][0-9][0-9]; do
    [ -d "$disp_dir" ] || continue
    found=$((found + 1))
    status="OK"
    reason=""

    if [ ! -s "$disp_dir/OUTCAR" ]; then
        status="INCOMPLETE"
        reason="OUTCAR missing"
    elif grep -Eqi "$bad_pattern" "$disp_dir/log" "$disp_dir/OUTCAR" 2>/dev/null; then
        status="FAILED"
        reason="severe warning or error found"
    elif ! grep -q "General timing and accounting" "$disp_dir/OUTCAR"; then
        status="INCOMPLETE"
        reason="normal completion marker missing"
    elif [ ! -s "$disp_dir/OSZICAR" ] || ! grep -q "F=" "$disp_dir/OSZICAR"; then
        status="INCOMPLETE"
        reason="final F= line missing"
    elif ! grep -q "TOTAL-FORCE" "$disp_dir/OUTCAR"; then
        status="INCOMPLETE"
        reason="TOTAL-FORCE missing"
    elif [ ! -s "$disp_dir/vasprun.xml" ]; then
        status="INCOMPLETE"
        reason="vasprun.xml missing"
    elif ! tail -n 20 "$disp_dir/vasprun.xml" | grep -q "</modeling>"; then
        status="INCOMPLETE"
        reason="vasprun.xml incomplete"
    fi

    if [ "$status" = "OK" ]; then
        passed=$((passed + 1))
        printf 'OK          %s\n' "$disp_dir"
    else
        failed=$((failed + 1))
        printf '%-11s %s  %s\n' "$status" "$disp_dir" "$reason"
    fi
done

if [ "$found" -eq 0 ]; then
    echo "ERROR: No disp-NNN directories found." >&2
    exit 2
fi

echo
echo "Summary: total=$found passed=$passed failed_or_incomplete=$failed"

if [ "$failed" -ne 0 ]; then
    exit 1
fi

exit 0
