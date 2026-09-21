import "./style.css";
import * as BABYLON from "@babylonjs/core";

// ============================================================================
// ÁREA DE AJUSTES DO ALUNO — ALTERE SOMENTE OS QUATRO VALORES DESTA ÁREA.
// Não é necessário criar ou modificar funções JavaScript nesta atividade.
const VELOCIDADE = 2.5;          // faixa recomendada: 0.5 a 2.5
const LIMITE_DETECCOES = 10;       // faixa recomendada: 2 a 10
const SENSOR_X = -2.5;             // faixa recomendada: -2.5 a 2.5
const COR_PECA = "#fcff3d";       // cor hexadecimal, por exemplo "#ff8c00"
// FIM DA ÁREA DE AJUSTES DO ALUNO
// ============================================================================

const INICIO_X = -4.2;
const FIM_X = 4.2;

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const ui = {
  estado: document.getElementById("estado"), contador: document.getElementById("contador"),
  sensor: document.getElementById("sensor"), alarme: document.getElementById("alarme"),
  mensagem: document.getElementById("mensagem"), start: document.getElementById("btnStart"),
  stop: document.getElementById("btnStop"), reset: document.getElementById("btnReset")
};

let estado = "PARADO";
let deteccoes = 0;
let sensorOcupado = false;

function material(scene, nome, cor) {
  const mat = new BABYLON.StandardMaterial(nome, scene);
  mat.diffuseColor = BABYLON.Color3.FromHexString(cor);
  return mat;
}

function criarCena() {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = BABYLON.Color4.FromHexString("#10151dff");
  const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, 1.08, 12.5, new BABYLON.Vector3(0, .5, 0), scene);
  camera.lowerRadiusLimit = 7; camera.upperRadiusLimit = 18; camera.attachControl(canvas, true);
  new BABYLON.HemisphericLight("luzAmbiente", new BABYLON.Vector3(0, 1, 0), scene).intensity = .85;
  const luz = new BABYLON.DirectionalLight("luzDirecional", new BABYLON.Vector3(-.4, -1, .5), scene); luz.position = new BABYLON.Vector3(4, 8, -5);

  const cinza = material(scene, "cinza", "#566574");
  const escuro = material(scene, "esteira", "#232b33");
  const amarelo = material(scene, "seguranca", "#e3ad2f");
  const azul = material(scene, "peca", COR_PECA);
  const verde = material(scene, "sensorLivre", "#35c66b");
  const vermelho = material(scene, "sensorAtivo", "#e84c4c");
  const piso = BABYLON.MeshBuilder.CreateGround("piso", { width: 14, height: 8 }, scene); piso.material = cinza;
  const correia = BABYLON.MeshBuilder.CreateBox("correia", { width: 9.5, height: .18, depth: 1.5 }, scene); correia.position.y = .72; correia.material = escuro;
  [-4.3, -1.45, 1.45, 4.3].forEach((x) => {
    const pe = BABYLON.MeshBuilder.CreateBox(`pe-${x}`, { width: .18, height: 1.35, depth: 1.25 }, scene); pe.position.set(x, .05, 0); pe.material = amarelo;
  });
  const peca = BABYLON.MeshBuilder.CreateBox("peca", { size: .65 }, scene); peca.position.set(INICIO_X, 1.15, 0); peca.material = azul;
  const sensor = BABYLON.MeshBuilder.CreateBox("sensor", { width: .22, height: 1.6, depth: .3 }, scene); sensor.position.set(SENSOR_X, 1.48, -.95); sensor.material = verde;
  const feixe = BABYLON.MeshBuilder.CreateBox("feixe", { width: .04, height: .04, depth: 1.65 }, scene); feixe.position.set(SENSOR_X, 1.15, 0); feixe.material = verde;
  return { scene, peca, sensor, feixe, verde, vermelho };
}

const celula = criarCena();

function atualizarPainel(mensagem = "") {
  ui.estado.textContent = estado;
  ui.estado.className = `estado ${estado === "RODANDO" ? "rodando" : estado === "FALHA" ? "falha" : "parado"}`;
  ui.contador.textContent = deteccoes;
  ui.alarme.textContent = estado === "FALHA" ? "LIMITE ATINGIDO" : "NORMAL";
  ui.sensor.textContent = sensorOcupado ? "ATUADO" : "LIVRE";
  ui.start.disabled = estado !== "PARADO";
  ui.stop.disabled = !["RODANDO", "FALHA"].includes(estado);
  ui.reset.disabled = estado !== "PARADO" || deteccoes === 0;
  if (mensagem) ui.mensagem.textContent = mensagem;
}

function iniciar() { if (estado !== "PARADO") return; estado = "RODANDO"; atualizarPainel("Esteira em movimento. Observe o sensor."); }
function parar() {
  if (!["RODANDO", "FALHA"].includes(estado)) return;
  const reconheceuFalha = estado === "FALHA";
  estado = "PARADO";
  atualizarPainel(reconheceuFalha ? "Falha reconhecida. Investigue a causa antes do RESET." : "Movimento interrompido de forma controlada.");
}
function resetar() { if (estado !== "PARADO") return; deteccoes = 0; atualizarPainel("Contador zerado com a célula parada."); }
ui.start.addEventListener("click", iniciar); ui.stop.addEventListener("click", parar); ui.reset.addEventListener("click", resetar);

celula.scene.onBeforeRenderObservable.add(() => {
  if (estado !== "RODANDO") return;
  celula.peca.position.x += VELOCIDADE * engine.getDeltaTime() / 1000;
  const detectando = Math.abs(celula.peca.position.x - SENSOR_X) < .38;
  celula.sensor.material = celula.feixe.material = detectando ? celula.vermelho : celula.verde;
  if (detectando && !sensorOcupado) {
    sensorOcupado = true; deteccoes++;
    if (deteccoes >= LIMITE_DETECCOES) { estado = "FALHA"; atualizarPainel("Falha simulada: use STOP para reconhecer e depois RESET."); }
    else atualizarPainel("Peça detectada pelo sensor virtual.");
  } else if (!detectando && sensorOcupado) { sensorOcupado = false; atualizarPainel(); }
  if (celula.peca.position.x > FIM_X) celula.peca.position.x = INICIO_X;
});

atualizarPainel();
engine.runRenderLoop(() => celula.scene.render());
window.addEventListener("resize", () => engine.resize());
