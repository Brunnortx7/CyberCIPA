const ROOT_PATH = location.hostname.endsWith("github.io") ? "/" + location.pathname.split("/")[1] + "/" : "./";
const listaFuncionarios = document.getElementById("listaFuncionarios");
const filtro = document.getElementById("filtro");
const btnNovoFuncionario = document.getElementById("btnNovoFuncionario");
const modal = document.getElementById("modalFuncionario");
const tituloModal = document.getElementById("tituloModalFuncionario");
const form = document.getElementById("formFuncionario");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnCancelarModal = document.getElementById("btnCancelarModal");

const KEY_FUNCIONARIOS = "cipa_demo_funcionarios_v2";

let funcionarios = [];

async function seedFuncionarios() {
  const saved = localStorage.getItem(KEY_FUNCIONARIOS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        funcionarios = parsed;
        return;
      }
    } catch (e) {}
  }
  const res = await fetch(`${ROOT_PATH}mock/funcionarios.json`);
  const seed = await res.json();
  funcionarios = Array.isArray(seed) ? seed : [];
  localStorage.setItem(KEY_FUNCIONARIOS, JSON.stringify(funcionarios));
}

function salvar() {
  localStorage.setItem(KEY_FUNCIONARIOS, JSON.stringify(funcionarios));
}

function abrirModal() {
  modal.classList.remove("hidden");
}

function fecharModal() {
  modal.classList.add("hidden");
}

function limparForm() {
  form.reset();
  form.elements["id"].value = "";
}

function preencherForm(f) {
  form.elements["id"].value = f.id ?? "";
  form.elements["matricula"].value = f.matricula ?? "";
  form.elements["cpf"].value = f.cpf ?? "";
  form.elements["nome"].value = f.nome ?? "";
  form.elements["cargo"].value = f.cargo ?? "";
  form.elements["setor"].value = f.setor ?? "";
  form.elements["data_nascimento"].value = f.data_nascimento ?? "";
  form.elements["data_contratacao"].value = f.data_contratacao ?? "";
  form.elements["tipo_usuario"].value = f.tipo_usuario ?? "";
}

function render(lista) {
  listaFuncionarios.innerHTML = "";

  if (!lista.length) {
    listaFuncionarios.innerHTML = "<p>Nenhum funcionário encontrado.</p>";
    return;
  }

  lista.forEach(f => {
    const card = document.createElement("div");
    card.className = "card-funcionario";
    card.innerHTML = `
      <div class="linha">
        <div>
          <strong>${f.nome || "Sem nome"}</strong>
          <div class="muted">${f.cargo || "-"} • ${f.setor || "-"}</div>
        </div>
        <div class="acoes">
          <button class="btn-editar" data-id="${f.id}">Editar</button>
        </div>
      </div>
      <div class="muted">Matrícula: ${f.matricula || "-"} • CPF: ${f.cpf || "-"}</div>
    `;
    listaFuncionarios.appendChild(card);
  });

  listaFuncionarios.querySelectorAll(".btn-editar").forEach(b => {
    b.addEventListener("click", () => {
      const id = Number(b.dataset.id);
      const f = funcionarios.find(x => Number(x.id) === id);
      if (!f) return;
      tituloModal.textContent = "Editar Funcionário";
      preencherForm(f);
      abrirModal();
    });
  });
  });
}

function aplicarFiltro() {
  const termo = (filtro.value || "").toLowerCase().trim();
  if (!termo) {
    render(funcionarios);
    return;
  }
  const lista = funcionarios.filter(f =>
    (f.nome || "").toLowerCase().includes(termo) ||
    (f.matricula || "").toLowerCase().includes(termo) ||
    (f.setor || "").toLowerCase().includes(termo) ||
    (f.cargo || "").toLowerCase().includes(termo)
  );
  render(lista);
}

function salvarForm(e) {
  e.preventDefault();

  const dados = {
    id: form.elements["id"].value ? Number(form.elements["id"].value) : null,
    matricula: form.elements["matricula"].value.trim(),
    cpf: form.elements["cpf"].value.trim(),
    nome: form.elements["nome"].value.trim(),
    cargo: form.elements["cargo"].value.trim(),
    setor: form.elements["setor"].value.trim(),
    data_nascimento: form.elements["data_nascimento"].value,
    data_contratacao: form.elements["data_contratacao"].value,
    tipo_usuario: form.elements["tipo_usuario"].value
  };

  if (!dados.matricula || !dados.cpf || !dados.nome || !dados.cargo || !dados.setor || !dados.data_nascimento || !dados.data_contratacao || !dados.tipo_usuario) {
    return;
  }

  if (!dados.id) {
    const novoId = funcionarios.length ? Math.max(...funcionarios.map(x => Number(x.id))) + 1 : 1;
    funcionarios.unshift({ ...dados, id: novoId });
    salvar();
    fecharModal();
    aplicarFiltro();
    return;
  }

  const idx = funcionarios.findIndex(x => Number(x.id) === Number(dados.id));
  if (idx === -1) return;
  funcionarios[idx] = { ...funcionarios[idx], ...dados };
  salvar();
  fecharModal();
  aplicarFiltro();
}

btnNovoFuncionario.addEventListener("click", () => {
  tituloModal.textContent = "Novo Funcionário";
  limparForm();
  abrirModal();
});

btnFecharModal.addEventListener("click", fecharModal);
btnCancelarModal.addEventListener("click", fecharModal);
form.addEventListener("submit", salvarForm);
filtro.addEventListener("input", aplicarFiltro);

seedFuncionarios()
  .then(() => render(funcionarios))
  .catch(() => render([]));
