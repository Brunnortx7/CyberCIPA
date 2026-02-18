const ROOT_PATH = location.hostname.endsWith("github.io") ? "/" + location.pathname.split("/")[1] + "/" : "./";
const listaEleicoes = document.getElementById("listaEleicoes");
const buscaInput = document.getElementById("busca");
const filtroStatus = document.getElementById("filtroStatus");
const feedback = document.getElementById("feedback");
const btnNovaEleicao = document.getElementById("btnNovaEleicao");
const tituloModal = document.getElementById("tituloModal");
const form = document.getElementById("formEditarEleicao");

let eleicoes = [];
let modoModal = "editar";

const KEY_ELEICOES = "cipa_demo_eleicoes_v2";

function mostrarFeedback(mensagem, tipo = "sucesso") {
  feedback.textContent = mensagem;
  feedback.className = "";
  feedback.classList.add("feedback");
  feedback.classList.add(tipo);
  feedback.classList.remove("hidden");
  window.clearTimeout(mostrarFeedback._t);
  mostrarFeedback._t = window.setTimeout(() => {
    feedback.classList.add("hidden");
  }, 5000);
}

function fmt(iso) {
  if (!iso) return "-";
  const parts = String(iso).split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

async function seedEleicoes() {
  const saved = localStorage.getItem(KEY_ELEICOES);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        eleicoes = parsed;
        return;
      }
    } catch (e) {}
  }
  const res = await fetch(`${ROOT_PATH}mock/eleicoes.json`);
  const seed = await res.json();
  eleicoes = Array.isArray(seed) ? seed : [];
  localStorage.setItem(KEY_ELEICOES, JSON.stringify(eleicoes));
}

function salvarEleicoes() {
  localStorage.setItem(KEY_ELEICOES, JSON.stringify(eleicoes));
}

function atualizarResumo(dados) {
  const total = document.getElementById("qtdTotal");
  const andamento = document.getElementById("qtdAndamento");
  const finalizadas = document.getElementById("qtdFinalizadas");

  const t = dados.length;
  const a = dados.filter(e => e.status === "andamento").length;
  const f = dados.filter(e => e.status === "finalizada").length;

  if (total) total.textContent = t;
  if (andamento) andamento.textContent = a;
  if (finalizadas) finalizadas.textContent = f;
}

function listarEleicoes(dados) {
  listaEleicoes.innerHTML = "";
  if (!dados.length) {
    listaEleicoes.innerHTML = "<p>Nenhuma eleição encontrada.</p>";
    return;
  }

  dados.forEach(eleicao => {
    const card = document.createElement("div");
    card.className = "card-eleicao";

    const statusClass = eleicao.status === "finalizada" ? "finalizada" : "andamento";

    card.innerHTML = `
      <h3>${eleicao.titulo || "Sem título"}</h3>
      <span class="status ${statusClass}">${eleicao.status || "-"}</span>

      <ul>
        <li>Publicação do Edital: ${fmt(eleicao.publicacao_edital)}</li>
        <li>Formação da Comissão: ${fmt(eleicao.formacao_comissao)}</li>
        <li>Início das Inscrições: ${fmt(eleicao.inicio_inscricoes)}</li>
        <li>Fim das Inscrições: ${fmt(eleicao.fim_inscricoes)}</li>
      </ul>

      <div class="acoes">
        <a href="eleicao.html?id=${encodeURIComponent(eleicao.id)}">Acompanhar</a>
        <button class="btn-editar" data-id="${eleicao.id}">Editar</button>
      </div>
    `;

    listaEleicoes.appendChild(card);
  });

  listaEleicoes.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", () => abrirModalEditar(Number(btn.dataset.id)));
  });
}

function aplicarFiltros() {
  const termo = (buscaInput.value || "").toLowerCase().trim();
  const status = filtroStatus.value;

  let filtradas = [...eleicoes];

  if (termo) {
    filtradas = filtradas.filter(e => (e.titulo || "").toLowerCase().includes(termo));
  }

  if (status && status !== "todas") {
    filtradas = filtradas.filter(e => e.status === status);
  }

  atualizarResumo(eleicoes);
  listarEleicoes(filtradas);
}

function abrirModal() {
  document.getElementById("modalEditarEleicao").classList.remove("hidden");
}

function fecharModal() {
  document.getElementById("modalEditarEleicao").classList.add("hidden");
}

function preencherFormulario(eleicao) {
  document.getElementById("editId").value = eleicao?.id ?? "";
  document.getElementById("editTitulo").value = eleicao?.titulo ?? "";
  document.getElementById("editStatus").value = eleicao?.status ?? "andamento";
  document.getElementById("editPosse").value = eleicao?.data_posse ?? "";
  document.getElementById("editEleicao").value = eleicao?.data_eleicao ?? "";
  document.getElementById("editEdital").value = eleicao?.publicacao_edital ?? "";
  document.getElementById("editComissao").value = eleicao?.formacao_comissao ?? "";
  document.getElementById("editDivulgacaoInscricao").value = eleicao?.divulgacao_inscricao ?? "";
  document.getElementById("editInicio").value = eleicao?.inicio_inscricoes ?? "";
  document.getElementById("editFim").value = eleicao?.fim_inscricoes ?? "";
  document.getElementById("editEditalPdf").value = "";
  document.getElementById("editInscricaoPdf").value = "";
}

function abrirModalCriar() {
  modoModal = "criar";
  tituloModal.textContent = "Nova Eleição";
  preencherFormulario(null);
  abrirModal();
}

function abrirModalEditar(id) {
  const eleicao = eleicoes.find(e => Number(e.id) === Number(id));
  if (!eleicao) {
    mostrarFeedback("Eleição não encontrada", "erro");
    return;
  }
  modoModal = "editar";
  tituloModal.textContent = "Editar Eleição";
  preencherFormulario(eleicao);
  abrirModal();
}


function coletarFormulario() {
  const id = document.getElementById("editId").value;
  const titulo = document.getElementById("editTitulo").value.trim();
  const status = document.getElementById("editStatus").value;
  const data_posse = document.getElementById("editPosse").value;
  const data_eleicao = document.getElementById("editEleicao").value;
  const publicacao_edital = document.getElementById("editEdital").value;
  const formacao_comissao = document.getElementById("editComissao").value;
  const divulgacao_inscricao = document.getElementById("editDivulgacaoInscricao").value;
  const inicio_inscricoes = document.getElementById("editInicio").value;
  const fim_inscricoes = document.getElementById("editFim").value;

  return { id, titulo, status, data_posse, data_eleicao, publicacao_edital, formacao_comissao, divulgacao_inscricao, inicio_inscricoes, fim_inscricoes };
}

function salvarOuAtualizar(e) {
  e.preventDefault();

  const dados = coletarFormulario();

  if (!dados.titulo) {
    mostrarFeedback("Informe o título da eleição", "erro");
    return;
  }

  if (modoModal === "criar") {
    const novoId = eleicoes.length ? Math.max(...eleicoes.map(e => Number(e.id))) + 1 : 1;
    const nova = { ...dados, id: novoId };
    eleicoes.unshift(nova);
    salvarEleicoes();
    fecharModal();
    aplicarFiltros();
    mostrarFeedback("Eleição cadastrada com sucesso", "sucesso");
    return;
  }

  const idNum = Number(dados.id);
  const idx = eleicoes.findIndex(e => Number(e.id) === idNum);
  if (idx === -1) {
    mostrarFeedback("Eleição não encontrada", "erro");
    return;
  }

  eleicoes[idx] = { ...eleicoes[idx], ...dados, id: idNum };
  salvarEleicoes();
  fecharModal();
  aplicarFiltros();
  mostrarFeedback("Eleição atualizada com sucesso", "sucesso");
}

document.getElementById("cancelarEdicao").addEventListener("click", fecharModal);
btnNovaEleicao.addEventListener("click", abrirModalCriar);
form.addEventListener("submit", salvarOuAtualizar);
buscaInput.addEventListener("input", aplicarFiltros);
filtroStatus.addEventListener("change", aplicarFiltros);

seedEleicoes()
  .then(() => {
    atualizarResumo(eleicoes);
    listarEleicoes(eleicoes);
  })
  .catch(() => {
    eleicoes = [];
    atualizarResumo(eleicoes);
    listarEleicoes(eleicoes);
    mostrarFeedback("Falha ao carregar dados do modo demonstração", "erro");
  });
