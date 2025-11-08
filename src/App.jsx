import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [tarefas, setTarefas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [totalPontos, setTotalPontos] = useState(0);
  const [historico, setHistorico] = useState([]);
  const usuario = "Ben";

  useEffect(() => {
    buscarTarefas();
    buscarHistorico();
  }, []);

  useEffect(() => {
    buscarTotalPontos();
  }, [historico]);

  async function buscarTarefas() {
    const { data, error } = await supabase.from("tarefa").select("*");
    if (error) console.error("❌ Erro ao buscar tarefas:", error);
    else setTarefas(data || []);
    setCarregando(false);
  }

  async function concluirTarefa(idTarefa) {
    try {
      const hoje = new Date().toISOString().split("T")[0];
      const { data: jaConcluiu } = await supabase
        .from("tarefa_concluida")
        .select("*")
        .eq("id_tarefa", idTarefa)
        .eq("usuario", usuario)
        .gte("dt_conclusao", `${hoje}T00:00:00`)
        .lte("dt_conclusao", `${hoje}T23:59:59`);

      if (jaConcluiu?.length > 0) {
        alert("⚠️ Essa tarefa já foi concluída hoje!");
        return;
      }

      const { error } = await supabase
        .from("tarefa_concluida")
        .insert([{ id_tarefa: idTarefa, usuario }]);

      if (error) throw error;

      alert("🎉 Tarefa concluída com sucesso!");
      buscarHistorico();
    } catch (err) {
      console.error("❌ Erro ao concluir tarefa:", err.message);
    }
  }

  async function buscarHistorico() {
    const { data, error } = await supabase
      .from("tarefa_concluida")
      .select(
        `
        id,
        id_tarefa,
        dt_conclusao,
        tarefa:tarefa!inner(col_nome, col_ponto)
      `
      )
      .eq("usuario", usuario)
      .order("dt_conclusao", { ascending: false });

    if (error) {
      console.error("❌ Erro ao buscar histórico:", error);
      return;
    }

    setHistorico(data || []);
  }

  async function buscarTotalPontos() {
    try {
      const { data, error } = await supabase.from("v_total_pontos").select("*");

      if (error) {
        console.error("❌ Erro ao buscar total de pontos:", error);
        return;
      }

      if (!data || data.length === 0) {
        setTotalPontos(0);
        return;
      }

      const primeiraLinha = data[0];
      const chaves = Object.keys(primeiraLinha);
      const chaveNome = chaves.find(
        (c) =>
          c.toLowerCase().includes("nome") ||
          c.toLowerCase().includes("usuario")
      );
      const chavePontos = chaves.find((c) => c.toLowerCase().includes("ponto"));

      const registro = data.find(
        (row) => row[chaveNome]?.toLowerCase?.() === usuario.toLowerCase?.()
      );

      if (registro) {
        const pontos = Number(registro[chavePontos]) || 0;
        setTotalPontos((prev) => (prev !== pontos ? pontos : prev));
      } else {
        setTotalPontos(0);
      }
    } catch (e) {
      console.error("❌ Erro inesperado:", e);
      setTotalPontos(0);
    }
  }

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "sans-serif",
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      <h1>Plano de Pontos do Ben 🏆</h1>

      <div style={{ marginBottom: 25 }}>
        <h2 style={{ color: "#4caf50" }}>Total de pontos: {totalPontos}</h2>

        {[
          { nome: "🛹 Skate", meta: 2500, cor: "#4caf50" },
          { nome: "🎮 Videogame", meta: 7500, cor: "#2196f3" },
        ].map((r) => {
          const progresso = Math.min((totalPontos / r.meta) * 100, 100).toFixed(
            1
          );
          return (
            <div key={r.nome} style={{ marginTop: 15 }}>
              <div
                style={{
                  backgroundColor: "#e0e0e0",
                  borderRadius: 10,
                  height: 20,
                  width: "100%",
                  overflow: "hidden",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
                }}
              >
                <div
                  style={{
                    width: `${progresso}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${r.cor}, #a5d6a7)`,
                    transition: "width 0.6s ease-out",
                  }}
                />
              </div>
              <p
                style={{
                  marginTop: 6,
                  textAlign: "right",
                  fontSize: 14,
                  color: "#555",
                  fontWeight: "bold",
                }}
              >
                {r.nome}: {totalPontos} / {r.meta} pontos
              </p>
            </div>
          );
        })}
      </div>

      <h3>Tarefas disponíveis</h3>

      {carregando ? (
        <p>Carregando tarefas...</p>
      ) : tarefas.length === 0 ? (
        <p>⚠️ Nenhuma tarefa encontrada.</p>
      ) : (
        tarefas.map((t) => (
          <div
            key={t.col_id}
            style={{
              border: "1px solid #ccc",
              padding: 15,
              marginBottom: 10,
              borderRadius: 8,
              backgroundColor: "#f9f9f9",
            }}
          >
            <p
              style={{
                fontSize: 16,
                color: "#333", // cor mais forte
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {t.col_nome} — {t.col_ponto} pts
            </p>
            <small style={{ color: "#666" }}>
              Categoria: {t.col_cat} • Frequência: {t.col_per}
            </small>
            {t.col_descr && (
              <p style={{ marginTop: 8, color: "#555" }}>{t.col_descr}</p>
            )}
            <button
              onClick={() => concluirTarefa(t.col_id)}
              style={{
                marginTop: 10,
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                backgroundColor: "#4caf50",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ✅ Concluir
            </button>
          </div>
        ))
      )}

      <h3 style={{ marginTop: 30 }}>Histórico de tarefas concluídas</h3>

      {historico.length === 0 ? (
        <p>📭 Nenhuma tarefa concluída ainda.</p>
      ) : (
        historico.map((h) => (
          <div
            key={h.id}
            style={{
              borderBottom: "1px solid #ddd",
              padding: "8px 0",
            }}
          >
            ✅ {h.tarefa?.col_nome} — {h.tarefa?.col_ponto} pts{" "}
            <small style={{ color: "#777" }}>
              ({new Date(h.dt_conclusao).toLocaleDateString("pt-BR")})
            </small>
          </div>
        ))
      )}
    </div>
  );
}

export default App;
