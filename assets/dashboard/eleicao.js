const ROOT_PATH = location.hostname.endsWith("github.io") ? "/" + location.pathname.split("/")[1] + "/" : "./";
const KEY_ELEICOES = "cipa_demo_eleicoes_v2";
const KEY_FUNCIONARIOS = "cipa_demo_funcionarios_v2";
const KEY_COMISSAO = "cipa_demo_comissao_v2";

function getIdEleicao() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  return id ? Number(id) : null;
}

function fmt(iso) {
  if (!iso) return "-";
  const parts = String(iso).split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

async function seed(key, url) {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && (Array.isArray(parsed) ? parsed.length : true)) return parsed;
    } catch (e) {}
  }
  const res = await fetch(url);
  const data = await res.json();
  localStorage.setItem(key, JSON.stringify(data));
  return data;
}

async function seedAll() {
  await seed(KEY_ELEICOES, `${ROOT_PATH}mock/eleicoes.json`);
  await seed(KEY_FUNCIONARIOS, `${ROOT_PATH}mock/funcionarios.json`);
  const com = await seed(KEY_COMISSAO, `${ROOT_PATH}mock/comissao.json`);
  if (com && typeof com === "object" && !Array.isArray(com)) return;
  localStorage.setItem(KEY_COMISSAO, JSON.stringify({}));
}

function getEleicoes() {
  const raw = localStorage.getItem(KEY_ELEICOES) || "[]";
  return JSON.parse(raw);
}

function setEleicoes(eleicoes) {
  localStorage.setItem(KEY_ELEICOES, JSON.stringify(eleicoes));
}

function getFuncionarios() {
  const raw = localStorage.getItem(KEY_FUNCIONARIOS) || "[]";
  return JSON.parse(raw);
}

function getComissaoMap() {
  const raw = localStorage.getItem(KEY_COMISSAO) || "{}";
  const data = JSON.parse(raw);
  if (data && typeof data === "object") return data;
  return {};
}

function setComissaoMap(map) {
  localStorage.setItem(KEY_COMISSAO, JSON.stringify(map));
}

function getEleicaoPorId(id) {
  return getEleicoes().find(e => Number(e.id) === Number(id));
}

function salvarEleicaoAtual(id, patch) {
  const eleicoes = getEleicoes();
  const idx = eleicoes.findIndex(e => Number(e.id) === Number(id));
  if (idx === -1) return false;
  eleicoes[idx] = { ...eleicoes[idx], ...patch };
  setEleicoes(eleicoes);
  return true;
}

function setTexto(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function abrirModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}

function fecharModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}

function renderAnexos() {
  setHTML("anexo-edital", "<span class=\"muted\">Modo demonstração</span>");
  setHTML("anexo-inscricao", "<span class=\"muted\">Modo demonstração</span>");
}

function renderCronograma(eleicao) {
  const itens = [
    ["Publicação do Edital", eleicao.publicacao_edital],
    ["Formação da Comissão", eleicao.formacao_comissao],
    ["Divulgação das Inscrições", eleicao.divulgacao_inscricao],
    ["Início das Inscrições", eleicao.inicio_inscricoes],
    ["Fim das Inscrições", eleicao.fim_inscricoes],
    ["Data da Eleição", eleicao.data_eleicao],
    ["Data da Posse", eleicao.data_posse]
  ];

  const html = itens
    .map(([label, date]) => `<li><strong>${label}:</strong> ${fmt(date)}</li>`)
    .join("");

  setHTML("cronograma", html);
}

function renderComissao(eleicaoId) {
  const funcionarios = getFuncionarios();
  const map = getComissaoMap();
  const lista = Array.isArray(map[String(eleicaoId)]) ? map[String(eleicaoId)] : [];
  const resolveNome = (id) => funcionarios.find(f => Number(f.id) === Number(id))?.nome || "Funcionário";
  const html = lista.length
    ? lista.map(m => {
        const nome = resolveNome(m.funcionarioId ?? m);
        const funcao = m.funcao ? ` <span class=\"tag\">${m.funcao}</span>` : "";
        const desc = m.descricao ? `<div class=\"muted\">${m.descricao}</div>` : "";
        const fid = m.funcionarioId ?? m;
        return `<li data-id="${fid}">
          <div><strong>${nome}</strong>${funcao}</div>
          ${desc}
        </li>`;
      }).join("")
    : "<li class=\"muted\">Nenhum membro definido</li>";

  setHTML("listaComissao", html);
}

function preencherSelectFuncionarios() {
  const funcionarios = getFuncionarios();
  const sel = document.getElementById("comissaoFuncionario");
  if (!sel) return;
  sel.innerHTML = "<option value=\"\">Selecione...</option>" + funcionarios
    .map(f => `<option value="${f.id}">${f.nome}</option>`)
    .join("");
}

function getMembrosTemp(eleicaoId) {
  const map = getComissaoMap();
  const lista = Array.isArray(map[String(eleicaoId)]) ? map[String(eleicaoId)] : [];
  return lista.map(m => (typeof m === "number" ? { funcionarioId: m } : m));
}

function setMembrosTemp(eleicaoId, membros) {
  const map = getComissaoMap();
  map[String(eleicaoId)] = membros;
  setComissaoMap(map);
}

function renderPreviewComissao(eleicaoId) {
  const funcionarios = getFuncionarios();
  const membros = getMembrosTemp(eleicaoId);
  const resolveNome = (id) => funcionarios.find(f => Number(f.id) === Number(id))?.nome || "Funcionário";

  const html = membros.length
    ? membros.map((m, idx) => {
        const nome = resolveNome(m.funcionarioId);
        const funcao = m.funcao ? ` - ${m.funcao}` : "";
        const desc = m.descricao ? ` (${m.descricao})` : "";
        return `<li>
          <span>${nome}${funcao}${desc}</span>
          <button type="button" data-idx="${idx}" class="btn-remover">Remover</button>
        </li>`;
      }).join("")
    : "<li class=\"muted\">Nenhum membro adicionado</li>";

  setHTML("comissaoPreview", html);

  const box = document.getElementById("comissaoPreview");
  if (!box) return;
  box.querySelectorAll(".btn-remover").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.idx);
      const atuais = getMembrosTemp(eleicaoId);
      atuais.splice(i, 1);
      setMembrosTemp(eleicaoId, atuais);
      renderPreviewComissao(eleicaoId);
    });
  });
}

window.abrirModalCronograma = function () {
  const id = getIdEleicao();
  const eleicao = getEleicaoPorId(id);
  if (!eleicao) return;

  const m = document.getElementById("modalCronograma");
  if (!m) return;

  document.getElementById("cronEdital").value = eleicao.publicacao_edital || "";
  document.getElementById("cronComissao").value = eleicao.formacao_comissao || "";
  document.getElementById("cronDivulgacao").value = eleicao.divulgacao_inscricao || "";
  document.getElementById("cronInicio").value = eleicao.inicio_inscricoes || "";
  document.getElementById("cronFim").value = eleicao.fim_inscricoes || "";
  document.getElementById("cronEleicao").value = eleicao.data_eleicao || "";

  abrirModal("modalCronograma");
};

window.fecharModalCronograma = function () {
  fecharModal("modalCronograma");
};

window.abrirModalComissao = function () {
  const id = getIdEleicao();
  if (!id) return;
  preencherSelectFuncionarios();
  renderPreviewComissao(id);
  abrirModal("modalComissao");
};

window.fecharModalComissao = function () {
  fecharModal("modalComissao");
};

window.adicionarMembroComissao = function () {
  const id = getIdEleicao();
  if (!id) return;

  const funcionarioId = Number(document.getElementById("comissaoFuncionario").value || 0);
  const funcao = (document.getElementById("comissaoFuncao").value || "").trim();
  const descricao = (document.getElementById("comissaoDescricao").value || "").trim();

  if (!funcionarioId) return;

  const atuais = getMembrosTemp(id);
  const jaExiste = atuais.some(m => Number(m.funcionarioId) === funcionarioId);
  if (jaExiste) return;

  atuais.push({ funcionarioId, funcao, descricao });
  setMembrosTemp(id, atuais);

  document.getElementById("comissaoFuncionario").value = "";
  document.getElementById("comissaoFuncao").value = "";
  document.getElementById("comissaoDescricao").value = "";

  renderPreviewComissao(id);
};

window.salvarComissao = function () {
  const id = getIdEleicao();
  if (!id) return;
  renderComissao(id);
  fecharModal("modalComissao");
};

window.fecharModalAnexo = function () {
  fecharModal("modalAnexo");
};

function initHandlers() {
  const formCron = document.getElementById("formCronograma");
  if (formCron) {
    formCron.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = getIdEleicao();
      if (!id) return;

      const patch = {
        publicacao_edital: document.getElementById("cronEdital").value,
        formacao_comissao: document.getElementById("cronComissao").value,
        divulgacao_inscricao: document.getElementById("cronDivulgacao").value,
        inicio_inscricoes: document.getElementById("cronInicio").value,
        fim_inscricoes: document.getElementById("cronFim").value,
        data_eleicao: document.getElementById("cronEleicao").value
      };

      salvarEleicaoAtual(id, patch);
      const eleicao = getEleicaoPorId(id);
      if (eleicao) renderCronograma(eleicao);
      fecharModal("modalCronograma");
    });
  }

  const formAnexo = document.getElementById("formAnexo");
  if (formAnexo) {
    formAnexo.addEventListener("submit", (e) => {
      e.preventDefault();
      fecharModal("modalAnexo");
      alert("Modo demonstração: anexos estão disponíveis apenas na versão com backend.");
    });
  }
}

async function init() {
  await seedAll();
  const id = getIdEleicao();
  const eleicao = id ? getEleicaoPorId(id) : null;

  if (!eleicao) {
    setTexto("tituloEleicao", "Eleição não encontrada");
    setTexto("statusEleicao", "-");
    setHTML("cronograma", "<li class=\"muted\">Selecione uma eleição no dashboard</li>");
    renderAnexos();
    return;
  }

  setTexto("tituloEleicao", eleicao.titulo || "Eleição");
  setTexto("statusEleicao", eleicao.status || "-");
  setTexto("dataCriacao", fmt(eleicao.publicacao_edital));
  renderCronograma(eleicao);
  renderAnexos();
  renderComissao(id);
  initHandlers();
}

init().catch(() => {
  setTexto("tituloEleicao", "Falha ao carregar");
});
