function toNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function sumGroup(groupTotals, key) {
  return toNumber(groupTotals[key] || 0);
}

function buildDRE(groupTotals) {
  // Blocos base
  const receitaBruta = sumGroup(groupTotals, "RECEITA_BRUTA");
  const deducoes = sumGroup(groupTotals, "DEDUCOES");
  const receitaLiquida = receitaBruta - deducoes;

  const custos = sumGroup(groupTotals, "CUSTOS");
  const lucroBruto = receitaLiquida - custos;

  const despesasVendas = sumGroup(groupTotals, "DESPESAS_VENDAS");
  const despesasAdmin = sumGroup(groupTotals, "DESPESAS_ADMIN");
  const despesasOperacionais = despesasVendas + despesasAdmin;

  const ebit = lucroBruto - despesasOperacionais;

  const despesasFinanceiras = sumGroup(groupTotals, "DESPESAS_FINANCEIRAS");
  const outrasReceitas = sumGroup(groupTotals, "OUTRAS_RECEITAS");
  const outrasDespesas = sumGroup(groupTotals, "OUTRAS_DESPESAS");

  const resultadoFinanceiro = outrasReceitas - despesasFinanceiras - outrasDespesas;
  const resultadoLiquido = ebit + resultadoFinanceiro;

  // Margens (evita divisão por zero)
  const margemLiquida = receitaBruta !== 0 ? (resultadoLiquido / receitaBruta) : 0;
  const margemBruta = receitaBruta !== 0 ? (lucroBruto / receitaBruta) : 0;

  return {
    grupos: groupTotals, // detalhe por grupo (para tabela)
    totais: {
      receitaBruta,
      deducoes,
      receitaLiquida,
      custos,
      lucroBruto,
      despesasOperacionais,
      ebit,
      resultadoFinanceiro,
      resultadoLiquido,
      margemBruta,
      margemLiquida
    }
  };
}

module.exports = { buildDRE };