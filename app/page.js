
"use client";
import { useState } from "react";
import jsPDF from "jspdf";

export default function Home() {

  const [numeroOrcamento, setNumeroOrcamento] = useState("");

  const [cliente, setCliente] = useState({
    nome: "",
    cpf: "",
    endereco: "",
    cidade: "",
    telefone: "",
    data: ""
  });

  const [formaPagamento, setFormaPagamento] = useState("");
  const [parcelas, setParcelas] = useState("");
  const [detalhesParcelas, setDetalhesParcelas] = useState([]);

  const handleParcelasChange = (qtd) => {
    let num = parseInt(qtd) || 0;
    if (num > 4) num = 4; // limit to 4x
    setParcelas(qtd);
    const newDetalhes = [...detalhesParcelas];
    if (num > newDetalhes.length) {
      for (let i = newDetalhes.length; i < num; i++) {
        newDetalhes.push({ data: "", valor: "", forma: "" });
      }
    } else if (num < newDetalhes.length) {
      newDetalhes.splice(num);
    }
    setDetalhesParcelas(newDetalhes);
  };

  const handleDetalheParcela = (index, field, value) => {
    const newDetalhes = [...detalhesParcelas];
    newDetalhes[index][field] = value;
    setDetalhesParcelas(newDetalhes);
  };

  const [items, setItems] = useState([
    { modelo: "", vidro: "", aluminio: "", medida: "", quantidade: 1, valorUnitario: 0, imagem: null }
  ]);

  const addItem = () => {
    setItems([...items, { modelo: "", vidro: "", aluminio: "", medida: "", quantidade: 1, valorUnitario: 0, imagem: null }]);
  };

  const handleChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleImage = (index, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        const newItems = [...items];
        newItems[index].imagem = dataUrl;
        setItems(newItems);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const getLogoBase64 = async () => {
    try {
      const response = await fetch('/logo.png.png');
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Erro ao carregar logo", error);
      return null;
    }
  };

  const formatarDinheiro = (valor) => {
    if (valor === "" || valor === null || valor === undefined) return "0,00";
    if (typeof valor === 'string') {
      if (valor.includes(',')) return valor;
      const num = parseFloat(valor);
      if (isNaN(num)) return valor;
      return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    const num = Number(valor);
    if (isNaN(num)) return "0,00";
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calcularTotalItem = (item) => {
    return Number(item.quantidade) * Number(item.valorUnitario);
  };

  const calcularTotalGeral = () => {
    return items.reduce((total, item) => total + calcularTotalItem(item), 0);
  };

  const gerarPDF = async () => {
    const doc = new jsPDF();
    const logoBase64 = await getLogoBase64();

    doc.setFontSize(12);
    doc.text("LINHA GLASS - COMERCIO DE VIDROS E ESQUADRIAS LTDA", 10, 10);
    doc.text("CNPJ: 13.423.167/0001-07", 10, 16);
    doc.text("Telefone: (051) 99770-0701 / (051) 98952-5909", 10, 22);

    doc.text(`Orçamento Nº: ${numeroOrcamento}`, 140, 10);

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", 140, 15);
      } catch (e) {
        console.error("Erro ao adicionar logo:", e);
      }
    }

    doc.text("Dados do Cliente:", 10, 35);
    doc.text(`Nome: ${cliente.nome}`, 10, 42);
    doc.text(`CPF/CNPJ: ${cliente.cpf}`, 10, 48);
    doc.text(`Endereço: ${cliente.endereco}`, 10, 54);
    doc.text(`Cidade: ${cliente.cidade}`, 10, 60);
    doc.text(`Telefone: ${cliente.telefone}`, 10, 66);
    doc.text(`Data: ${cliente.data}`, 10, 72);

    let y = 85;

    items.forEach((item, index) => {
      doc.setFont(undefined, 'bold');
      const nomeItem = item.modelo || item.descricao || "Não informado";
      doc.text(`Item ${index + 1}: ${nomeItem}`, 10, y);
      doc.setFont(undefined, 'normal');
      y += 6;

      if (!item.descricao && (item.vidro || item.aluminio || item.medida)) {
        doc.text(`Vidro: ${item.vidro || "-"} | Alumínio: ${item.aluminio || "-"} | Medida: ${item.medida || "-"}`, 10, y);
        y += 6;
      }

      doc.text(`Qtd: ${item.quantidade}`, 10, y);
      doc.text(`Valor Unitário: R$ ${formatarDinheiro(item.valorUnitario)}`, 60, y);
      doc.text(`Total: R$ ${formatarDinheiro(calcularTotalItem(item))}`, 140, y);

      y += 8;

      if (item.imagem) {
        try {
          doc.addImage(item.imagem, undefined, 10, y, 40, 40);
          y += 45;
        } catch (error) {
          console.log("Erro ao adicionar imagem:", error);
        }
      } else {
        y += 5;
      }
    });

    doc.setFontSize(14);
    doc.text(`Total Geral: R$ ${formatarDinheiro(calcularTotalGeral())}`, 130, y + 10);

    y += 25;
    doc.setFontSize(12);
    doc.text("Condições de Pagamento:", 10, y);
    y += 6;

    if (formaPagamento === "avista") {
      doc.text("- Pagamento à vista", 10, y);
    } else if (formaPagamento === "parcelado") {
      doc.text(`- Pagamento parcelado em ${parcelas}x`, 10, y);
      y += 6;
      if (detalhesParcelas && detalhesParcelas.length > 0) {
        detalhesParcelas.forEach((p, idx) => {
          const dataFormatada = p.data ? p.data.split('-').reverse().join('/') : 'Não informada';
          doc.text(`  Parcela ${idx + 1}: Vencimento: ${dataFormatada} | Valor: R$ ${formatarDinheiro(p.valor)} | Forma: ${p.forma || '-'}`, 10, y);
          y += 6;
        });
      }
    } else if (formaPagamento === "meio") {
      doc.text("- 50% entrada / 50% instalação", 10, y);
    } else {
      doc.text("- Não informada", 10, y);
    }

    const pdfBlob = doc.output("blob");
    const nomeArquivo = `Orcamento-${numeroOrcamento || "SemNumero"}`.replace(/[\/\?<>\\:\*\|":]/g, '-');

    try {
      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: `${nomeArquivo}.pdf`,
            types: [{
              description: 'Documento PDF',
              accept: { 'application/pdf': ['.pdf'] }
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(pdfBlob);
          await writable.close();
        } catch (pickerError) {
          if (pickerError.name === 'AbortError') return;
          // Fallback se o file picker falhar (ex: nome inválido)
          doc.save(`${nomeArquivo}.pdf`);
        }
      } else {
        // Fallback for browsers that don't support showSaveFilePicker
        doc.save(`${nomeArquivo}.pdf`);
      }
    } catch (error) {
      console.error('Erro ao salvar o arquivo', error);
      alert('Erro ao tentar salvar o arquivo.');
    }

    await exportarBackup(false);
  };

  const exportarBackup = async (silencioso = false) => {
    const isSilent = typeof silencioso === 'boolean' ? silencioso : false;
    const dados = {
      numeroOrcamento,
      cliente,
      formaPagamento,
      parcelas,
      detalhesParcelas,
      items
    };
    const json = JSON.stringify(dados);
    const blob = new Blob([json], { type: "application/json" });

    try {
      if (window.showSaveFilePicker && !isSilent) {
        const handle = await window.showSaveFilePicker({
          suggestedName: `backup-orcamento-${numeroOrcamento || "sem-numero"}.json`,
          types: [{
            description: 'Arquivo JSON',
            accept: { 'application/json': ['.json'] }
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup-orcamento-${numeroOrcamento || "sem-numero"}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao exportar backup:', error);
        if (!isSilent) alert("Erro ao tentar salvar o backup.");
      }
    }
  };

  const importarBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dados = JSON.parse(e.target.result);
        if (dados.numeroOrcamento !== undefined) setNumeroOrcamento(dados.numeroOrcamento);
        if (dados.cliente) setCliente(dados.cliente);
        if (dados.formaPagamento !== undefined) setFormaPagamento(dados.formaPagamento);
        if (dados.parcelas !== undefined) {
          setParcelas(dados.parcelas);
          // Converter backup antigo
          if (!dados.detalhesParcelas && dados.valorParcela && dados.formaParcela) {
            const qtd = parseInt(dados.parcelas) || 0;
            const detis = [];
            for (let i = 0; i < qtd; i++) {
              detis.push({ data: "", valor: dados.valorParcela, forma: dados.formaParcela });
            }
            setDetalhesParcelas(detis);
          }
        }
        if (dados.detalhesParcelas) setDetalhesParcelas(dados.detalhesParcelas);
        if (dados.items) setItems(dados.items);
      } catch (error) {
        alert("Erro ao importar backup. Arquivo inválido.");
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Limpa a seleção para permitir selecionar o mesmo arquivo novamente
  };

  const gerarRecibo = async () => {
    const valorPago = window.prompt("Digite o valor que está sendo pago neste recibo:");
    if (!valorPago) return;

    const formaPgto = window.prompt("Digite a forma de pagamento (Ex: PIX, Dinheiro, Cartão):");
    if (!formaPgto) return;

    const doc = new jsPDF();
    const logoBase64 = await getLogoBase64();

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", 140, 5);
      } catch (e) {
        console.error("Erro ao adicionar logo:", e);
      }
    }

    doc.setFontSize(18);
    doc.text("RECIBO", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text("Emitente:", 10, 35);
    doc.setFontSize(10);
    doc.text("LINHA GLASS - COMERCIO DE VIDROS E ESQUADRIAS LTDA", 10, 42);
    doc.setFontSize(12);
    doc.text("CNPJ: 13.423.167/0001-07", 10, 48);
    doc.text("Telefone: (051) 99770-0701 / (051) 98952-5909", 10, 54);

    // Destaque para o valor recebido em linha separada para evitar sobreposição
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`VALOR RECEBIDO: R$ ${formatarDinheiro(valorPago)}`, 10, 66);

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 140, 66);
    if (numeroOrcamento) {
      doc.text(`Ref. Orçamento: ${numeroOrcamento}`, 140, 72);
    }

    doc.text("Recebemos de:", 10, 85);
    doc.text(`Nome: ${cliente.nome}`, 10, 92);
    doc.text(`CPF/CNPJ: ${cliente.cpf}`, 10, 98);
    doc.text(`Endereço: ${cliente.endereco}`, 10, 104);
    doc.text(`Cidade: ${cliente.cidade}`, 10, 110);

    doc.text("Referente a:", 10, 125);
    let y = 132;
    items.forEach((item) => {
      let texto = item.descricao ? item.descricao : `${item.modelo || "Item"} (Vidro: ${item.vidro || "-"} | Alumínio: ${item.aluminio || "-"} | Medida: ${item.medida || "-"})`;
      if (item.descricao || item.modelo || item.vidro || item.aluminio || item.medida) {
        const linhas = doc.splitTextToSize(`- ${texto}`, 190);
        doc.text(linhas, 10, y);
        y += linhas.length * 6;
      }
    });

    y += 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(13);
    doc.text(`Valor Total do Orçamento: R$ ${formatarDinheiro(calcularTotalGeral())}`, 10, y);
    y += 7;
    doc.text(`Forma de Pagamento Recebida: ${formaPgto}`, 10, y);
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');

    y += 30;
    doc.text("____________________________________________________", 55, y);
    doc.text("LINHA GLASS - COMERCIO DE VIDROS E ESQUADRIAS LTDA", 48, y + 6);

    const pdfBlob = doc.output("blob");
    const nomeArquivo = `Recibo-${numeroOrcamento || cliente.nome || "Avulso"}`.replace(/[\/\?<>\\:\*\|":]/g, '-');

    try {
      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: `${nomeArquivo}.pdf`,
            types: [{
              description: 'Documento PDF',
              accept: { 'application/pdf': ['.pdf'] }
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(pdfBlob);
          await writable.close();
        } catch (pickerError) {
          if (pickerError.name === 'AbortError') return;
          // Fallback importante: o prompt anterior pode expirar o "user gesture" necessário para a API moderna
          doc.save(`${nomeArquivo}.pdf`);
        }
      } else {
        // Fallback
        doc.save(`${nomeArquivo}.pdf`);
      }
    } catch (error) {
      console.error('Erro ao salvar o recibo', error);
      alert('Erro ao tentar salvar o recibo.');
    }
  };

  return (
    <div className="container">

      <div className="header-top">
        <div>
          <h2>LINHA GLASS - COMERCIO DE VIDROS E ESQUADRIAS LTDA</h2>
          <p>CNPJ: 13.423.167/0001-07</p>
          <p>Telefone: (051) 99770-0701 / (051) 98952-5909</p>
        </div>
        <img src="/logo.png.png" alt="Logo Linha Glass" style={{ maxHeight: "90px", maxWidth: "250px", objectFit: "contain" }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
        <div className="numero-badge">
          <span>Nº Orçamento:</span>
          <input
            value={numeroOrcamento}
            onChange={(e) => setNumeroOrcamento(e.target.value)}
            placeholder="0001"
          />
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Dados do Cliente</h3>
        <div className="grid-2">
          <div className="input-group-inline"><label>Nome</label><input placeholder="Nome do Cliente" value={cliente.nome} onChange={(e) => setCliente({ ...cliente, nome: e.target.value })} /></div>
          <div className="input-group-inline"><label>CPF/CNPJ</label><input placeholder="000.000.000-00" value={cliente.cpf} onChange={(e) => setCliente({ ...cliente, cpf: e.target.value })} /></div>
          <div className="input-group-inline" style={{ gridColumn: "1 / -1" }}><label>Endereço</label><input placeholder="Rua, Número, Bairro" value={cliente.endereco} onChange={(e) => setCliente({ ...cliente, endereco: e.target.value })} /></div>
          <div className="input-group-inline"><label>Cidade</label><input placeholder="Cidade" value={cliente.cidade} onChange={(e) => setCliente({ ...cliente, cidade: e.target.value })} /></div>
          <div className="input-group-inline"><label>Telefone</label><input placeholder="(00) 00000-0000" value={cliente.telefone} onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })} /></div>
          <div className="input-group-inline"><label>Data</label><input type="date" value={cliente.data} onChange={(e) => setCliente({ ...cliente, data: e.target.value })} /></div>
        </div>
      </div>

      <h3 className="section-title">Itens do Orçamento</h3>

      {items.map((item, index) => (
        <div key={index} className="item-box">
          <div className="item-header">
            <span>Item {index + 1}</span>
          </div>

          <div className="grid-4" style={{ marginBottom: "16px" }}>
            <div className="input-group-inline"><label>Modelo</label><input placeholder="Ex: Janela" value={item.modelo || ""} onChange={(e) => handleChange(index, "modelo", e.target.value)} /></div>
            <div className="input-group-inline"><label>Tipo de Vidro</label><input placeholder="Ex: Temperado 8mm" value={item.vidro || ""} onChange={(e) => handleChange(index, "vidro", e.target.value)} /></div>
            <div className="input-group-inline"><label>Cor do Alumínio</label><input placeholder="Ex: Branco" value={item.aluminio || ""} onChange={(e) => handleChange(index, "aluminio", e.target.value)} /></div>
            <div className="input-group-inline"><label>Medidas</label><input placeholder="Ex: 2.00 x 1.20" value={item.medida || ""} onChange={(e) => handleChange(index, "medida", e.target.value)} /></div>
          </div>

          {item.descricao !== undefined && (
            <div className="input-group-inline" style={{ marginBottom: "16px" }}>
              <label>Descrição Opcional</label>
              <textarea placeholder="Detalhes adicionais..." value={item.descricao} onChange={(e) => handleChange(index, "descricao", e.target.value)} />
            </div>
          )}

          <div className="grid-3" style={{ alignItems: "flex-end" }}>
            <div className="input-group-inline">
              <label>Quantidade</label>
              <input type="number" placeholder="0" value={item.quantidade} onChange={(e) => handleChange(index, "quantidade", Number(e.target.value))} />
            </div>
            <div className="input-group-inline">
              <label>Valor Unitário (R$)</label>
              <input type="number" step="0.01" placeholder="0.00" value={item.valorUnitario} onChange={(e) => handleChange(index, "valorUnitario", e.target.value ? Number(e.target.value) : "")} />
            </div>
            <div className="input-group-inline">
              <label>Imagem de Ref. (Opcional)</label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="file" accept="image/*" onChange={(e) => handleImage(index, e.target.files[0])} style={{ flex: 1, margin: 0 }} title={item.imagem ? "Imagem salva. Selecione outra para substituir." : ""} />
                {item.imagem && (
                  <div style={{ position: "relative" }}>
                    <img src={item.imagem} alt="Preview" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px", border: "1px solid #ccc", display: "block" }} />
                    <button
                      onClick={(e) => {
                        handleChange(index, "imagem", null);
                        const input = e.target.parentElement.previousElementSibling;
                        if (input && input.type === "file") input.value = "";
                      }}
                      style={{ position: "absolute", top: "-5px", right: "-5px", background: "#ff4d4d", color: "white", border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                      title="Remover imagem"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="total-item">
            Total do Item: R$ {formatarDinheiro(calcularTotalItem(item))}
          </div>
        </div>
      ))}

      <button onClick={addItem} className="btn-outline">
        + Adicionar Novo Item
      </button>

      <div className="total-geral">
        Total Geral: R$ {formatarDinheiro(calcularTotalGeral())}
      </div>

      <div className="card pagamento">
        <h3 className="section-title">Forma de Pagamento</h3>
        <div className="input-group-inline" style={{ maxWidth: "400px" }}>
          <label>Selecione a Forma</label>
          <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
            <option value="">Selecione...</option>
            <option value="avista">Pagamento à vista</option>
            <option value="parcelado">Pagamento parcelado (Até 4x)</option>
            <option value="meio">50% entrada / 50% instalação</option>
          </select>
        </div>

        {formaPagamento === "parcelado" && (
          <div style={{ marginTop: "16px" }}>
            <div className="input-group-inline" style={{ maxWidth: "200px", marginBottom: "16px" }}>
              <label>Qtd Parcelas (Máx 4)</label>
              <input type="number" max="4" min="1" value={parcelas} onChange={(e) => handleParcelasChange(e.target.value)} />
            </div>

            {detalhesParcelas.map((parcela, index) => (
              <div key={index} className="grid-3" style={{ marginBottom: "10px", padding: "10px", border: "1px solid #eee", borderRadius: "6px", alignItems: "flex-end" }}>
                <div className="input-group-inline">
                  <label>Data Venc. {index + 1}ª Parc.</label>
                  <input type="date" value={parcela.data} onChange={(e) => handleDetalheParcela(index, "data", e.target.value)} />
                </div>
                <div className="input-group-inline">
                  <label>Valor (R$)</label>
                  <input type="number" step="0.01" placeholder="0.00" value={parcela.valor} onChange={(e) => handleDetalheParcela(index, "valor", e.target.value)} />
                </div>
                <div className="input-group-inline">
                  <label>Forma</label>
                  <input placeholder="Ex: PIX, Cartão..." value={parcela.forma} onChange={(e) => handleDetalheParcela(index, "forma", e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="btn-actions-container">
        <button onClick={gerarPDF} className="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Baixar Orçamento (PDF)
        </button>

        <button onClick={gerarRecibo} className="btn-warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Gerar Recibo (PDF)
        </button>

        <label className="btn-success" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "12px 24px", borderRadius: "6px", fontSize: "15px", fontWeight: "600", transition: "all 0.2s ease", cursor: "pointer", gap: "8px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Carregar Backup
          <input type="file" accept=".json" onChange={importarBackup} style={{ display: "none" }} />
        </label>
      </div>

    </div>
  );
}
