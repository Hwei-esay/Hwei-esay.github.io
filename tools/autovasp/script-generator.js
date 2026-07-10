function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'\\''`)}'`;
}

function assignment(name, value) {
  if (Array.isArray(value)) return `${name}=(${value.join(" ")})`;
  if (typeof value === "string") {
    if (name === "system" && /^[A-Za-z0-9_.-]+$/.test(value)) return `${name}=${value}`;
    return `${name}=${shellQuote(value)}`;
  }
  return `${name}=${value}`;
}

export function buildSettings(values) {
  return `############################
## Start Setting ###########
############################

${assignment("Dir_AutoVASP", values.Dir_AutoVASP)}

${assignment("system", values.system)}

##############################################
## Setting structure optimization parmeters ##
##############################################

# switch for structure optimization
${assignment("Opt", values.Opt)}

${assignment("Opt_contr", values.Opt_contr)}

${assignment("Opt_soc", values.Opt_soc)}

${assignment("kmesh_opt", values.kmesh_opt)}

${assignment("Encut_opt", values.Encut_opt)} # Set Encut by yourself or Encut_scf="Auto"

${assignment("Sigma_opt", values.Sigma_opt)}

#######################################
## Setting SCF calculation parmeters ##
#######################################

# switch for scf calculation( Scf could not be 0 )
${assignment("Scf", values.Scf)}

${assignment("Spin", values.Spin)} # Set Spin=1 will switch off CBM&VBM calculation and orbits projected analysis

${assignment("SOC", values.SOC)}

${assignment("kmesh_scf", values.kmesh_scf)}

${assignment("Encut_scf", values.Encut_scf)} # Set Encut by yourself or Encut_scf="Auto"

${assignment("Sigma_scf", values.Sigma_scf)}

${assignment("NBANDS", values.NBANDS)}

${assignment("npar", values.npar)}

########################################
## Setting LDAU calculation parmeters ##
########################################

# switch for LDAU calculation
${assignment("LDAU", values.LDAU)}

${assignment("LDAUL", values.LDAUL)}

${assignment("LDAUU", values.LDAUU)}

##########################################
## Setting NONSCF calculation parmeters ##
##########################################

# switch for nonscf calculation
${assignment("Nonscf", values.Nonscf)}

${assignment("Auto_K_nonscf", values.Auto_K_nonscf)}

${assignment("Dimension", values.Dimension)}

if [ $Nonscf -eq 1 -a $Auto_K_nonscf -eq 0 ];then

cat > High_sym_points <<!
${values.High_sym_points.trim()}
!

fi

${assignment("nk_insert", values.nk_insert)}

${assignment("Energy_range", values.Energy_range)}

${assignment("CBM_VBM", values.CBM_VBM)} # switch for CBN&VBM calculation

# Orbit projected modle : off(0) / 1(single graph) / 2(multiple graphs)

${assignment("Orbit_pro", values.Orbit_pro)}

${assignment("ions", values.ions)} # all ions : ions=(0)

${assignment("orbits", values.orbits)} # s=1; py=2; pz=3; px=4; dxy=5; dyz=6; dz2=7; dxz=8; dx2-y2=9

${assignment("pointsize", values.pointsize)} # range from 1 to 10

############################
## End Setting #############
############################`;
}

export function generateScript(originalScript, values) {
  const startMarker = "############################\n## Start Setting ###########\n############################";
  const endMarker = "############################\n## End Setting #############\n############################";
  const start = originalScript.indexOf(startMarker);
  const endStart = originalScript.indexOf(endMarker, start);
  if (start < 0 || endStart < 0) throw new Error("无法定位 AutoVASP 配置区标记");
  const end = endStart + endMarker.length;
  return `${originalScript.slice(0, start)}${buildSettings(values)}${originalScript.slice(end)}`;
}
