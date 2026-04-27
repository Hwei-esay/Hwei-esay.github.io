import yaml from "https://esm.sh/js-yaml@4.1.0";
import * as THREE from "https://esm.sh/three@0.164.1";
import { OrbitControls } from "https://esm.sh/three@0.164.1/examples/jsm/controls/OrbitControls";

const state = {
  data: null,
  selectedQIndex: 0,
  selectedBandIndex: 0,
  amplitude: 0.45,
  speed: 1.2,
  phaseDeg: 0,
  isPlaying: true,
  animationTime: 0,
  projectionMode: "jz",
  vectorScale: 2.6,
};

const elements = {
  fileInput: document.querySelector("#file-input"),
  loadSample: document.querySelector("#load-sample"),
  status: document.querySelector("#status"),
  plot: document.querySelector("#plot"),
  viewer: document.querySelector("#viewer"),
  selectionLabel: document.querySelector("#selection-label"),
  modeMeta: document.querySelector("#mode-meta"),
  modeDetails: document.querySelector("#mode-details"),
  amplitude: document.querySelector("#amplitude"),
  amplitudeValue: document.querySelector("#amplitude-value"),
  speed: document.querySelector("#speed"),
  speedValue: document.querySelector("#speed-value"),
  phase: document.querySelector("#phase"),
  phaseValue: document.querySelector("#phase-value"),
  playPause: document.querySelector("#play-pause"),
  projectionMode: document.querySelector("#projection-mode"),
  vectorScale: document.querySelector("#vector-scale"),
  vectorScaleValue: document.querySelector("#vector-scale-value"),
};

const viewerState = createViewer(elements.viewer);

wireControls();
resizePlotOnWindow();
loadSampleData();

function wireControls() {
  elements.fileInput.addEventListener("change", async (event) => {
    const [file] = event.target.files ?? [];
    if (!file) {
      return;
    }
    try {
      setStatus(`正在读取 ${file.name}…`);
      const text = await file.text();
      applyYaml(text, file.name);
    } catch (error) {
      showError(error);
    }
  });

  elements.loadSample.addEventListener("click", () => {
    loadSampleData();
  });

  elements.amplitude.addEventListener("input", () => {
    state.amplitude = Number(elements.amplitude.value);
    elements.amplitudeValue.textContent = state.amplitude.toFixed(2);
    updateSelectedMode();
  });

  elements.speed.addEventListener("input", () => {
    state.speed = Number(elements.speed.value);
    elements.speedValue.textContent = state.speed.toFixed(1);
  });

  elements.phase.addEventListener("input", () => {
    state.phaseDeg = Number(elements.phase.value);
    elements.phaseValue.textContent = String(Math.round(state.phaseDeg));
    if (!state.isPlaying) {
      updateSelectedMode();
    }
  });

  elements.playPause.addEventListener("click", () => {
    state.isPlaying = !state.isPlaying;
    elements.playPause.textContent = state.isPlaying ? "暂停" : "播放";
    if (!state.isPlaying) {
      updateSelectedMode();
    }
  });

  elements.projectionMode.addEventListener("change", () => {
    state.projectionMode = elements.projectionMode.value;
    renderPlot();
    updateSelectedMode();
  });

  elements.vectorScale.addEventListener("input", () => {
    state.vectorScale = Number(elements.vectorScale.value);
    elements.vectorScaleValue.textContent = state.vectorScale.toFixed(1);
    updateViewerForCurrentSelection();
  });
}

async function loadSampleData() {
  try {
    setStatus("正在加载内置样例…");
    const response = await fetch(new URL("./sample-band.yaml", import.meta.url));
    if (!response.ok) {
      throw new Error(`无法读取样例文件 (${response.status})`);
    }
    const text = await response.text();
    applyYaml(text, "sample-band.yaml");
  } catch (error) {
    showError(error);
  }
}

function applyYaml(text, sourceName) {
  const doc = yaml.load(text);
  const parsed = parseBandYaml(doc);
  state.data = parsed;
  state.selectedQIndex = 0;
  state.selectedBandIndex = Math.min(2, parsed.bandCount - 1);
  state.phaseDeg = 0;
  state.animationTime = 0;
  elements.phase.value = "0";
  elements.phaseValue.textContent = "0";
  setStatus(`已加载 ${sourceName}，共 ${parsed.qpoints.length} 个 q 点，${parsed.bandCount} 条声子支。`);
  renderPlot();
  updateSelectedMode();
}

function parseBandYaml(doc) {
  if (!doc || !Array.isArray(doc.phonon) || !Array.isArray(doc.points) || !Array.isArray(doc.lattice)) {
    throw new Error("不是有效的 phonopy band.yaml：缺少 phonon / points / lattice 结构。");
  }

  const atoms = doc.points.map((point, index) => ({
    index,
    symbol: point.symbol ?? `Atom ${index + 1}`,
    mass: point.mass ?? null,
    reduced: point.coordinates.map(Number),
  }));

  const lattice = doc.lattice.map((vector) => vector.map(Number));
  const atomPositionsCartesian = atoms.map((atom) => fracToCartesian(atom.reduced, lattice));
  const qpoints = doc.phonon.map((entry, qIndex) => ({
    qIndex,
    distance: Number(entry.distance ?? qIndex),
    label: sanitizeLabel(entry.label ?? ""),
    qPosition: (entry["q-position"] ?? [0, 0, 0]).map(Number),
    bands: (entry.band ?? []).map((band, bandIndex) => {
      const eigenvector = (band.eigenvector ?? []).map((atomVector) =>
        atomVector.map((component) => ({
          re: Number(component?.[0] ?? 0),
          im: Number(component?.[1] ?? 0),
        })),
      );

      return {
        bandIndex,
        frequency: Number(band.frequency ?? 0),
        eigenvector,
        angularMomentum: computeAngularMomentum(eigenvector),
      };
    }),
  }));

  if (!qpoints.length || !qpoints[0].bands.length) {
    throw new Error("band.yaml 中没有可用的声子支信息。");
  }

  return {
    name: inferMaterialName(atoms),
    lattice,
    atoms,
    atomPositionsCartesian,
    qpoints,
    bandCount: qpoints[0].bands.length,
    tickPoints: computeTickPoints(qpoints),
  };
}

function computeAngularMomentum(eigenvector) {
  let norm = 0;
  let jx = 0;
  let jy = 0;
  let jz = 0;

  for (const atomVector of eigenvector) {
    const [ex, ey, ez] = atomVector;
    norm += magnitudeSquared(ex) + magnitudeSquared(ey) + magnitudeSquared(ez);
    jx += 2 * imaginaryCross(ey, ez);
    jy += 2 * imaginaryCross(ez, ex);
    jz += 2 * imaginaryCross(ex, ey);
  }

  if (norm < 1e-12) {
    return { jx: 0, jy: 0, jz: 0 };
  }

  return {
    jx: clampProjection(jx / norm),
    jy: clampProjection(jy / norm),
    jz: clampProjection(jz / norm),
  };
}

function magnitudeSquared(component) {
  return component.re ** 2 + component.im ** 2;
}

function imaginaryCross(a, b) {
  return a.re * b.im - a.im * b.re;
}

function clampProjection(value) {
  return Math.max(-1, Math.min(1, value));
}

function computeTickPoints(qpoints) {
  const ticks = [];
  const seen = new Set();

  qpoints.forEach((point, index) => {
    const isEndpoint = index === 0 || index === qpoints.length - 1;
    if (!point.label && !isEndpoint) {
      return;
    }
    const key = `${point.distance.toFixed(6)}:${point.label || index}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    ticks.push({
      index,
      distance: point.distance,
      label: point.label || `q${index + 1}`,
      coordinateLabel: formatCoordinateLabel(point.qPosition),
    });
  });

  return ticks;
}

function inferMaterialName(atoms) {
  const counts = new Map();
  for (const atom of atoms) {
    counts.set(atom.symbol, (counts.get(atom.symbol) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([symbol, count]) => `${symbol}${count > 1 ? count : ""}`)
    .join("");
}

function sanitizeLabel(label) {
  return String(label)
    .replace(/\$\\Gamma\$/g, "Γ")
    .replace(/\\Gamma/g, "Γ")
    .replace(/\$/g, "");
}

function renderPlot() {
  const data = state.data;
  if (!data) {
    return;
  }

  const width = elements.plot.clientWidth || 720;
  const height = elements.plot.clientHeight || 420;
  const padding = { top: 28, right: 22, bottom: 98, left: 56 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const distances = data.qpoints.map((point) => point.distance);
  const frequencies = data.qpoints.flatMap((point) => point.bands.map((band) => band.frequency));
  const minX = Math.min(...distances);
  const maxX = Math.max(...distances);
  const minY = Math.min(...frequencies);
  const maxY = Math.max(...frequencies);
  const yPadding = Math.max((maxY - minY) * 0.08, 2);

  const xToSvg = (value) => padding.left + scale(value, minX, maxX || minX + 1, 0, plotWidth);
  const yToSvg = (value) => padding.top + scale(value, maxY + yPadding, minY - yPadding, 0, plotHeight);

  const polylines = Array.from({ length: data.bandCount }, (_, bandIndex) => {
    const points = data.qpoints
      .map((point) => `${xToSvg(point.distance).toFixed(2)},${yToSvg(point.bands[bandIndex].frequency).toFixed(2)}`)
      .join(" ");
    return `<polyline fill="none" stroke="rgba(25,114,120,0.34)" stroke-width="1.9" points="${points}" />`;
  }).join("");

  const circles = data.qpoints.flatMap((point, qIndex) =>
    point.bands.map((band, bandIndex) => {
      const selected = qIndex === state.selectedQIndex && bandIndex === state.selectedBandIndex;
      const projectionValue = getProjectionValue(band.angularMomentum, state.projectionMode);
      const fill = selected ? "#d62839" : projectionToColor(projectionValue, state.projectionMode === "none" ? 0.18 : 0.92);
      return `<circle
        class="mode-point"
        data-q="${qIndex}"
        data-band="${bandIndex}"
        cx="${xToSvg(point.distance).toFixed(2)}"
        cy="${yToSvg(band.frequency).toFixed(2)}"
        r="${selected ? 6.2 : 4.1}"
        fill="${fill}"
        stroke="white"
        stroke-width="${selected ? 1.8 : 1.15}"
      />`;
    }),
  ).join("");

  const yTicks = Array.from({ length: 5 + 1 }, (_, index) => {
    const fraction = index / 5;
    const value = maxY + yPadding - fraction * (maxY - minY + 2 * yPadding);
    const y = padding.top + fraction * plotHeight;
    return `
      <g>
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(16,32,39,0.08)" />
        <text x="${padding.left - 12}" y="${y + 4}" text-anchor="end" font-size="12" fill="#506066">${value.toFixed(1)}</text>
      </g>
    `;
  }).join("");

  const xTickLines = data.tickPoints.map((point) => {
    const x = xToSvg(point.distance);
    return `<line x1="${x}" y1="${padding.top}" x2="${x}" y2="${height - padding.bottom}" stroke="rgba(16,32,39,0.08)" />`;
  }).join("");

  const xTickLabels = data.tickPoints.map((point) => {
    const x = xToSvg(point.distance);
    return `
      <g>
        <text x="${x}" y="${height - 48}" text-anchor="middle" font-size="13" fill="#102027">${escapeHtml(point.label)}</text>
        <text x="${x}" y="${height - 28}" text-anchor="middle" font-size="11.5" fill="#506066">${escapeHtml(point.coordinateLabel)}</text>
      </g>
    `;
  }).join("");

  const projectionLegend = state.projectionMode === "none"
    ? `<span class="legend-item"><span class="legend-dot"></span>点击任一点即可切换 q 点与声子支</span>`
    : `<span class="legend-item"><span class="legend-bar"></span>${state.projectionMode.toUpperCase()} = -1 → +1（蓝 → 红）</span>`;

  elements.plot.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" aria-label="Dispersion SVG">
      <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
      ${yTicks}
      ${xTickLines}
      <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="rgba(16,32,39,0.22)" />
      <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="rgba(16,32,39,0.22)" />
      ${polylines}
      ${circles}
      ${xTickLabels}
      <text x="${padding.left}" y="18" font-size="13" fill="#506066">Frequency (cm⁻¹)</text>
      <text x="${(padding.left + width - padding.right) / 2}" y="${height - 10}" text-anchor="middle" font-size="12" fill="#506066">q-path / reciprocal coordinates</text>
    </svg>
    <div class="legend">
      <span class="legend-item"><span class="legend-dot"></span>点击任一点即可切换 q 点与声子支</span>
      ${projectionLegend}
    </div>
  `;

  elements.plot.querySelectorAll(".mode-point").forEach((node) => {
    node.addEventListener("click", () => {
      state.selectedQIndex = Number(node.getAttribute("data-q"));
      state.selectedBandIndex = Number(node.getAttribute("data-band"));
      updateSelectedMode();
      renderPlot();
    });
  });
}

function projectionToColor(value, saturation) {
  const clamped = Math.max(-1, Math.min(1, value));
  const neutral = [238, 243, 244];
  const positive = [214, 40, 57];
  const negative = [43, 80, 170];
  const target = clamped >= 0 ? positive : negative;
  const t = Math.abs(clamped) * saturation;
  const mixed = neutral.map((base, index) => Math.round(base + (target[index] - base) * t));
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

function getProjectionValue(angularMomentum, mode) {
  if (mode === "jx") {
    return angularMomentum.jx;
  }
  if (mode === "jy") {
    return angularMomentum.jy;
  }
  if (mode === "jz") {
    return angularMomentum.jz;
  }
  return 0;
}

function updateSelectedMode() {
  if (!state.data) {
    return;
  }

  const point = state.data.qpoints[state.selectedQIndex];
  const band = point.bands[state.selectedBandIndex];
  const phase = ((state.phaseDeg % 360) * Math.PI) / 180;
  const { jx, jy, jz } = band.angularMomentum;

  elements.selectionLabel.textContent = `q${state.selectedQIndex + 1} / band ${state.selectedBandIndex + 1}`;
  elements.modeMeta.innerHTML = `
    <dl>
      <dt>Material</dt><dd>${state.data.name}</dd>
      <dt>q-point</dt><dd>${formatTuple(point.qPosition)}</dd>
      <dt>Label</dt><dd>${point.label || "—"}</dd>
      <dt>Distance</dt><dd>${point.distance.toFixed(4)}</dd>
      <dt>Eigenvalue</dt><dd>${band.frequency.toFixed(4)} cm⁻¹</dd>
      <dt>Jx / Jy / Jz</dt><dd>${jx.toFixed(3)} / ${jy.toFixed(3)} / ${jz.toFixed(3)}</dd>
    </dl>
  `;

  elements.modeDetails.innerHTML = renderModeTable(state.data, point, band);
  updateViewerMode(state.data, state.selectedQIndex, state.selectedBandIndex, phase, state.amplitude);
}

function renderModeTable(data, point, band) {
  const rows = data.atoms.map((atom, index) => {
    const vector = band.eigenvector[index] ?? [];
    const magnitude = Math.sqrt(vector.reduce((sum, component) => sum + magnitudeSquared(component), 0));
    return `
      <tr>
        <td>${atom.symbol} ${index + 1}</td>
        <td>${formatComplexTriplet(vector, 0)}</td>
        <td>${formatComplexTriplet(vector, 1)}</td>
        <td>${formatComplexTriplet(vector, 2)}</td>
        <td>${magnitude.toFixed(4)}</td>
      </tr>
    `;
  }).join("");

  return `
    <p>
      <strong>${point.label || `q${point.qIndex + 1}`}</strong>
      <span> q = ${formatTuple(point.qPosition)}</span>
      <span> | frequency = <strong>${band.frequency.toFixed(4)} cm⁻¹</strong></span>
    </p>
    <p>
      <strong>Jx = ${band.angularMomentum.jx.toFixed(3)}</strong>,
      <strong>Jy = ${band.angularMomentum.jy.toFixed(3)}</strong>,
      <strong>Jz = ${band.angularMomentum.jz.toFixed(3)}</strong>
    </p>
    <table>
      <thead>
        <tr>
          <th>Atom</th>
          <th>e<sub>x</sub></th>
          <th>e<sub>y</sub></th>
          <th>e<sub>z</sub></th>
          <th>|e|</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function formatComplexTriplet(vector, componentIndex) {
  const value = vector?.[componentIndex] ?? { re: 0, im: 0 };
  const re = value.re.toFixed(4);
  const im = value.im >= 0 ? `+ ${value.im.toFixed(4)}i` : `- ${Math.abs(value.im).toFixed(4)}i`;
  return `${re} ${im}`;
}

function formatTuple(values) {
  return `(${values.map((value) => value.toFixed(4)).join(", ")})`;
}

function formatCoordinateLabel(values) {
  return `[${values.map((value) => trimCoordinate(value)).join(", ")}]`;
}

function trimCoordinate(value) {
  return Number(value).toFixed(3).replace(/\.?0+$/, "");
}

function setStatus(message) {
  elements.status.textContent = message;
}

function showError(error) {
  console.error(error);
  elements.status.textContent = `加载失败：${error instanceof Error ? error.message : String(error)}`;
}

function scale(value, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) {
    return (outMin + outMax) / 2;
  }
  const ratio = (value - inMin) / (inMax - inMin);
  return outMin + ratio * (outMax - outMin);
}

function fracToCartesian(frac, lattice) {
  const [a, b, c] = lattice;
  return [
    frac[0] * a[0] + frac[1] * b[0] + frac[2] * c[0],
    frac[0] * a[1] + frac[1] * b[1] + frac[2] * c[1],
    frac[0] * a[2] + frac[1] * b[2] + frac[2] * c[2],
  ];
}

function createViewer(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf7f7f4);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(8, 6, 8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
  keyLight.position.set(8, 12, 10);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xcce6ff, 0.55);
  fillLight.position.set(-8, -4, 5);
  scene.add(fillLight);

  const root = new THREE.Group();
  scene.add(root);

  const viewer = {
    scene,
    camera,
    renderer,
    controls,
    root,
    atomMeshes: [],
    ghostMeshes: [],
    arrowHelpers: [],
    equilibriumPositions: [],
  };

  const resize = () => {
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 420;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  resize();
  window.addEventListener("resize", resize);

  let previousTime = performance.now();
  function animate(now) {
    const deltaSeconds = (now - previousTime) / 1000;
    previousTime = now;
    if (state.isPlaying && state.data) {
      state.animationTime += deltaSeconds * state.speed;
      state.phaseDeg = ((state.animationTime * 90) % 360 + 360) % 360;
      elements.phase.value = state.phaseDeg.toFixed(0);
      elements.phaseValue.textContent = String(Math.round(state.phaseDeg));
      updateViewerForCurrentSelection();
    }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
  return viewer;
}

function updateViewerMode(data, qIndex, bandIndex, phase, amplitude) {
  const band = data.qpoints[qIndex].bands[bandIndex];

  if (!viewerState.atomMeshes.length) {
    initializeViewerObjects(data);
  }

  for (let atomIndex = 0; atomIndex < data.atoms.length; atomIndex += 1) {
    const eq = viewerState.equilibriumPositions[atomIndex];
    const instantaneous = evaluateDisplacement(band.eigenvector[atomIndex], phase, amplitude);
    const vectorForArrow = evaluateDisplacement(band.eigenvector[atomIndex], phase, amplitude * state.vectorScale);
    const position = new THREE.Vector3(eq.x + instantaneous[0], eq.y + instantaneous[1], eq.z + instantaneous[2]);
    viewerState.atomMeshes[atomIndex].position.copy(position);

    const arrow = viewerState.arrowHelpers[atomIndex];
    const vector = new THREE.Vector3(...vectorForArrow);
    const length = Math.max(vector.length(), 0.0001);
    arrow.position.copy(position);
    arrow.setDirection(length > 0.0001 ? vector.clone().normalize() : new THREE.Vector3(0, 1, 0));
    arrow.setLength(length, Math.max(length * 0.22, 0.12), Math.max(length * 0.16, 0.08));
    arrow.visible = length > 0.002;
  }
}

function updateViewerForCurrentSelection() {
  if (!state.data) {
    return;
  }
  const phase = ((state.phaseDeg % 360) * Math.PI) / 180;
  updateViewerMode(state.data, state.selectedQIndex, state.selectedBandIndex, phase, state.amplitude);
}

function initializeViewerObjects(data) {
  viewerState.root.clear();
  viewerState.atomMeshes = [];
  viewerState.ghostMeshes = [];
  viewerState.arrowHelpers = [];
  viewerState.equilibriumPositions = data.atomPositionsCartesian.map((position) => new THREE.Vector3(...position));

  const box = buildUnitCell(data.lattice);
  viewerState.root.add(box);

  const center = new THREE.Vector3();
  viewerState.equilibriumPositions.forEach((position) => center.add(position));
  center.multiplyScalar(1 / viewerState.equilibriumPositions.length);
  viewerState.root.position.copy(center.clone().multiplyScalar(-1));

  data.atoms.forEach((atom, atomIndex) => {
    const color = new THREE.Color(elementColor(atom.symbol));

    const ghost = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 24, 24),
      new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.22 }),
    );
    ghost.position.copy(viewerState.equilibriumPositions[atomIndex]);
    viewerState.root.add(ghost);
    viewerState.ghostMeshes.push(ghost);

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 32, 32),
      new THREE.MeshStandardMaterial({ color, roughness: 0.36, metalness: 0.08 }),
    );
    mesh.position.copy(viewerState.equilibriumPositions[atomIndex]);
    viewerState.root.add(mesh);
    viewerState.atomMeshes.push(mesh);

    const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), viewerState.equilibriumPositions[atomIndex], 0.4, 0xd62839, 0.18, 0.1);
    viewerState.root.add(arrow);
    viewerState.arrowHelpers.push(arrow);
  });

  viewerState.camera.position.set(6.5, 5.3, 7.2);
  viewerState.controls.target.set(0, 0, 0);
  viewerState.controls.update();
}

function buildUnitCell(lattice) {
  const [a, b, c] = lattice.map((vector) => new THREE.Vector3(...vector));
  const origin = new THREE.Vector3(0, 0, 0);
  const ab = a.clone().add(b);
  const ac = a.clone().add(c);
  const bc = b.clone().add(c);
  const abc = a.clone().add(b).add(c);
  const points = [origin, a, b, c, ab, ac, bc, abc];
  const segments = [
    [0, 1], [0, 2], [0, 3],
    [1, 4], [1, 5], [2, 4],
    [2, 6], [3, 5], [3, 6],
    [4, 7], [5, 7], [6, 7],
  ];

  const vertices = [];
  for (const [start, end] of segments) {
    vertices.push(...points[start].toArray(), ...points[end].toArray());
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  return new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color: 0x197278, transparent: true, opacity: 0.65 }),
  );
}

function evaluateDisplacement(atomVector, phase, amplitude) {
  const scaleFactor = amplitude * 0.65;
  return atomVector.map((component) => scaleFactor * (component.re * Math.cos(phase) - component.im * Math.sin(phase)));
}

function elementColor(symbol) {
  const palette = {
    H: "#8ecae6",
    C: "#264653",
    N: "#3a86ff",
    O: "#ef476f",
    S: "#ffb703",
    Si: "#577590",
    Fe: "#bc4749",
    Cu: "#ca6702",
  };
  return palette[symbol] ?? "#197278";
}

function resizePlotOnWindow() {
  let timeoutId = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      renderPlot();
    }, 80);
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
