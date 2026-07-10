#!/bin/bash
#BSUB -q only-60-min   #  sr850 sr860-768 sr860-1536
#BSUB -n 40
#BSUB -e %J.err
#BSUB -o %J.out
#BSUB -J zyh
#BSUB -R "span[ptile=40]"
#BSUB -R "select[hname!='r13n18']"
hostfile=`echo $LSB_DJOB_HOSTFILE`
NP=`cat $hostfile | wc -l`
cd $LS_SUBCWD
#-------------intelmpi+ifort------------------------------------------
source /work/software/intel/bin/compilervars.sh -arch intel64 -platform linux
#---------------------------------------------------------------------

run_command_Std="mpiexec.hydra -machinefile $LSB_DJOB_HOSTFILE -np $NP /work/software/vasp/5.4.4/vasp_std"
run_command_SOC="mpiexec.hydra -machinefile $LSB_DJOB_HOSTFILE -np $NP /work/software/vasp/5.4.4/vasp_ncl"
#---------------------------------------------------------------------
run_command_opt_Std="mpiexec.hydra -machinefile $LSB_DJOB_HOSTFILE -np $NP /work/software/vasp/5.4.4/contrcell/vasp_std"
run_command_opt_SOC="mpiexec.hydra -machinefile $LSB_DJOB_HOSTFILE -np $NP /work/software/vasp/5.4.4/contrcell/vasp_ncl"
#---------------------------------------------------------------------

############################
## Start Setting ###########
############################

Dir_AutoVASP='/work/wangr/AutoVASP1.2/'

system=heterstructure

##############################################
## Setting structure optimization parmeters ##
##############################################

# switch for structure optimization
Opt=0

Opt_contr=0

Opt_soc=0

kmesh_opt=(7 2 1)

Encut_opt=400 # Set Encut by yourself or Encut_scf="Auto"

Sigma_opt=0.05

#######################################
## Setting SCF calculation parmeters ##
#######################################

# switch for scf calculation( Scf could not be 0 )
Scf=1

Spin=0 # Set Spin=1 will switch off CBM&VBM calculation and orbits projected analysis

SOC=0

kmesh_scf=(7 2 1)

Encut_scf=400 # Set Encut by yourself or Encut_scf="Auto"

Sigma_scf=0.05

NBANDS=400

npar=4

########################################
## Setting LDAU calculation parmeters ##
########################################

# switch for LDAU calculation
LDAU=0

LDAUL=(0 0 1)

LDAUU=(0 0 0 2.5)

##########################################
## Setting NONSCF calculation parmeters ##
##########################################

# switch for nonscf calculation
Nonscf=1

Auto_K_nonscf=0

Dimension=3

if [ $Nonscf -eq 1 -a $Auto_K_nonscf -eq 0 ];then

cat > High_sym_points <<!
0.0  0.0  0.0 ! G
0.5  0.0  0.0 ! X
0.5  0.5  0.0 ! M
0.0  0.0  0.0 ! G
0.0  0.5  0.0 ! Y
0.5  0.5  0.0 ! M
!

fi

nk_insert=100

Energy_range=(-5.0 5.0)

CBM_VBM=1 # switch for CBN&VBM calculation

# Orbit projected modle : off(0) / 1(single graph) / 2(multiple graphs)

Orbit_pro=2

ions=(0) # all ions : ions=(0)

orbits=(1) # s=1; py=2; pz=3; px=4; dxy=5; dyz=6; dz2=7; dxz=8; dx2-y2=9

pointsize=4 # range from 1 to 10

############################
## End Setting #############
############################

## Initialization ##

#Generating POTCAR according to the POSCAR

if [ ! -f POTCAR ];then

${Dir_AutoVASP}/bin/Potcar.sh ${Dir_AutoVASP}

fi

source ${Dir_AutoVASP}/bin/Initial.sh

#---------------------------------------------------------------------------------#
#------------------------ Making INCAR files by yourself -------------------------#
#---------------------------------------------------------------------------------#

cat > INCAR_opt <<!
SYSTEM =  $system
ISPIN  = $ISPIN
ENCUT  = $Encut_opt
EDIFF  = 1e-06 ; EDIFFG = -1e-02
ISMEAR = 0 ; SIGMA  = $Sigma_opt
#ISYM   = 0
NPAR   = $npar
ISTART  = 0 ; ICHARG  = 2
IBRION  = 2 ; NSW     = 400 ; NELM = 200
LCHARG  = F ; LWAVE   = F
LREAL   = F
ALGO    = N
ISIF = 3
#IVDW=11
#VOSKOWN = 1

!

cat > INCAR_scf <<!
SYSTEM =  NaCl
ICHARG = 2
ISTART = 0
ISYM   = 0
ISPIN  = 2 # 这里需要考虑自旋, 但是此时并没有打开自旋轨道耦合
GGA    = PE
#   MAGMOM = 6*0  2*4 2*0

PREC   = Normal
ENCUT  = 500
ALGO   = FAST
EDIFF  = 1E-4
EDIFFG = -0.02
LREAL  = Auto

ISIF   =0
IVDW = 11
NELM   = 500
NELMIN = 5
NSW    = 0

IBRION = -1
ISMEAR = 0
SIGMA  = 0.05
!


cat > INCAR_nonscf <<!
SYSTEM =  NaCl
ICHARG = 11
ISTART = 1
ISYM   = 0
ISPIN  = 2 # 这里需要考虑自旋, 但是此时并没有打开自旋轨道耦合
GGA    = PE
#   MAGMOM = 6*0  2*4 2*0

PREC   = Normal
ENCUT  = 500
ALGO   = FAST
EDIFF  = 1E-4
EDIFFG = -0.02
LREAL  = Auto

ISIF   =0
IVDW = 11
NELM   = 500
NELMIN = 5
NSW    = 0

IBRION = -1
ISMEAR = 0
SIGMA  = 0.05
!

#---------------------------------------------------------------------------------#
#---------------------------------------------------------------------------------#
#---------------------------------------------------------------------------------#

if [ $SOC -eq 1 ];then

cat > temp_soc <<!
LSORBIT = .TRUE.
SAXIS = 0 0 1
GGA_COMPAT = .FALSE.
LMAXMIX =4
LCHARG = .FALSE.
LWAVE = .FALSE.
LORBMOM = .TRUE.
#MAGMOM = 36*0.6
!

cat temp_soc >> INCAR_scf

cat temp_soc >> INCAR_nonscf

cp temp_soc temp_soc_opt

rm temp_soc

fi

if [ $LDAU -eq 1 ];then

for((i=1;i<=${#LDAUL[@]};i++));do LDAUJ[$i]=0;done

cat > temp_u <<!
LDAU = T
LDAUTYPE = 2
LDAUL = ${LDAUL[@]}
LDAUU = ${LDAUU[@]}
LDAUJ = ${LDAUJ[@]}
LMAXMIX = 4
!

cat temp_u >> INCAR_opt
cat temp_u >> INCAR_scf

cat temp_u >> INCAR_nonscf

rm temp_u

fi

if [ $Orbit_pro -ne 0 ];then

cat >> temp_pro <<!
LORBIT = 11

!

cat temp_pro >> INCAR_scf

cat temp_pro >> INCAR_nonscf

rm temp_pro

fi

##########################################################
################### Start VASP calculation ###############
##########################################################

## Structural optimization ##

if [ $Opt -eq 1 ];then

mkdir opt

cp POSCAR POTCAR opt

cd opt

cat > KPOINTS <<!
Auto
0
Gamma
${kmesh_opt[0]} ${kmesh_opt[1]} ${kmesh_opt[2]}
0 0 0
!

mv ../INCAR_opt ./INCAR

####################################################################
############################# Opt Model ############################
####################################################################

if [ $Opt_contr -eq 1 ];then
cat > OPTCELL <<!
100
010
000
!

cat > temp_ISIF <<!
ISIF = 3
!

cat temp_ISIF >> INCAR
rm temp_ISIF

fi

if [ $Opt_soc -eq 1 ];then
mv ../temp_soc_opt ./
cat temp_soc_opt >> INCAR
rm temp_soc_opt

if [ $Opt_contr -eq 1 ];then $run_command_opt_SOC > $LSB_JOBID.log 2>&1;else $run_command_SOC > $LSB_JOBID.log 2>&1;fi;cd ..

else  rm ../temp_soc_opt

if [ $Opt_contr -eq 1 ];then $run_command_opt_Std > $LSB_JOBID.log 2>&1;else $run_command_Std > $LSB_JOBID.log 2>&1;fi;cd ..

fi

####################################################################

else rm INCAR_opt
     rm temp_soc_opt
fi

## Scf calculation ##
if [ $Scf -eq 1 ];then source ${Dir_AutoVASP}/bin/Scfset.sh

if [ $SOC -eq 1 ];then $run_command_SOC > $LSB_JOBID.log 2>&1;else $run_command_Std > $LSB_JOBID.log 2>&1;fi;cd ..

else rm INCAR_scf

fi

## Nonscf calculation ##

if [ $Nonscf -eq 1 ];then source ${Dir_AutoVASP}/bin/Nonscfset.sh

if [ $SOC -eq 1 ];then $run_command_SOC > $LSB_JOBID.log 2>&1;else $run_command_Std > $LSB_JOBID.log 2>&1;fi;cd ..

else rm INCAR_nonscf;exit

fi

## Data analysis


source ${Dir_AutoVASP}/bin/Data_analysis.sh

cd ..
