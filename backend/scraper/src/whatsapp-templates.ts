/**
 * Biblioteca de 365 templates motivacionais (1 pra cada dia do ano).
 * Sistema escolhe pra cada aluna o template_key com menor numero que
 * ela AINDA NAO recebeu (via dedup no whatsapp_outbox). Quando esgotar,
 * recomeca do 001.
 *
 * Tom: caloroso, especifico, sem motivacional de coach. "Yara" eh a
 * mascote/mentora — pode assinar com ela. Mensagens curtas (3-7 linhas),
 * markdown WhatsApp (*bold*, _italic_).
 *
 * 12 famılias tematicas (~30 cada):
 *   001-030 rotina           daily habit, 3 itens, disciplina
 *   031-060 constancia       presenca diaria > viral
 *   061-090 comparacao       seu ritmo, seu timing
 *   091-120 cansaco          quase desistir, persistir
 *   121-150 faturamento      primeiras vendas, dinheiro
 *   151-180 live             medo da camera, ao vivo
 *   181-210 ranking/comunid  voce nao ta sozinha
 *   211-240 produto          escolher, testar, criar
 *   241-270 aprendizado      aulas, ebooks, metodo
 *   271-300 estrategia       dicas praticas, hooks, conteudo
 *   301-330 proposito        por que comecou, significado
 *   331-365 celebracao       pequenas vitorias, agradecimento
 */

export type MotivationalEntry = {
  key: string;
  theme: string;
  text: string;
};

function firstName(name: string | null | undefined): string {
  if (!name) return "amiga";
  const first = name.trim().split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/**
 * Renderiza o texto com placeholders interpolados.
 * Hoje so usa {{name}}. Se precisar de mais var no futuro, adiciona aqui.
 */
export function renderMotivational(
  entry: MotivationalEntry,
  input: { firstName: string | null },
): string {
  const name = firstName(input.firstName);
  return entry.text.replace(/\{\{name\}\}/g, name);
}

// =============================================================================
// 001-030: ROTINA — bater a rotina diaria, 3 itens, 5 minutos
// =============================================================================
const ROTINA: MotivationalEntry[] = [
  { key: "motivacional_001", theme: "rotina", text: "Oi {{name}}! 💕\n\nSó vim te lembrar: *5 minutinhos na rotina hoje* já te coloca à frente de quem só promete começar amanhã.\n\nBora?\n\n_Yara · Método TTS_" },
  { key: "motivacional_002", theme: "rotina", text: "{{name}}, bom dia ☀️\n\nA rotina não é cobrança — é um *acordo seu com você mesma*. 3 itens. Marca o que conseguir, sem culpa pelo que não.\n\nVocê tá indo bem." },
  { key: "motivacional_003", theme: "rotina", text: "{{name}}, observa uma coisa: as criadoras que crescem no TikTok Shop NÃO são as mais talentosas. *São as mais constantes.*\n\nSua rotina de hoje vale mais do que 1 vídeo viral perdido na próxima semana." },
  { key: "motivacional_004", theme: "rotina", text: "Oi {{name}} 🌹\n\nSe hoje você só conseguir UM item da rotina, já tá ótimo. Constância não é perfeição. É reaparecer.\n\nAbre o app. Marca o que conseguiu. Pronto." },
  { key: "motivacional_005", theme: "rotina", text: "{{name}}, lembra:\n\n*1 hora por dia = 365 horas no ano.*\n\nÉ isso que separa quem vai longe no TikTok Shop de quem fica parada. E começa com os 5min da rotina." },
  { key: "motivacional_006", theme: "rotina", text: "Ei {{name}} 👋\n\nDisciplina não é acordar com vontade. É *fazer mesmo sem vontade*. Por isso a rotina do app foi pensada curta — pra você não ter desculpa boa pra pular.\n\n5 minutos. Vai lá 💪" },
  { key: "motivacional_007", theme: "rotina", text: "{{name}}, *hoje conta*.\n\nAmanhã você vai querer estar mais perto do seu objetivo do que tá hoje. A única forma é fazer hoje o que importa.\n\nBate a rotina 🌹" },
  { key: "motivacional_008", theme: "rotina", text: "Oi {{name}}!\n\nSabe o que tem em comum quem fatura 10 mil/mês no TikTok Shop? *Elas batem a rotina antes do 1° café.* Faz parte do dia, igual escovar dente.\n\nTenta isso essa semana — vai mudar tudo." },
  { key: "motivacional_009", theme: "rotina", text: "{{name}} 💕\n\nVocê não precisa de motivação. Precisa de *hábito*. Motivação vai e vem; hábito fica.\n\nA rotina é como você instala o hábito. 3 itens, todo dia. Simples assim." },
  { key: "motivacional_010", theme: "rotina", text: "{{name}}, vou ser direta:\n\nQuem só faz quando tá inspirada NUNCA vai vencer no TikTok Shop. Você precisa fazer no dia ruim também. *Principalmente* no dia ruim.\n\nBate a rotina hoje 🔥" },
  { key: "motivacional_011", theme: "rotina", text: "Oi {{name}} ☀️\n\nDica de ouro: faz a rotina assim que acordar. Antes do celular, antes do café. *Tira do caminho.* O dia inteiro vira mais leve.\n\nTesta hoje." },
  { key: "motivacional_012", theme: "rotina", text: "{{name}}, a rotina parece pequena MAS ela tá te treinando.\n\nTreinando você a *aparecer*. Aparecer no app, aparecer pro seu público, aparecer pra sua meta. Não subestima.\n\nBora?" },
  { key: "motivacional_013", theme: "rotina", text: "{{name}} 🌹\n\nUma rotina batida hoje > zero rotinas perfeitas planejadas.\n\nNão precisa estar bonita pra fazer. Só precisa começar." },
  { key: "motivacional_014", theme: "rotina", text: "Oi {{name}}!\n\nSe você bateu rotina ontem, *NÃO QUEBRA HOJE*. Streaks são poderosos demais — cada dia a mais te dá mais energia pro próximo.\n\nVai lá 💪" },
  { key: "motivacional_015", theme: "rotina", text: "{{name}}, lembra:\n\nO TikTok premia *frequência*. Quem aparece todo dia, mesmo com vídeo mais ou menos, sempre vai mais longe do que quem posta 1 vídeo perfeito por semana.\n\nA rotina é seu treino pra essa frequência." },
  { key: "motivacional_016", theme: "rotina", text: "Bom dia {{name}} ☀️\n\nHoje não é dia de planejar. É dia de *fazer*. Rotina, gravação, live. 1 ação. Só uma. Mas hoje.\n\nVai 🌹" },
  { key: "motivacional_017", theme: "rotina", text: "{{name}}, ó:\n\nDisciplina é se importar com você o suficiente pra fazer o que precisa, mesmo cansada.\n\nA rotina é um ato de amor próprio. *Faz por você.*" },
  { key: "motivacional_018", theme: "rotina", text: "Oi {{name}} 💕\n\nNão precisa fazer A MAIS hoje. Só não faz A MENOS. A rotina é o mínimo que te mantém viva no jogo.\n\nBate aí." },
  { key: "motivacional_019", theme: "rotina", text: "{{name}}, *3 itens. 5 minutos.* É isso.\n\nSe você acha que não tem tempo, tem. A questão é prioridade. E você se priorizou hoje quando comprou esse acesso.\n\nHonra essa escolha 🔥" },
  { key: "motivacional_020", theme: "rotina", text: "{{name}}, sabia?\n\nA cada 7 dias seguidos de rotina, seu cérebro cria uma *nova via neural* desse hábito. Em 21 dias, vira automático. Em 66, é parte de quem você é.\n\nHoje é mais um tijolinho 🧱" },
  { key: "motivacional_021", theme: "rotina", text: "Oi {{name}}!\n\nNão pula a rotina hoje. Mesmo se for marcar tudo \"fiz pouco\". *O ato de abrir o app e clicar já vale demais.*\n\nA presença muda tudo." },
  { key: "motivacional_022", theme: "rotina", text: "{{name}} 🌹\n\nAs meninas no topo do ranking não são as que mais sabem. São as que mais *fazem*. E fazer começa todo dia, na rotina.\n\nVocê tá no jogo. Joga." },
  { key: "motivacional_023", theme: "rotina", text: "{{name}}, *consistência > intensidade.*\n\nMelhor 5min todo dia do que 2h um dia e zero por 10. Seu cérebro precisa do RITMO, não da força bruta.\n\nA rotina foi feita pra isso 💕" },
  { key: "motivacional_024", theme: "rotina", text: "Oi {{name}} ☀️\n\nDia ruim? Bate a rotina mesmo assim. Dia bom? Bate também. Dia médio? Bate.\n\nA gente NÃO escolhe se faz com base no humor. Faz e pronto. Aí o humor melhora." },
  { key: "motivacional_025", theme: "rotina", text: "{{name}}, lembra que TUDO conta?\n\nUma rotina batida hoje vira streak, streak vira hábito, hábito vira identidade, identidade vira resultado. *Começa pequeno, vira gigante.*" },
  { key: "motivacional_026", theme: "rotina", text: "{{name}} 💕\n\nSe você bateu rotina nos últimos 3 dias, *NÃO QUEBRA agora*. Voltar a começar do zero dói 10x mais do que continuar.\n\nMais 1 dia. Só hoje." },
  { key: "motivacional_027", theme: "rotina", text: "Oi {{name}}!\n\nA rotina não promete sucesso da noite pro dia. Mas garante uma coisa: *você vai estar inteira no dia em que a chance aparecer.*\n\nTreina hoje." },
  { key: "motivacional_028", theme: "rotina", text: "{{name}}, hoje a missão é simples:\n\n1. Abrir o app\n2. Marcar a rotina\n3. Fechar\n\nÉ literalmente 1 minuto. Vai lá 🔥" },
  { key: "motivacional_029", theme: "rotina", text: "{{name}} 🌹\n\nQuanto mais simples a meta diária, *maior a chance de você bater*. Por isso a rotina tem só 3 itens. Não é preguiça do app — é estratégia.\n\nUsa a seu favor." },
  { key: "motivacional_030", theme: "rotina", text: "Bom dia {{name}} ☀️\n\nNova semana começa hoje. Não precisa virar a chave. Só precisa *bater a rotina*. O resto vem.\n\nVocê consegue 💪" },
];

// =============================================================================
// 031-060: CONSTANCIA — presenca diaria > viralizar, mostra-se aparecer
// =============================================================================
const CONSTANCIA: MotivationalEntry[] = [
  { key: "motivacional_031", theme: "constancia", text: "{{name}}, dado real:\n\n*87% dos criadores que viralizam já tinham mais de 300 vídeos postados.* O viral não é sorte. É o resultado de centenas de tentativas.\n\nA cada vídeo que você posta, você tá comprando uma chance." },
  { key: "motivacional_032", theme: "constancia", text: "Oi {{name}} 💕\n\nVocê NÃO precisa do vídeo perfeito. Precisa do *próximo vídeo*. Postado. Hoje.\n\nO TikTok não recompensa quem planeja. Recompensa quem posta." },
  { key: "motivacional_033", theme: "constancia", text: "{{name}}, *aparecer todo dia é um superpoder.*\n\nNão de quem mais sabe. De quem fica firme quando os outros desistem. E todo mundo desiste em algum momento — esse é seu portal." },
  { key: "motivacional_034", theme: "constancia", text: "Ei {{name}} 🌹\n\nA pessoa que vai estourar daqui 6 meses tá postando *hoje*, mesmo sem ver resultado. Você pode ser ela.\n\nMas só se você postar hoje." },
  { key: "motivacional_035", theme: "constancia", text: "{{name}}, presta atenção:\n\n*O primeiro mês é o mais duro.* Você posta, ninguém vê, ninguém comenta. Continua. O 2° mês começa a virar. O 3° mês muda tudo.\n\nMantém o ritmo." },
  { key: "motivacional_036", theme: "constancia", text: "{{name}} ✨\n\nQuem só posta quando \"tá inspirada\" perdeu o jogo. Inspiração é luxo. *Hábito é arma.*\n\nPosta hoje, mesmo sem vontade." },
  { key: "motivacional_037", theme: "constancia", text: "Oi {{name}}!\n\nO algoritmo do TikTok ama uma coisa: *previsibilidade*. Conta que posta no mesmo horário, mesmo nicho, todo dia — é o que ele empurra mais.\n\nSeja previsível. Algoritmo te ama assim." },
  { key: "motivacional_038", theme: "constancia", text: "{{name}}, real talk:\n\nNão tem atalho. Só tem caminho — e ele é diário. *Pequeno passo, todo dia.* É lento até virar não-lento.\n\nFica firme 🔥" },
  { key: "motivacional_039", theme: "constancia", text: "Bom dia {{name}} ☀️\n\nMeta do dia: 1 vídeo postado. Não importa se ficou bom. Importa que existe. *Vídeo que não existe não cresce.*\n\nVai 🌹" },
  { key: "motivacional_040", theme: "constancia", text: "{{name}}, *aparecer NÃO é vaidade*. É marketing. É treinamento. É construção.\n\nCada vídeo que você posta hoje é um soldado seu trabalhando enquanto você dorme. E eles compostam." },
  { key: "motivacional_041", theme: "constancia", text: "Oi {{name}} 💕\n\nQuem tá há 6 meses postando todo dia, mesmo sem resultado, tá *MUITO mais perto do viral* do que quem postou 3 vídeos lindos no mês passado.\n\nVolume + tempo = resultado." },
  { key: "motivacional_042", theme: "constancia", text: "{{name}}, lembra:\n\nO TikTok premia quem fica. Quem aparece todo dia. Quem é parte do feed. *Você quer ser parte do feed.*\n\nHoje. Posta." },
  { key: "motivacional_043", theme: "constancia", text: "{{name}} 🌹\n\nVocê não precisa ser a melhor. Precisa ser a que *aparece sempre*. As pessoas confiam em quem é constante.\n\nConfiança vira venda." },
  { key: "motivacional_044", theme: "constancia", text: "Ei {{name}}!\n\nCombinado pra essa semana: 1 vídeo por dia. Não 7 vídeos lindos no domingo. *1 por dia, mesmo zoado.*\n\nFunciona 🔥" },
  { key: "motivacional_045", theme: "constancia", text: "{{name}}, *o vídeo zoado postado* vence o vídeo perfeito gravado e nunca publicado. Sempre.\n\nFeito > perfeito. Sempre." },
  { key: "motivacional_046", theme: "constancia", text: "Oi {{name}} ✨\n\nNão olha o número de visualizações ainda. Olha o número de *vídeos postados*. Esse é o KPI que importa nos primeiros 90 dias.\n\nConta os teus dessa semana. Mira em mais na próxima." },
  { key: "motivacional_047", theme: "constancia", text: "{{name}}, dado curioso:\n\nO algoritmo te \"testa\" nos primeiros 90 dias. Se você posta consistente, ele aprende seu nicho e começa a empurrar. *Se você some, ele esquece.*\n\nFica firme nesses 90 dias." },
  { key: "motivacional_048", theme: "constancia", text: "{{name}} 💕\n\nViralizar é raro. Crescer é certo — se você não parar. *Não pare.*\n\nPosta hoje. Mesmo se for o pior vídeo da semana." },
  { key: "motivacional_049", theme: "constancia", text: "Oi {{name}}!\n\nQuem joga 1 partida por semana NUNCA vai vencer quem joga 7. *Você precisa estar no jogo todo dia.*\n\nPosta. Aparece. Existe." },
  { key: "motivacional_050", theme: "constancia", text: "{{name}}, *o viral não é uma estrela* — é uma escada. E cada degrau é um vídeo postado.\n\nSobe um degrau hoje." },
  { key: "motivacional_051", theme: "constancia", text: "Bom dia {{name}} ☀️\n\nSegunda-feira é dia de virar a chave: *vai postar todo dia essa semana?* Compromisso comigo mesma. Eu tô aqui torcendo.\n\nVai 🌹" },
  { key: "motivacional_052", theme: "constancia", text: "{{name}} 🔥\n\nMETA: 30 vídeos em 30 dias. Independente da qualidade. *Posta o que tiver.* O algoritmo precisa de matéria-prima pra te entender." },
  { key: "motivacional_053", theme: "constancia", text: "Oi {{name}} 💕\n\nQuem viralizou esse mês *começou há mais de 1 ano postando sem ninguém ver*. Você tá no começo dela. Continua." },
  { key: "motivacional_054", theme: "constancia", text: "{{name}}, *você não tá atrasada*. Tá no tempo certo. Quem começou hoje vai colher daqui 3-6 meses. Quem desistiu há 3 meses tá zerada.\n\nA diferença é a constância." },
  { key: "motivacional_055", theme: "constancia", text: "{{name}} 🌹\n\nA cada semana que passa sem você postar, *outra criadora ocupa o lugar que era seu*. O nicho é vago, mas é ocupado.\n\nReclama o seu hoje." },
  { key: "motivacional_056", theme: "constancia", text: "Oi {{name}}!\n\nUma das coisas mais bonitas do TikTok: você pode postar um vídeo SEM ENGAJAMENTO hoje, e ele *bombar daqui 30 dias*. Conteúdo não morre. Só amadurece.\n\nPosta tranquila." },
  { key: "motivacional_057", theme: "constancia", text: "{{name}}, *o vídeo que você não postou nunca vai performar*. Óbvio? Mas você precisa ouvir hoje.\n\nQual o vídeo que tá engavetado? Posta." },
  { key: "motivacional_058", theme: "constancia", text: "{{name}} ✨\n\nNão precisa ser perfeita. Precisa ser frequente. *O TikTok ama frequência muito mais do que perfeição.*\n\nPosta hoje. Mesmo zoado. Posta." },
  { key: "motivacional_059", theme: "constancia", text: "Oi {{name}} 💕\n\nFila tá longa hoje. Mas você tá nela. *Não sai.* Quem fica na fila é quem chega no balcão.\n\nFica firme 🌹" },
  { key: "motivacional_060", theme: "constancia", text: "{{name}}, *aparecer todo dia é tudo*. Mesmo no dia em que ninguém vê. Mesmo no dia em que parece inútil.\n\nUm dia você vai olhar pra trás e ver que esses dias \"inúteis\" foram a base de tudo." },
];

// =============================================================================
// 061-090: COMPARACAO — seu ritmo, seu tempo
// =============================================================================
const COMPARACAO: MotivationalEntry[] = [
  { key: "motivacional_061", theme: "comparacao", text: "{{name}}, *para de comparar seu capítulo 2 com o capítulo 30 dos outros*.\n\nVocê tá começando. Eles começaram também. A diferença é só o tempo." },
  { key: "motivacional_062", theme: "comparacao", text: "Oi {{name}} 💕\n\nA criadora que você admira ESTAVA no seu lugar há 1, 2, 3 anos. Postando sem ninguém ver. Olhando pra outras admirar.\n\nVocê é ela, só que ainda não terminou." },
  { key: "motivacional_063", theme: "comparacao", text: "{{name}}, lembra:\n\nVocê NÃO sabe quantos vídeos a criadora viral postou antes daquele um. Pode ter sido 1000. O algoritmo só te mostrou o que pegou.\n\nSeu \"está atrás\" pode ser muito mais perto do que parece." },
  { key: "motivacional_064", theme: "comparacao", text: "{{name}} 🌹\n\nFoco no seu jogo. Comparação é o ladrão da alegria — e da consistência. Cada criadora tem seu ritmo, seu público, sua hora.\n\nA sua hora tá vindo." },
  { key: "motivacional_065", theme: "comparacao", text: "Oi {{name}}!\n\nSabe o que ninguém posta no TikTok? *Os primeiros 200 vídeos com 50 visualizações*. Mas todo mundo passou por isso.\n\nVocê tá vivendo o normal. Não desiste no normal." },
  { key: "motivacional_066", theme: "comparacao", text: "{{name}} ✨\n\nA pessoa que postou hoje e bombou *já desistiu uma vez antes*. Quase todas as criadoras grandes têm uma história de \"quase parei aqui\".\n\nNão pare aqui." },
  { key: "motivacional_067", theme: "comparacao", text: "{{name}}, comparar com o sucesso dos outros sem ver o trabalho deles é o caminho mais rápido pra você se sentir insuficiente.\n\n*Eles trabalharam.* Trabalha você também. O resultado vem." },
  { key: "motivacional_068", theme: "comparacao", text: "Oi {{name}} 💕\n\nSeu nicho TEM espaço pra você. As pessoas que te seguem não vão seguir a outra criadora — *elas querem VOCÊ*.\n\nSeu jeito. Sua voz. Sua história." },
  { key: "motivacional_069", theme: "comparacao", text: "{{name}}, *vc tá no Tiktok há quanto tempo?* Aposto que menos do que pensa.\n\nMuita gente acha que tá há \"muito tempo\" quando tá há 2 meses. 2 meses é o começo. Continua." },
  { key: "motivacional_070", theme: "comparacao", text: "{{name}} 🌹\n\nNão olha o quanto a outra cresceu. Olha o quanto VOCÊ cresceu desde semana passada. Esse é o KPI que importa.\n\nSeu único concorrente é você de ontem." },
  { key: "motivacional_071", theme: "comparacao", text: "Oi {{name}} ☀️\n\nUma coisa que mudou minha vida: parei de seguir criadoras que me faziam sentir mal e comecei a seguir as que me ensinavam.\n\nLimpa seu feed essa semana. Faz uma faxina." },
  { key: "motivacional_072", theme: "comparacao", text: "{{name}}, *seu sucesso não tira o sucesso de ninguém*. E o sucesso de ninguém tira o seu.\n\nO TikTok Shop tem espaço pra MILHARES de criadoras viverem bem. Inclusive você." },
  { key: "motivacional_073", theme: "comparacao", text: "{{name}} 💕\n\nA \"concorrência\" virou amiga quando você percebe que vocês tão jogando o mesmo jogo, só em campos diferentes. *Não existe competição. Existe ritmo.*\n\nO seu é único." },
  { key: "motivacional_074", theme: "comparacao", text: "Oi {{name}}!\n\nVocê não tá atrasada. Tá no seu tempo. *O tempo certo é o que você consegue manter sem desistir.*\n\nNão acelera. Sustenta." },
  { key: "motivacional_075", theme: "comparacao", text: "{{name}} 🔥\n\nA criadora que parece estar 5 anos à frente — ela TÁ 5 anos à frente. Vai estar você daqui 5 anos se você continuar.\n\nCedo demais pra desistir. Tarde demais pra parar." },
  { key: "motivacional_076", theme: "comparacao", text: "{{name}}, *parar pra invejar é parar pra perder*.\n\nO tempo que você passa olhando o sucesso da outra é tempo que você não tá construindo o seu. Vira o celular. Trabalha." },
  { key: "motivacional_077", theme: "comparacao", text: "Oi {{name}} 🌹\n\nTodo dia que você compara, você sangra um pouquinho. Todo dia que você FAZ, você cresce um pouquinho.\n\nQual dos dois você vai escolher hoje?" },
  { key: "motivacional_078", theme: "comparacao", text: "{{name}} ✨\n\nVocê NÃO precisa do que ela tem. Você precisa do que VOCÊ tem — usado direito.\n\nSeu produto, sua voz, seu rosto, sua história. Combinação única." },
  { key: "motivacional_079", theme: "comparacao", text: "Bom dia {{name}} ☀️\n\nLembra: *o feed do Insta/TikTok mostra o highlight, nunca o backstage*. Você tá comparando seu dia inteiro com o melhor minuto dela.\n\nInjusto contigo. Para." },
  { key: "motivacional_080", theme: "comparacao", text: "{{name}}, *o algoritmo nunca te mostra quem tá igual a você*. Só te mostra quem já chegou. Por isso a sensação é que tá todo mundo na frente.\n\nNão tá. Você só não vê quem tá do seu lado." },
  { key: "motivacional_081", theme: "comparacao", text: "Oi {{name}} 💕\n\nVocê é a única criadora do TikTok Shop com a *combinação exata* do que você é. Ninguém vai te substituir.\n\nFoco em você. O nicho te espera." },
  { key: "motivacional_082", theme: "comparacao", text: "{{name}}, *parar pra reclamar do quanto a outra cresceu* não te faz crescer junto. Só te paralisa.\n\nUsa essa energia pra postar o próximo vídeo. Conta de novo. Vai." },
  { key: "motivacional_083", theme: "comparacao", text: "{{name}} 🌹\n\nVocê pode achar que tá lenta. Mas tá em movimento. *Quem tá lenta vence quem tá parada todas as vezes.*\n\nContinua o movimento." },
  { key: "motivacional_084", theme: "comparacao", text: "Oi {{name}}!\n\nQuase todo mundo no TikTok Shop *parece* estar à frente. Mas a maioria tá editando 5 vídeos pra postar 1.\n\nVocê posta 1 zoado e tá no jogo. Vantagem sua." },
  { key: "motivacional_085", theme: "comparacao", text: "{{name}}, *tempo de tela alheio não vira seu*. O quanto você olha o sucesso da outra, é o quanto você não tá construindo o seu.\n\nFecha o app, abre o método. Trabalha." },
  { key: "motivacional_086", theme: "comparacao", text: "{{name}} 💕\n\nO sucesso da outra é prova de que dá certo — não prova de que você é menor. *Se ela conseguiu, é POSSÍVEL pra você.*\n\nUsa como motor, não como freio." },
  { key: "motivacional_087", theme: "comparacao", text: "Oi {{name}} ✨\n\nCada criadora tem seu \"vai bombar\". O timing é diferente. *O seu não atrasou. Só ainda não chegou.*\n\nMas chega. Se você continuar." },
  { key: "motivacional_088", theme: "comparacao", text: "{{name}}, *você é a sua única referência válida*.\n\nA cada semana, compara você-hoje com você-de-7-dias-atrás. Tá melhor? Ótimo. Não tá? Ajusta. Só isso." },
  { key: "motivacional_089", theme: "comparacao", text: "Bom dia {{name}} 🌹\n\nNova semana. Novo combinado: zero comparação. *Foco no seu jogo, com tudo o que você tem hoje.*\n\nVai." },
  { key: "motivacional_090", theme: "comparacao", text: "{{name}} 🔥\n\nA criadora dos seus sonhos *foi você* — só que daqui um tempo. Continua o caminho. Não desvia. Não para. Não compara.\n\nVocê chega." },
];

// =============================================================================
// 091-120: CANSACO / DESISTIR / PERSISTIR
// =============================================================================
const CANSACO: MotivationalEntry[] = [
  { key: "motivacional_091", theme: "cansaco", text: "{{name}}, tá pensando em desistir hoje?\n\n*Não desiste hoje.* Desiste amanhã. E aí amanhã, repete o mesmo combinado.\n\nFunciona." },
  { key: "motivacional_092", theme: "cansaco", text: "Oi {{name}} 💕\n\nSe tá cansada, tá tudo bem. Mas *cansada não é parada*. Faz o mínimo hoje. Marca um item da rotina. Posta um vídeo curtinho.\n\nO mínimo te mantém viva no jogo." },
  { key: "motivacional_093", theme: "cansaco", text: "{{name}}, *quase todo mundo desiste umas 3 semanas antes do resultado aparecer*. É o pior padrão. A gente vai embora bem antes do prêmio.\n\nFica mais 1 semana. Vê o que acontece." },
  { key: "motivacional_094", theme: "cansaco", text: "Ei {{name}} 🌹\n\nDia ruim NÃO significa fracasso. Significa que você é gente. Gente cansa. Gente desanima. Gente duvida.\n\n*Gente também volta.* Volta amanhã." },
  { key: "motivacional_095", theme: "cansaco", text: "{{name}}, ouve uma coisa:\n\nO que você tá sentindo agora — a vontade de parar — *é EXATAMENTE o que toda criadora que venceu sentiu*. A diferença foi continuar mesmo assim." },
  { key: "motivacional_096", theme: "cansaco", text: "{{name}} 💕\n\nSe hoje você não consegue postar, não posta. *Só não some.* Abre o app, olha a rotina, marca o que conseguiu. Voltar amanhã fica mais fácil." },
  { key: "motivacional_097", theme: "cansaco", text: "Oi {{name}}!\n\nFazer o que importa quando tá inspirada é fácil. *Fazer quando NÃO tá inspirada é o que separa as criadoras das fãs de criadoras.*\n\nFaz hoje, mesmo sem vontade." },
  { key: "motivacional_098", theme: "cansaco", text: "{{name}}, vou ser honesta:\n\nÉ DURO. Não tem como amaciar. Crescer no TikTok Shop é trabalhoso. Mas você sabia disso quando começou.\n\nA diferença pra quem vence é só uma: *elas continuaram quando ficou duro*." },
  { key: "motivacional_099", theme: "cansaco", text: "{{name}} 🌹\n\nVocê não tá fracassando. Tá *no meio*. O meio sempre é a pior parte — o entusiasmo do início acabou, e o resultado do fim ainda não chegou.\n\nMas o meio passa. Sempre passa." },
  { key: "motivacional_100", theme: "cansaco", text: "{{name}}, *100 mensagens já*. Se você tá lendo essa, você não desistiu. Já é vitória.\n\nMais 1 dia. Bora?" },
  { key: "motivacional_101", theme: "cansaco", text: "Oi {{name}} ✨\n\nDescansa quando precisar. Mas *não desiste*. São coisas DIFERENTES.\n\nDescansar é se recompor. Desistir é se apagar. Você merece se recompor — não se apagar." },
  { key: "motivacional_102", theme: "cansaco", text: "{{name}} 💕\n\nO desânimo que você sente hoje, *você já sentiu antes*. E voltou. Você sempre volta. Isso é quem você é.\n\nVai voltar hoje também." },
  { key: "motivacional_103", theme: "cansaco", text: "{{name}}, lembra:\n\nO algoritmo NÃO sabe que você tá cansada. *Não vai esperar você descansar pra te empurrar*. Faz o mínimo, mesmo zoado, mesmo cansada. Pra ele você tá presente — é só isso que conta." },
  { key: "motivacional_104", theme: "cansaco", text: "Oi {{name}} 🌹\n\nQuando der vontade de parar, lembra: *isso é normal*. Não é sinal de que você escolheu errado. É sinal de que você tá no caminho.\n\nQuem não cansa não tá fazendo nada novo." },
  { key: "motivacional_105", theme: "cansaco", text: "{{name}}, *você não precisa ser produtiva o tempo todo*. Mas precisa ser presente.\n\n5 minutos por dia já é presença. Não some por uma semana inteira — isso quebra." },
  { key: "motivacional_106", theme: "cansaco", text: "{{name}} ☀️\n\nHoje, *meta única: não desistir*. Não precisa postar viral, não precisa bombar. Só não some.\n\nAmanhã a gente acelera. Hoje, sobrevive." },
  { key: "motivacional_107", theme: "cansaco", text: "Oi {{name}}!\n\nLembra o motivo pelo qual você começou? *Volta nele agora.* Escreve num papel. Lê todo dia.\n\nO motivo é o que te segura quando o cansaço bate." },
  { key: "motivacional_108", theme: "cansaco", text: "{{name}}, *desistir é definitivo. Pausar é estratégico.*\n\nSe tá quebrada, pausa 1 dia. Se tá só preguiçosa, faz o mínimo. Mas não desiste — desistir não te traz alívio. Só remorso." },
  { key: "motivacional_109", theme: "cansaco", text: "{{name}} 💕\n\nSe você desistir hoje, *vai ter que recomeçar do zero amanhã*. Pesa muito mais. Não faz isso com você-de-amanhã.\n\nContinua, mesmo lentinho." },
  { key: "motivacional_110", theme: "cansaco", text: "Oi {{name}} 🌹\n\nQuase desistir faz parte. Tem dias que a gente jura que vai sair fora. *Tá tudo bem sentir isso.* O importante é não sair de verdade.\n\nFica. Mais 1 dia." },
  { key: "motivacional_111", theme: "cansaco", text: "{{name}}, *quem desiste sempre acha que tá tomando uma decisão racional*. Não tá. Tá tomando uma decisão emocional num dia ruim.\n\nNUNCA decida desistir num dia ruim. Decide num dia bom." },
  { key: "motivacional_112", theme: "cansaco", text: "{{name}} ✨\n\nVocê não fracassou. Você só ainda não chegou. *Frustração é diferente de fracasso.*\n\nFica firme. Tô do seu lado." },
  { key: "motivacional_113", theme: "cansaco", text: "Oi {{name}} 💕\n\nO TikTok Shop não é uma corrida de 100m. É maratona. Quem desiste no km 5 não viu o caminho que tinha do km 6 ao 42.\n\nKm 5 é normal cansar. Continua." },
  { key: "motivacional_114", theme: "cansaco", text: "{{name}}, *o cansaço é informação*. Tá te dizendo: \"diminui o ritmo, mas não para\". Escuta.\n\nReduz a meta hoje pela metade. Mas mantém presença." },
  { key: "motivacional_115", theme: "cansaco", text: "{{name}} 🌹\n\nDia em que você quase desistiu mas continuou *vale por 10 dias normais*. Tá construindo músculo emocional. Vai precisar dele lá na frente.\n\nFica firme hoje." },
  { key: "motivacional_116", theme: "cansaco", text: "Oi {{name}}!\n\nLembra que toda criadora bem sucedida teve seu \"quase parei\". A diferença pra você é só o tempo.\n\n*Você tá vivendo o capítulo dela. Continua escrevendo.*" },
  { key: "motivacional_117", theme: "cansaco", text: "{{name}} 🔥\n\nDor é inevitável. Sofrimento é opcional. Cansaço, sim. *Desistir, não.* Pode descansar — só não vai embora.\n\nDescansa. Volta amanhã." },
  { key: "motivacional_118", theme: "cansaco", text: "{{name}}, *o pior dia de quem continua > o melhor dia de quem desistiu*.\n\nPensa nisso quando bater a vontade de soltar tudo. Sua versão piorada continuando ainda tá ganhando do seu eu desistido." },
  { key: "motivacional_119", theme: "cansaco", text: "Oi {{name}} 💕\n\nVocê NÃO precisa estar 100% pra fazer alguma coisa. Pode tá em 30%, 40%. Faz a 30%. *Faz mal feito.* Só faz.\n\nFeito sempre vence parado." },
  { key: "motivacional_120", theme: "cansaco", text: "{{name}} 🌹\n\nSe você chegou até aqui, *você consegue chegar mais longe*. A prova é o caminho que você já fez. Olha pra trás — olha o quanto você já cresceu.\n\nMais um passo. Hoje." },
];

// =============================================================================
// 121-150: FATURAMENTO / DINHEIRO / PRIMEIRAS VENDAS
// =============================================================================
const FATURAMENTO: MotivationalEntry[] = [
  { key: "motivacional_121", theme: "faturamento", text: "{{name}}, *primeiro real vale 100*.\n\nNão pela quantia. Pela prova. Você provou que é possível. Tudo depois é escala.\n\nSe ainda não vendeu, vai vender. Se já vendeu, *registra no app*. Conta isso." },
  { key: "motivacional_122", theme: "faturamento", text: "Oi {{name}} 💕\n\nLembra de marcar seu faturamento esse mês? Mesmo se for R$ 50, marca. *O ranking conta — e te coloca de frente com seu próprio crescimento.*" },
  { key: "motivacional_123", theme: "faturamento", text: "{{name}}, *dinheiro novo na conta muda a sua identidade*.\n\nA primeira venda no TikTok Shop transforma \"quero ser criadora\" em \"sou criadora\". Por isso ela é tão poderosa. Vai por essa primeira." },
  { key: "motivacional_124", theme: "faturamento", text: "{{name}} ✨\n\nNão subestima R$ 100 reais por mês. *É a porta.* Quem fatura 100 fatura 500. Quem fatura 500 fatura 5 mil. A escada é a mesma — só os degraus.\n\nFoco em subir o próximo." },
  { key: "motivacional_125", theme: "faturamento", text: "Oi {{name}}!\n\nDinheiro do TikTok Shop *muda casa, paga conta, da liberdade*. Você não tá brincando. Tá construindo renda.\n\nLembra disso quando achar que não vale o esforço." },
  { key: "motivacional_126", theme: "faturamento", text: "{{name}}, *seu faturamento mensal é seu placar*.\n\nMês a mês registra. Compara. Ajusta. O que não se mede não se gerencia. Por isso o app pede pra você marcar. Não pula." },
  { key: "motivacional_127", theme: "faturamento", text: "{{name}} 🌹\n\nVocê NÃO precisa vender muito pra começar a viver disso. Precisa vender *consistente*. R$ 1.500 todo mês > R$ 5.000 num mês e zero nos 2 seguintes.\n\nConstrói consistência." },
  { key: "motivacional_128", theme: "faturamento", text: "Oi {{name}} 💕\n\nDinheiro chega quando você *foca no processo, não na venda*. Vídeos bons, lives, produtos certos. A venda é consequência.\n\nFaz o processo bem. O resto vem." },
  { key: "motivacional_129", theme: "faturamento", text: "{{name}}, *a primeira venda é a mais difícil*. A segunda é mais fácil. A décima vira hábito. A centésima vira identidade.\n\nFoco em fazer a primeira. Tudo escala." },
  { key: "motivacional_130", theme: "faturamento", text: "{{name}} 🔥\n\nNão olha o quanto a outra fatura. *Olha o quanto VOCÊ faturou esse mês vs mês passado*. Esse é o KPI que importa.\n\nCresceu? Comemora. Caiu? Ajusta." },
  { key: "motivacional_131", theme: "faturamento", text: "Oi {{name}} ✨\n\nVocê tá construindo um negócio. *Negócio nao explode no 1° mês*. Quem vende 10 mil hoje começou faturando 50. Tudo é escada.\n\nFoco no próximo degrau." },
  { key: "motivacional_132", theme: "faturamento", text: "{{name}}, *cada venda é uma aluna confiando em você*. Não é só dinheiro. É confiança transformada em PIX. Honra isso. Entrega bem.\n\nO TikTok Shop premia quem entrega." },
  { key: "motivacional_133", theme: "faturamento", text: "{{name}} 💕\n\nLembra: *o produto certo facilita TUDO*. Se você tá lutando pra vender, talvez o problema seja o produto, não você.\n\nTesta produtos diferentes. Não casa com nenhum." },
  { key: "motivacional_134", theme: "faturamento", text: "Oi {{name}}!\n\nVocê NÃO precisa de mil seguidores pra vender. *Você precisa de 100 pessoas certas*. Foco em achar as 100, não as mil.\n\nAs 100 pagam suas contas." },
  { key: "motivacional_135", theme: "faturamento", text: "{{name}} 🌹\n\nSe você fatura R$ 200 hoje, é PROVA de que dá. Tudo o que vem depois é escala. *Foca em multiplicar, não em começar do zero.*\n\nO começo já tá feito." },
  { key: "motivacional_136", theme: "faturamento", text: "{{name}}, dica de ouro:\n\nReinvesta uma % do seu faturamento *em você mesma*: cursos, equipamento, produtos. Não gasta tudo em conta. *Cria seu próprio teto.*" },
  { key: "motivacional_137", theme: "faturamento", text: "Oi {{name}} 💕\n\nA grana do TikTok Shop é diferente da grana do salário. Ela é *fruto direto do seu trabalho criativo*. Você criou. Você ganhou. Sente o peso disso." },
  { key: "motivacional_138", theme: "faturamento", text: "{{name}}, *vendeu? POSTA*.\n\nDepoimento, antes/depois, alguém usando. Quem comprou, comprovou. Quem comprovou, vira venda nova.\n\nO ciclo." },
  { key: "motivacional_139", theme: "faturamento", text: "{{name}} ✨\n\nNão tem teto pro TikTok Shop. Tem criadora faturando 30 mil, 100 mil, 500 mil por mês. *Você tá no mesmo jogo.* Só ainda não chegou nesse nível — mas chega." },
  { key: "motivacional_140", theme: "faturamento", text: "Oi {{name}}!\n\nFatura pouco hoje? *Foca em fatura crescente, não em fatura alta*. R$100 esse mês, R$ 250 próximo, R$500 o seguinte. Curva que importa." },
  { key: "motivacional_141", theme: "faturamento", text: "{{name}} 🔥\n\n*O TikTok Shop paga semanalmente*. Cada PIX é validação. Cada validação é combustível. Tira print do primeiro. Olha quando bater desânimo." },
  { key: "motivacional_142", theme: "faturamento", text: "Oi {{name}} 💕\n\nUm dia você vai olhar pra trás e ver que esse mês — com pouca venda — *foi onde você plantou*. Plantar não dá fruto na mesma semana.\n\nPlanta hoje. Colhe depois." },
  { key: "motivacional_143", theme: "faturamento", text: "{{name}}, *o ranking é teu termômetro*. Marca seu faturamento mensal. Vê as outras. Te inspira saber que dá. Te empurra ver onde tá.\n\nUsa a teu favor." },
  { key: "motivacional_144", theme: "faturamento", text: "{{name}} 🌹\n\nQuando você fatura 1 mil pela primeira vez, *o mundo muda*. Não pelo dinheiro. Pela certeza de que esse jogo é seu. De que dá. De que você consegue.\n\nVai por esse marco." },
  { key: "motivacional_145", theme: "faturamento", text: "Oi {{name}}!\n\nSeu produto vale o que ele *transforma*. Não o que ele custa. Se transforma muito, cobra alto e venda fica fácil. Se transforma pouco, nem barato vende.\n\nFoca em produto que transforma." },
  { key: "motivacional_146", theme: "faturamento", text: "{{name}}, *zera não é fracasso*. Mês 0 reais existe. Acontece. Não significa que você é ruim — significa que esse foi um mês de plantio.\n\nMês de colheita vem depois. Sempre vem." },
  { key: "motivacional_147", theme: "faturamento", text: "{{name}} 💕\n\nVocê *vale mais do que vende hoje*. Seu jeito, seu carinho com as alunas, sua entrega. Cobra de acordo.\n\nNão se desvaloriza pra vender mais. Atrai gente que valoriza." },
  { key: "motivacional_148", theme: "faturamento", text: "Oi {{name}} ✨\n\nLiberdade financeira no TikTok Shop *é real*. Centenas de criadoras vivem disso. Você tem o mesmo direito.\n\nNão é sorte. É processo. Continua o processo." },
  { key: "motivacional_149", theme: "faturamento", text: "{{name}}, *cada R$ ganho aqui é R$ que ninguém te dá*. É seu. Construído por você. Ninguém pode tirar.\n\nDinheiro com origem clara é dinheiro que muda vida." },
  { key: "motivacional_150", theme: "faturamento", text: "{{name}} 🌹\n\nFoca em vender pra QUEM precisa do que você vende. *Não vende pra todo mundo.* Esforço gigante, retorno mínimo. Vende pro nicho. Esforço médio, retorno grande." },
];

// =============================================================================
// 151-180: LIVE / CAMERA / APARECER
// =============================================================================
const LIVE: MotivationalEntry[] = [
  { key: "motivacional_151", theme: "live", text: "{{name}}, *live é onde a venda acontece*.\n\nVídeo gravado atrai. Live converte. As alunas top do método tão TODAS no ao vivo.\n\nFaz tua primeira essa semana. Vale o medo." },
  { key: "motivacional_152", theme: "live", text: "Oi {{name}} 💕\n\nMedo de live é normal. *Todas começaram tremendo.* A primeira live foi um massacre interno pra todo mundo.\n\nA 5ª já vira leve. A 30ª, você não consegue mais parar." },
  { key: "motivacional_153", theme: "live", text: "{{name}}, *live de 10 minutos vale uma de 2 horas se você fizer toda semana*. Não precisa ser maratona. Precisa existir.\n\nMarca o horário fixo. Vai." },
  { key: "motivacional_154", theme: "live", text: "{{name}} 🔥\n\nNa live você *cria conexão real*. Vídeo gravado é monólogo. Live é conversa. E gente compra de quem conversa com ela.\n\nVai por essa." },
  { key: "motivacional_155", theme: "live", text: "Oi {{name}} 🌹\n\nLive vazia no começo? *Faz mesmo assim.* O algoritmo aprende seu padrão. Em 1 mês de live constante, ele empurra. Aí vem público.\n\nFica firme nas primeiras 10 vazias." },
  { key: "motivacional_156", theme: "live", text: "{{name}}, *5 pessoas na sua live são 5 oportunidades de venda*. Não despreza. Trata cada uma como rainha. Conexão real bate vista superficial." },
  { key: "motivacional_157", theme: "live", text: "{{name}} ✨\n\nNa live você pode mostrar o produto na mão. Tirar dúvida ao vivo. Negociar. *Vendedor virtual não tem esse poder.*\n\nVocê tem. Usa." },
  { key: "motivacional_158", theme: "live", text: "Oi {{name}} 💕\n\nDica: live no mesmo horário, 3x por semana. *Vira encontro.* Suas seguidoras começam a esperar.\n\nMarca: terça, quinta, sábado às 20h. Compromisso. Vai." },
  { key: "motivacional_159", theme: "live", text: "{{name}}, *você tá pensando demais antes da live*. Mais tempo planejando do que fazendo.\n\nAbre o app. Aperta o botão. Fala oi. Fala do produto. Tchau. Pronto. Repete." },
  { key: "motivacional_160", theme: "live", text: "{{name}} 🌹\n\nFeio? Cansada? Sem cara? *FAZ ASSIM MESMO.* As alunas que mais vendem fazem live sem maquiagem, em casa, sem produção. Autenticidade vende.\n\nGente compra de gente real." },
  { key: "motivacional_161", theme: "live", text: "Oi {{name}}!\n\nLive curta hoje vale. 10 minutos. Mostra o produto, fala 3 benefícios, abre carrinho. Pronto.\n\n*Pequeno feito > grande planejado.* Sempre." },
  { key: "motivacional_162", theme: "live", text: "{{name}}, *a vergonha some na 3ª live*. Promessa. Você vai olhar pra primeira e rir.\n\nMas pra chegar na 3ª, tem que fazer a 1ª. Hoje?" },
  { key: "motivacional_163", theme: "live", text: "{{name}} 💕\n\nLive *NÃO precisa* de equipamento. Celular + boa luz natural + cara lavada. Pronto. Quem se trava esperando equipamento perfeito não começa nunca.\n\nFaz com o que tem. Hoje." },
  { key: "motivacional_164", theme: "live", text: "Oi {{name}} 🔥\n\nLembra: live no TikTok empurra MAIS no algoritmo. Por isso vale tanto. Você bota 1 hora de live e ganha 1 semana de visibilidade.\n\nVale o esforço. Vai." },
  { key: "motivacional_165", theme: "live", text: "{{name}}, *pré-live: respira fundo, água do lado, sorri*. Boom. Tá pronta. Não precisa de mais.\n\n10 segundos de preparo. 10 minutos de live. Pronto." },
  { key: "motivacional_166", theme: "live", text: "{{name}} ✨\n\nDuas coisas que vendem MUITO na live: *desconto exclusivo de live + cupom temporário*. Cria urgência. Quem entra não quer perder.\n\nTesta essa semana." },
  { key: "motivacional_167", theme: "live", text: "Oi {{name}} 🌹\n\nLive ao vivo é honesta. Você não pode editar. *E é EXATAMENTE por isso que vende mais*. Gente cansou de marketing produzido. Quer real.\n\nSeja real. Live." },
  { key: "motivacional_168", theme: "live", text: "{{name}}, *o erro mais comum*: parar a live quando vê pouca gente. *Não faz isso.* Continua. O algoritmo testa.\n\n30 minutos. Sem desistir. Mesmo com 2 viewers." },
  { key: "motivacional_169", theme: "live", text: "{{name}} 💕\n\nMedo de não saber o que falar? Tem 3 estruturas que sempre funcionam:\n1. Mostra o produto\n2. Conta a história de uma cliente\n3. Tira dúvidas\n\nRepete em loop. Vai." },
  { key: "motivacional_170", theme: "live", text: "Oi {{name}} 🔥\n\nLive é como academia: doi nas primeiras semanas. Depois vira hábito. Depois sente falta se não faz.\n\nSe ainda dói, é porque é nova. Continua." },
  { key: "motivacional_171", theme: "live", text: "{{name}}, *desconto na live > desconto no link*. Dá um valor a mais pra quem assiste. Recompensa presença. Quem assistiu sente especial. Sente especial, compra.\n\nFaz isso essa semana." },
  { key: "motivacional_172", theme: "live", text: "{{name}} 🌹\n\nLive longa vence live curta. 1h > 10min. *O algoritmo recompensa quem segura o público.*\n\nNão precisa falar o tempo todo. Demonstra produto, mostra unboxing, responde comentário. 1 hora rende fácil." },
  { key: "motivacional_173", theme: "live", text: "Oi {{name}} 💕\n\nQuando você live, *cria laço*. Suas seguidoras te conhecem além do vídeo curto. E gente que conhece, confia. Gente que confia, compra.\n\nLive = banco de confiança." },
  { key: "motivacional_174", theme: "live", text: "{{name}}, *agenda live de hoje? Posta o anúncio agora*.\n\n\"Live hoje às 20h, vou mostrar [produto] e ter cupom só pra quem entrar.\" Pronto. Bota stories, post, tudo." },
  { key: "motivacional_175", theme: "live", text: "{{name}} ✨\n\nNão precisa ser apresentadora de TV. *Precisa ser você*. Trava, ri, repete. As alunas amam o real. Quem é robotizada não vende.\n\nFica natural. Live." },
  { key: "motivacional_176", theme: "live", text: "Oi {{name}} 🌹\n\nTua primeira live talvez ninguém assista. Tua décima começam a aparecer. *Tua centésima vai ter fila*.\n\nO caminho é esse. Não tem atalho. Mas funciona." },
  { key: "motivacional_177", theme: "live", text: "{{name}}, *live = palco*. Sobe nele. Treme. Faz. Desce. Repete amanhã.\n\nNão tem atalho. Mas tem caminho. E ele é diário." },
  { key: "motivacional_178", theme: "live", text: "{{name}} 🔥\n\nDica de ouro pra live: *título com chamada forte*. \"COMO VENDER NO TIKTOK SHOP — AO VIVO AGORA\" puxa mais que \"live de hoje\".\n\nTreina seu copy." },
  { key: "motivacional_179", theme: "live", text: "Oi {{name}} 💕\n\nLive ao vivo *NÃO é entretenimento*. É vendas. Pode pular a parte do \"entreter\" se quiser. Bora direto pro produto. Funciona.\n\nNão tem regra. Testa." },
  { key: "motivacional_180", theme: "live", text: "{{name}} 🌹\n\nFaz live hoje. Mesmo que curtinha. Mesmo que zoada. *A primeira live de cada semana destranca o resto*. Vai." },
];

// =============================================================================
// 181-210: RANKING / COMUNIDADE
// =============================================================================
const COMUNIDADE: MotivationalEntry[] = [
  { key: "motivacional_181", theme: "comunidade", text: "{{name}}, você *NÃO está sozinha nessa*.\n\nTem centenas de criadoras vivendo o mesmo que você. Mesma dúvida, mesmo medo, mesma esperança. O ranking mostra isso. Olha lá hoje." },
  { key: "motivacional_182", theme: "comunidade", text: "Oi {{name}} 💕\n\nA *comunidade é teu superpoder*. Não tenta fazer sozinha. Pergunta no app, compartilha, troca. Quem cresce em rede cresce mais rápido." },
  { key: "motivacional_183", theme: "comunidade", text: "{{name}}, *o ranking é seu termômetro*. Não é competição — é mapa. Te mostra onde você tá e quanto falta pro próximo nível.\n\nAbre. Olha. Decide." },
  { key: "motivacional_184", theme: "comunidade", text: "{{name}} 🌹\n\nVê alguém no topo do ranking? *Ela já foi você*. Hoje ela tá lá. Amanhã pode ser você. Ranking muda — disciplina mantém.\n\nFica firme." },
  { key: "motivacional_185", theme: "comunidade", text: "Oi {{name}}!\n\nNão sofre sozinha. *No app tem mulheres na mesma luta*. Conta dificuldade, conta vitória. Não guarda pra dentro. Troca te alimenta." },
  { key: "motivacional_186", theme: "comunidade", text: "{{name}} ✨\n\nLembra: o algoritmo te isola. *Faz parecer que ninguém entende*. Mas o método tá cheio de mulheres exatamente como você. Cabe procurar." },
  { key: "motivacional_187", theme: "comunidade", text: "Oi {{name}} 💕\n\nQuem te ajuda no caminho, *ajuda a si própria também*. O método foi feito assim. A gente cresce junta.\n\nResponde aluna nova, divide aprendizado. Tudo volta." },
  { key: "motivacional_188", theme: "comunidade", text: "{{name}}, *o ranking não te julga*. Te orienta. Se você tá em último, *é porque ainda não começou direito*. Não é fracasso — é largada.\n\nDá o primeiro passo." },
  { key: "motivacional_189", theme: "comunidade", text: "{{name}} 🔥\n\nQuer subir no ranking? Faz 2 coisas:\n1. Bate rotina todo dia (consistência)\n2. Marca faturamento todo mês (resultado)\n\nÉ só isso. Cresce naturalmente." },
  { key: "motivacional_190", theme: "comunidade", text: "Oi {{name}} 🌹\n\n*A criadora que mais sobe no ranking não é a que mais vende*. É a que mais BATE ROTINA com FATURAMENTO. Equilíbrio é o segredo.\n\nFaz os 2." },
  { key: "motivacional_191", theme: "comunidade", text: "{{name}}, *o método não é só ferramenta*. É família. Centenas de mulheres torcendo pra você crescer. Inclusive eu.\n\nVocê não tá fazendo isso sozinha. Sente isso." },
  { key: "motivacional_192", theme: "comunidade", text: "{{name}} 💕\n\nQuem tá no top 10 hoje começou no top 100. *O caminho é mesmo pra todas.* Só o tempo de cada uma é diferente.\n\nFica firme." },
  { key: "motivacional_193", theme: "comunidade", text: "Oi {{name}} ✨\n\nO ranking conta 2 coisas: *o quanto você apareceu (rotina)* e *o quanto você faturou*. Se cuida das duas, sobe natural.\n\nVê onde tá. Vê onde quer chegar. Trabalha." },
  { key: "motivacional_194", theme: "comunidade", text: "{{name}}, *foco em ti, mas torce pelas outras*. Quando uma fatura alto, mostra que dá. Quando uma some, mostra o que não fazer.\n\nSomos referência umas pras outras." },
  { key: "motivacional_195", theme: "comunidade", text: "{{name}} 🌹\n\nNão se mede pelo ranking de uma semana. *Mede pelo seu crescimento ao longo dos meses.*\n\nMês passado vs esse mês: você cresceu? Ótimo. Você é o ranking que importa." },
  { key: "motivacional_196", theme: "comunidade", text: "Oi {{name}}!\n\nLembra: ninguém no topo subiu de uma vez. Foi degrau por degrau. *Hoje você sobe o seu degrau.* Daqui 6 meses, olha pra trás.\n\nVai surpreender." },
  { key: "motivacional_197", theme: "comunidade", text: "{{name}}, *o método tem propósito*. Não é só te ensinar a vender. É *te dar comunidade pra não desistir*.\n\nA gente aguenta junta. Conta comigo." },
  { key: "motivacional_198", theme: "comunidade", text: "{{name}} 💕\n\nQuem te seguia há 3 meses, *te vê agora e te admira*. Sua evolução é visível pros outros mesmo quando você não vê. Olha pra trás." },
  { key: "motivacional_199", theme: "comunidade", text: "Oi {{name}} 🔥\n\nNo ranking todas começam zeradas. *Quem aparece todo dia sobe.* Quem desaparece some. Simples assim.\n\nApareça hoje." },
  { key: "motivacional_200", theme: "comunidade", text: "{{name}} 🌹\n\n*200 mensagens, 200 dias*. Você tá aqui. Eu tô aqui. A gente tá construindo isso junta. Não é pouco. É muito.\n\nObrigada por confiar." },
  { key: "motivacional_201", theme: "comunidade", text: "Oi {{name}} ✨\n\nPergunta no app. Comenta nos posts das outras. Curte. Engaja. *Comunidade não cresce sozinha — cresce com você.*\n\nFaz tua parte hoje." },
  { key: "motivacional_202", theme: "comunidade", text: "{{name}}, sabia?\n\nQuem ajuda outra aluna geralmente *cresce 3x mais rápido*. Ensinar te força a entender. Entender te força a aplicar.\n\nEnsina uma colega hoje." },
  { key: "motivacional_203", theme: "comunidade", text: "{{name}} 💕\n\nLembra: o método não é o agente. É VOCÊ + agente. É VOCÊ + comunidade. É VOCÊ + rotina. *O método é você ativada.*\n\nFica ativada." },
  { key: "motivacional_204", theme: "comunidade", text: "Oi {{name}} 🌹\n\nA criadora top do método NÃO é a mais talentosa. *É a que mais usou as ferramentas + a comunidade.* Você tem as duas.\n\nUsa." },
  { key: "motivacional_205", theme: "comunidade", text: "{{name}}, comparar com as outras é normal. Mas *aprender com as outras é mais poderoso*. Vê o que tá funcionando pra elas. Adapta pro teu.\n\nNão copia. Adapta." },
  { key: "motivacional_206", theme: "comunidade", text: "{{name}} 🔥\n\nO ranking ATUALIZA EM TEMPO REAL. Cada rotina batida, cada faturamento marcado, você se move.\n\nQuer mexer no ranking AGORA? Bate a rotina. Pronto. Subiu." },
  { key: "motivacional_207", theme: "comunidade", text: "Oi {{name}} 💕\n\nA gente tem mulheres do *Brasil inteiro* no método. De cidade pequena, capital, interior. Todas vivendo o mesmo. Você faz parte de algo grande.\n\nSente isso." },
  { key: "motivacional_208", theme: "comunidade", text: "{{name}}, *o método é teu lugar seguro*. Aqui ninguém julga. Errou? Recomeça. Travou? Pergunta. Cresceu? Comemora.\n\nÉ tua casa." },
  { key: "motivacional_209", theme: "comunidade", text: "{{name}} ✨\n\nNão guarda vitória só pra você. *Conta no app, marca o faturamento, divide com as colegas*. Tua vitória inspira 10 outras a continuar." },
  { key: "motivacional_210", theme: "comunidade", text: "Oi {{name}} 🌹\n\nA gente tá junta. *Mesmo quando você não vê, eu tô aqui.* Quando você abrir o app amanhã, tudo vai estar pronto pra você. Sempre.\n\nVai." },
];

// =============================================================================
// 211-240: PRODUTO / CRIACAO / TESTE
// =============================================================================
const PRODUTO: MotivationalEntry[] = [
  { key: "motivacional_211", theme: "produto", text: "{{name}}, *produto certo facilita TUDO*.\n\nSe você tá lutando pra vender, *talvez o problema não seja você* — seja o produto. Testa um diferente. Sem culpa." },
  { key: "motivacional_212", theme: "produto", text: "Oi {{name}} 💕\n\nPara de tentar vender o que NÃO sai. *Esforço gigante, retorno zero é sinal pra trocar.* Não força. Pivota.\n\nO certo vende sozinho." },
  { key: "motivacional_213", theme: "produto", text: "{{name}}, *cola rápida do agente é teu superpoder*. 1 produto novo, ficha completa, roteiros prontos. Em 2 minutos.\n\nFaz hoje. Testa." },
  { key: "motivacional_214", theme: "produto", text: "{{name}} 🌹\n\nProduto novo merece *minimo 30 dias de teste*. Não desiste no 3°. Pode ser que o algoritmo só ache seu público no dia 25.\n\nPaciência com produto novo." },
  { key: "motivacional_215", theme: "produto", text: "Oi {{name}}!\n\nO produto vende quando *resolve um problema real, claro, urgente*. Se você não consegue resumir o problema em 1 frase, *talvez não venda*.\n\nClareza vende." },
  { key: "motivacional_216", theme: "produto", text: "{{name}} ✨\n\nNão tem produto perfeito. Tem produto *ajustado pro público certo*. Mesmo produto vai mal pra A e ótimo pra B.\n\nFoco em achar o B." },
  { key: "motivacional_217", theme: "produto", text: "Oi {{name}} 💕\n\nProduto que VOCÊ ama vende melhor. *Energia transparece.* Se você não acredita, ninguém compra.\n\nTesta o produto. Usa. Aí vende com verdade." },
  { key: "motivacional_218", theme: "produto", text: "{{name}}, *produto barato NÃO é sempre o que mais vende*. Às vezes produto premium vende mais — porque parece valer mais.\n\nTesta os 2 polos." },
  { key: "motivacional_219", theme: "produto", text: "{{name}} 🔥\n\nProduto sazonal *empurra muito*. Dia das mães, Black Friday, Natal. O algoritmo amplifica nicho sazonal.\n\nAlinha teu calendário com o do TikTok." },
  { key: "motivacional_220", theme: "produto", text: "Oi {{name}} 🌹\n\nRoteiro novo pra cada produto. *Não usa o mesmo molde pra tudo*. Cada produto tem dor diferente, gatilho diferente.\n\nGera roteiro pelo agente. É 1 minuto." },
  { key: "motivacional_221", theme: "produto", text: "{{name}}, *combos vendem mais que produto solto*. \"Compra os 2 e leva o 3° grátis.\" Funciona sempre. Aumenta ticket médio.\n\nTesta essa semana." },
  { key: "motivacional_222", theme: "produto", text: "{{name}} 💕\n\nProduto bom + roteiro bom + frequência *= venda*. Se uma das 3 falta, a venda emperra. Diagnostica qual tá faltando." },
  { key: "motivacional_223", theme: "produto", text: "Oi {{name}} ✨\n\nVê o que tá viralizando no nicho. *Adapta pro seu produto.* Não copia — adapta. Hook que funcionou pra um, funciona pra similar.\n\nObserva. Adapta. Posta." },
  { key: "motivacional_224", theme: "produto", text: "{{name}}, *demo de produto vende mais que descrição*. Mostra como usa. Antes/depois. Texto não compete com vídeo demonstrativo.\n\nGrava demo essa semana." },
  { key: "motivacional_225", theme: "produto", text: "{{name}} 🌹\n\nSe um produto vende 1 vez, *vende 100*. Acha o público dele. Repete. Escala. Não procura novidade — *escala o que já funciona*." },
  { key: "motivacional_226", theme: "produto", text: "Oi {{name}}!\n\nNicho de skincare, beleza, casa e moda *bombam no TikTok Shop*. Mas qualquer nicho vende se tiver gancho certo.\n\nAjusta o gancho." },
  { key: "motivacional_227", theme: "produto", text: "{{name}} 🔥\n\nProduto NOVO toda semana NÃO é estratégia. *Foco em 2-3 produtos campeões.* Aprofunda. Vende mais. Sem dispersão.\n\nFoco." },
  { key: "motivacional_228", theme: "produto", text: "Oi {{name}} 💕\n\nQuando o produto vende sem esforço, *para de querer mudar*. Repete. Escala. Não fica pulando pra novidade só por novidade." },
  { key: "motivacional_229", theme: "produto", text: "{{name}}, *prêmio melhor: produto que cliente recomprar*. Recorrência = vida. Cliente que volta paga teu aluguel.\n\nFoco em produto recorrente." },
  { key: "motivacional_230", theme: "produto", text: "{{name}} 🌹\n\nProduto que cabe na sua identidade. *Não vende cosmético se você odeia maquiagem.* O esforço fica desproporcional. Sustentabilidade emocional importa.\n\nVende o que conecta." },
  { key: "motivacional_231", theme: "produto", text: "Oi {{name}} ✨\n\nFicha do produto detalhada *vende sozinha*. Cliente que sabe tudo, decide rápido. Cliente em dúvida, abandona carrinho.\n\nUsa o agente. Faz ficha. Posta." },
  { key: "motivacional_232", theme: "produto", text: "{{name}}, *o algoritmo gosta de quem fala do mesmo produto várias vezes em ângulos diferentes*. Não tem medo de \"saturar\".\n\n10 vídeos do mesmo produto, jeitos diferentes. Funciona." },
  { key: "motivacional_233", theme: "produto", text: "{{name}} 💕\n\nClipe curto + produto na mão + 1 benefício claro. *Fórmula que SEMPRE funciona.* Repete pra cada produto.\n\nNão precisa reinventar." },
  { key: "motivacional_234", theme: "produto", text: "Oi {{name}} 🔥\n\nProduto que resolve dor *óbvia* vende fácil. \"Tira mancha do tênis em 30s\" vende mais que \"limpa tênis\".\n\nClareza > beleza." },
  { key: "motivacional_235", theme: "produto", text: "{{name}}, *cuidado com nicho que você não conhece*. Vender produto sem entender é tiro no escuro. Estuda o produto. Usa. Aí vende.\n\nConhecimento vende." },
  { key: "motivacional_236", theme: "produto", text: "{{name}} 🌹\n\nUnboxing do produto é OURO. Mostra a embalagem, o jeito que chega, o cheiro. *Vende EXPERIÊNCIA, não objeto.*\n\nGrava esse tipo de vídeo." },
  { key: "motivacional_237", theme: "produto", text: "Oi {{name}} 💕\n\nProduto NOVO no portfólio? *Faz 1 mês de conteúdo dele antes de testar outro*. Inteiro um mês. Aí decide.\n\nDesistir cedo é o erro mais comum." },
  { key: "motivacional_238", theme: "produto", text: "{{name}}, *salva os produtos que pesquisar*. Mesmo que não saia agora. Pode ser que daqui 2 meses vire campeão. Não perde a pesquisa.\n\nUsa a aba de produtos do app." },
  { key: "motivacional_239", theme: "produto", text: "{{name}} ✨\n\nDor + agitação + solução. *Estrutura clássica de venda.* Mostra a dor, agita ela, apresenta o produto como solução. Funciona em todo nicho." },
  { key: "motivacional_240", theme: "produto", text: "Oi {{name}} 🌹\n\nProduto que vai bem, *NÃO troca*. Mesmo se você tá enjoada. Tua audiência ainda não enjoou. Vende. Vende. Vende.\n\nPara de procurar pelo em ovo." },
];

// =============================================================================
// 241-270: APRENDIZADO / AULAS / METODO
// =============================================================================
const APRENDIZADO: MotivationalEntry[] = [
  { key: "motivacional_241", theme: "aprendizado", text: "{{name}}, *aula 5 minutos por dia = formação completa em 3 meses*.\n\nNão precisa fazer maratona. Bita por dia. O método foi feito pra isso.\n\nAbre uma aula hoje." },
  { key: "motivacional_242", theme: "aprendizado", text: "Oi {{name}} 💕\n\nVocê já tem TUDO o que precisa pra crescer no app. *Aula, agente, comunidade, rotina*. Falta usar.\n\nAbre o método hoje. Escolhe 1 coisa. Aplica." },
  { key: "motivacional_243", theme: "aprendizado", text: "{{name}}, *ler vs aplicar são coisas diferentes*. 10 aulas só lidas valem 1 aula aplicada. Foco em aplicar.\n\nUma técnica por semana. Profundo." },
  { key: "motivacional_244", theme: "aprendizado", text: "{{name}} 🌹\n\nNão consome teoria sem aplicar. Vira *vício de aprender sem agir*. Cada aula que você terminar — *aplica algo dela esse dia mesmo*. Em até 24h." },
  { key: "motivacional_245", theme: "aprendizado", text: "Oi {{name}}!\n\nQuer saber qual aula assistir? *A próxima da trilha*. Não pula. Foi pensada em ordem por um motivo.\n\nUma de cada vez. Sem ansiedade." },
  { key: "motivacional_246", theme: "aprendizado", text: "{{name}} ✨\n\nO método tem mais conteúdo do que dá pra consumir num mês. *Não precisa ver tudo de uma vez*. Pega o que ressoa hoje. Aplica.\n\nVolta amanhã pra mais." },
  { key: "motivacional_247", theme: "aprendizado", text: "Oi {{name}} 💕\n\nTem ebook novo? *Baixa hoje, lê 5 páginas*. Não precisa ler inteiro. 5 páginas por dia, em 1 mês acabou.\n\nConhecimento é cumulativo." },
  { key: "motivacional_248", theme: "aprendizado", text: "{{name}}, *aprende e aplica no mesmo dia*. Sem isso, aprendizado vira piada. Por isso o método sempre tem exercício prático.\n\nFaz o exercício. Mesmo se for chato." },
  { key: "motivacional_249", theme: "aprendizado", text: "{{name}} 🔥\n\nA criadora top NÃO sabe mais que você. *Aplica mais.* Coisa que tu sabe e não usa, vale zero.\n\nUsa o que sabe. Hoje." },
  { key: "motivacional_250", theme: "aprendizado", text: "Oi {{name}} 🌹\n\n*250 dias.* Imagina o que você consegue aprender em 250 dias com 5 minutos por dia. Vira outra pessoa. Profissional.\n\nEsse é o caminho. Devagar e sempre." },
  { key: "motivacional_251", theme: "aprendizado", text: "{{name}}, *ebooks do método são pra ler com canetinha na mão*. Não passa por cima. Marca. Anota. Aplica.\n\nLeitura passiva vale pouco." },
  { key: "motivacional_252", theme: "aprendizado", text: "{{name}} 💕\n\nDúvida no método? *Pergunta*. Não fica engasgada. Quanto mais cedo perguntar, mais cedo desbloqueia.\n\nDúvida guardada vira muro." },
  { key: "motivacional_253", theme: "aprendizado", text: "Oi {{name}} ✨\n\nLive ao vivo do método é OURO. *Não perde.* Quando tem uma, organiza tua agenda. Conhecimento ao vivo + perguntas em tempo real = transformação." },
  { key: "motivacional_254", theme: "aprendizado", text: "{{name}}, *o método é mapa, não milagre*. Te mostra o caminho. Você anda. Sem você andar, mapa não serve.\n\nAnda hoje." },
  { key: "motivacional_255", theme: "aprendizado", text: "{{name}} 🌹\n\nReassistir aulas é poderoso. *Primeira vez você entende a teoria. Segunda vez você aplica.* Não tenha vergonha de voltar.\n\nVolta na aula que mais te marcou." },
  { key: "motivacional_256", theme: "aprendizado", text: "Oi {{name}}!\n\nO método é coleção de *atalhos de quem já andou o caminho*. Você não precisa errar tudo de novo. Aprende e pula etapa.\n\nUsa o privilégio." },
  { key: "motivacional_257", theme: "aprendizado", text: "{{name}} 🔥\n\nFaz aula com caderno do lado. *Anota 3 coisas*. Cada aula. Mesmo se for repetida.\n\nFala/lembra/aplica. Trinca da aprendizagem." },
  { key: "motivacional_258", theme: "aprendizado", text: "Oi {{name}} 💕\n\nVocê NÃO precisa ser expert pra começar a aplicar. *Aplica enquanto aprende.* Os 2 caminham juntos. Esperar saber tudo é desculpa.\n\nFaz com o que tem hoje." },
  { key: "motivacional_259", theme: "aprendizado", text: "{{name}}, *o agente do app é teu professor 24h*. Pergunta qualquer coisa. Sobre produto, roteiro, gancho. Ele tá ali pra isso.\n\nUsa todo dia." },
  { key: "motivacional_260", theme: "aprendizado", text: "{{name}} ✨\n\nNão tem aula \"básica\" que não vale a pena revisar. Os melhores sempre voltam ao básico. *É no básico que mora a maestria.*\n\nRevisa esse mês." },
  { key: "motivacional_261", theme: "aprendizado", text: "Oi {{name}} 🌹\n\nQuando você ensina algo do método pra uma amiga, *você aprende dobrado*. Ensinar consolida. Tenta essa semana." },
  { key: "motivacional_262", theme: "aprendizado", text: "{{name}}, *aprendizado sem ação = entretenimento*. Não te ilude. Cursinho gostoso de ver sem aplicar é Netflix.\n\nAplica hoje. Mesmo pouco. Mas aplica." },
  { key: "motivacional_263", theme: "aprendizado", text: "{{name}} 💕\n\nA velocidade do teu progresso = *velocidade da tua aplicação*. Não da leitura. Não da aula. *Da prática.*\n\nAplica algo hoje. Mesmo pequeno." },
  { key: "motivacional_264", theme: "aprendizado", text: "Oi {{name}} 🔥\n\nFinaliza módulo HOJE. Aquela aula que tá empacada lá. *Termina.* Encerrar dá energia pra começar próxima.\n\nFinishing strong > starting strong." },
  { key: "motivacional_265", theme: "aprendizado", text: "{{name}}, *evolução é cumulativa*. Não vê no dia. Vê no mês. Quem aprendeu 1% por dia, em 1 ano cresceu 37x.\n\nA matemática trabalha pra você. Continua." },
  { key: "motivacional_266", theme: "aprendizado", text: "{{name}} 🌹\n\nMétodo NÃO é receita de bolo. É molho. *Tempera com teu jeito.* Adapta. Mistura. O que funciona pra outra pode não pra ti — e ok.\n\nTeu método é único." },
  { key: "motivacional_267", theme: "aprendizado", text: "Oi {{name}} ✨\n\nVê o que outras alunas fazem. *Observa, não imita.* Cada uma tem seu jeito. O teu também é válido. Aprende com elas, mantém tua essência." },
  { key: "motivacional_268", theme: "aprendizado", text: "{{name}}, *consume conteúdo até saturar*. Aí PARA. Aplica por 30 dias. Volta. Consome de novo. Aplica. Ciclo.\n\nNão fica em ciclo eterno de só consumo." },
  { key: "motivacional_269", theme: "aprendizado", text: "{{name}} 💕\n\nQuanto mais aplicado, *mais clareza nas próximas aulas*. A aula que parecia chata fica óbvia. Você só sabe o valor depois de aplicar.\n\nAplica primeiro." },
  { key: "motivacional_270", theme: "aprendizado", text: "Oi {{name}} 🌹\n\nO teu método é teu — mas o caminho tá traçado. *Não tenta reinventar*. Segue. Mesmo se parecer simples demais. O simples é o que funciona." },
];

// =============================================================================
// 271-300: ESTRATEGIA / DICAS PRATICAS
// =============================================================================
const ESTRATEGIA: MotivationalEntry[] = [
  { key: "motivacional_271", theme: "estrategia", text: "{{name}}, *hook é o 1° segundo*.\n\nTexto na tela, pergunta forte, ação inesperada. Se hook prende, vídeo é assistido. Se não, é scrollado.\n\nTrabalha o hook." },
  { key: "motivacional_272", theme: "estrategia", text: "Oi {{name}} 💕\n\nMelhor hora pra postar: *quando seu público tá online*. Geralmente noite (19-22h) e início da tarde (12-14h).\n\nTesta horários. Anota. Repete o que funcionou." },
  { key: "motivacional_273", theme: "estrategia", text: "{{name}}, *legenda curta vence longa* no TikTok. 1-2 frases. Pergunta no fim. Chama comentário.\n\nComentário = algoritmo te empurra mais." },
  { key: "motivacional_274", theme: "estrategia", text: "{{name}} 🔥\n\nResponde TODO comentário nas primeiras 2h. *Vira virais*. O algoritmo vê interação e empurra o vídeo.\n\nDeixa notificação ligada." },
  { key: "motivacional_275", theme: "estrategia", text: "Oi {{name}} 🌹\n\nVídeo em 9:16 sempre. *Tela cheia rende mais*. Vídeo horizontal pro TikTok é tiro no pé.\n\nGrava sempre na vertical." },
  { key: "motivacional_276", theme: "estrategia", text: "{{name}}, *trending audio = empurra*. Usa áudio em alta. Algoritmo gosta. Não custa nada, dá visibilidade extra.\n\nVai na aba \"sons\" e vê o que tá bombando." },
  { key: "motivacional_277", theme: "estrategia", text: "{{name}} ✨\n\nLegenda \"comenta seu favorito\" *gera engajamento*. Pergunta direta no vídeo também. Algoritmo ama engajamento.\n\nCria pergunta. Sempre." },
  { key: "motivacional_278", theme: "estrategia", text: "Oi {{name}} 💕\n\nFaz *vídeo \"3 motivos pra...\"*. Lista pega muito. Cérebro ama número. Promete entrega clara.\n\nTesta essa semana." },
  { key: "motivacional_279", theme: "estrategia", text: "{{name}}, *thumb importa pouco no TikTok*. Posta sem stress. O algoritmo entrega pelo conteúdo, não pela capa.\n\nFoca em hook + valor." },
  { key: "motivacional_280", theme: "estrategia", text: "{{name}} 🌹\n\nPergunta polêmica no vídeo *explode comentário*. Boa pra crescer. Algumas funcionam: \"qual lado você?\", \"isso é normal?\", \"vocês concordam?\".\n\nUsa estrategicamente." },
  { key: "motivacional_281", theme: "estrategia", text: "Oi {{name}} 🔥\n\nVídeo de 15-30s costuma performar mais que vídeo de 60s. *Curto retém melhor*. Vai direto. Sem enrolar.\n\nCorta tudo que pode cortar." },
  { key: "motivacional_282", theme: "estrategia", text: "{{name}}, *hashtags têm pouco impacto* hoje. Não obceca. Usa 3-4. Foca em hook e conteúdo. Isso sim move o ponteiro." },
  { key: "motivacional_283", theme: "estrategia", text: "{{name}} 💕\n\nDuet e stitch são *atalhos pra crescer*. Reage a vídeo viral do nicho. Pega audiência emprestada. Funciona.\n\nTenta essa semana." },
  { key: "motivacional_284", theme: "estrategia", text: "Oi {{name}} ✨\n\nVídeo testado vence vídeo lindo. *Posta variações.* Mesmo conteúdo, hook diferente. Vê qual estourou. Repete o vencedor.\n\nA/B testing." },
  { key: "motivacional_285", theme: "estrategia", text: "{{name}}, *primeira frase tem que prender*. \"Eu não acreditava nisso até...\", \"3 coisas que ninguém te conta...\", \"Se você faz X, para AGORA\".\n\nColeta hooks. Usa." },
  { key: "motivacional_286", theme: "estrategia", text: "{{name}} 🌹\n\nMostra o produto na *PRIMEIRA cena*. Não esconde. Cliente que esperou ver, já desistiu. Mostra imediato.\n\nTesta." },
  { key: "motivacional_287", theme: "estrategia", text: "Oi {{name}}!\n\nLegenda no vídeo *aumenta retenção 30%*. Pessoas assistindo sem som leem. Sempre bota.\n\nApp do TikTok faz automático. Usa." },
  { key: "motivacional_288", theme: "estrategia", text: "{{name}} 🔥\n\nVende com *historia, não com lista de features*. \"Eu uso há 3 meses e mudou X\" vence \"Tem 5 funções\".\n\nHumaniza." },
  { key: "motivacional_289", theme: "estrategia", text: "Oi {{name}} 💕\n\n*Repostar conteúdo bom é estratégia*. Vídeo bombou? Posta de novo em 60 dias. Nova audiência. Mesma performance.\n\nNão tem regra contra." },
  { key: "motivacional_290", theme: "estrategia", text: "{{name}}, *postar de manhã vs noite*: testa os 2. Anota qual deu mais view nas primeiras 2h. Repete o vencedor.\n\nDados > achismo." },
  { key: "motivacional_291", theme: "estrategia", text: "{{name}} ✨\n\nSerie de vídeos *prende público*. \"Parte 1: ...\", \"Parte 2: ...\". Pessoas voltam pra próxima parte.\n\nCria série de 5 vídeos esse mês." },
  { key: "motivacional_292", theme: "estrategia", text: "Oi {{name}} 🌹\n\nFalha = dado. Vídeo flopou? *Não é fracasso — é informação*. Algo no hook ou no formato não pegou. Aprende. Próximo." },
  { key: "motivacional_293", theme: "estrategia", text: "{{name}}, *post pinado* no perfil = porta de entrada. Bota teu melhor vídeo, ou um que conte tua história. Bombar 1 vez, bombar pra sempre.\n\nFaz hoje." },
  { key: "motivacional_294", theme: "estrategia", text: "{{name}} 💕\n\nBio do TikTok tem que ser *clara em 1 linha*. \"Vendo produto X pra dor Y\". Sem rebuscar. Quem chega no perfil decide em 5 segundos." },
  { key: "motivacional_295", theme: "estrategia", text: "Oi {{name}} 🔥\n\nLinha do tempo de vídeos do mesmo tema cria *consistência percebida*. Algoritmo associa teu perfil ao nicho.\n\nFoco. 1 nicho. Aprofunda." },
  { key: "motivacional_296", theme: "estrategia", text: "{{name}}, *o vídeo do seu concorrente que mais viralizou* — estuda. O que ele fez de diferente? Aplica no teu, com tua cara.\n\nObservar é metade do método." },
  { key: "motivacional_297", theme: "estrategia", text: "{{name}} 🌹\n\nResponde aos seus comentários COM VÍDEO de resposta. *Engajamento explode.* TikTok ama essa feature. Empurra muito.\n\nTenta essa semana." },
  { key: "motivacional_298", theme: "estrategia", text: "Oi {{name}} ✨\n\nDicas em formato \"erro X que você comete\" performam muito. *Negativo prende atenção.* Use estrategicamente.\n\n\"3 erros no TikTok Shop\" vai bem." },
  { key: "motivacional_299", theme: "estrategia", text: "{{name}}, *grava ambiente claro, áudio limpo*. Resto é detalhe. Edição pesada pode até piorar. Simples vende.\n\nLuz natural + microfone do celular." },
  { key: "motivacional_300", theme: "estrategia", text: "{{name}} 💕\n\n*300 mensagens.* Você tá quase no ano completo. Acumulou conhecimento. Aplicou? Não? *Hoje aplica 1 coisa.* Vai." },
];

// =============================================================================
// 301-330: PROPOSITO / SIGNIFICADO
// =============================================================================
const PROPOSITO: MotivationalEntry[] = [
  { key: "motivacional_301", theme: "proposito", text: "{{name}}, *por que você começou nisso?*\n\nLembra? Liberdade financeira? Trabalhar de casa? Ser tua patroa? Mostrar pros filhos que dá?\n\nEsse motivo te segura nos dias difíceis. Volta nele." },
  { key: "motivacional_302", theme: "proposito", text: "Oi {{name}} 💕\n\nDinheiro é meio, não fim. *O fim é a vida que você quer*. Mais tempo com quem ama. Mais liberdade. Mais dignidade.\n\nO TikTok Shop é só ferramenta. A vida é o prêmio." },
  { key: "motivacional_303", theme: "proposito", text: "{{name}}, *escreve numa folha o motivo pelo qual você quer crescer aqui*. Cola na geladeira. Lê todo dia.\n\nO motivo te puxa. Sem motivo, qualquer dor faz desistir." },
  { key: "motivacional_304", theme: "proposito", text: "{{name}} 🌹\n\nVocê NÃO tá fazendo isso só por você. Tá fazendo pelo seu eu de 5 anos. Pelos seus filhos. Pelos seus pais. Pelo legado.\n\nIsso muda como você acorda amanhã." },
  { key: "motivacional_305", theme: "proposito", text: "Oi {{name}}!\n\nLembra: a *liberdade vale o trabalho duro temporário*. Quem aceita o desconforto agora, conquista liberdade depois. Quem foge do desconforto, vive no desconforto eterno." },
  { key: "motivacional_306", theme: "proposito", text: "{{name}} ✨\n\nVocê não tá só vendendo. Tá *construindo legado*. Cada vídeo, cada live, cada venda — tijolo. O prédio é tua história.\n\nNão subestima o tijolo de hoje." },
  { key: "motivacional_307", theme: "proposito", text: "Oi {{name}} 💕\n\n*Você merece tudo isso*. Não tem ninguém mais qualificada que você pra ter a vida que tu quer. Você só precisa CONSTRUIR. Comigo. Hoje." },
  { key: "motivacional_308", theme: "proposito", text: "{{name}}, *o trabalho que você faz hoje, paga a liberdade de amanhã*.\n\nCada vídeo é um voto na vida que você quer. Vota hoje." },
  { key: "motivacional_309", theme: "proposito", text: "{{name}} 🔥\n\nPensa nas mulheres que te inspiram. *Elas começaram aonde você tá*. A diferença é só o tempo + a constância.\n\nTu vai chegar. Continua." },
  { key: "motivacional_310", theme: "proposito", text: "Oi {{name}} 🌹\n\nO TikTok Shop é uma *janela rara* na história. Mulher comum, sem investimento alto, sem diploma, podendo viver de criação digital. Aproveita.\n\nNão deixa passar." },
  { key: "motivacional_311", theme: "proposito", text: "{{name}}, *você é o exemplo* pra alguém. Filha, sobrinha, irmã. Quando você tenta — você ensina a tentar. Quando você desiste — você ensina a desistir.\n\nEnsina o que tu quer ver no mundo." },
  { key: "motivacional_312", theme: "proposito", text: "{{name}} 💕\n\nDinheiro extra muda casa, paga curso, vira terapia, vira viagem com mãe, vira tudo. *Não é luxo. É qualidade de vida.*\n\nTu merece. Lutar por isso é digno." },
  { key: "motivacional_313", theme: "proposito", text: "Oi {{name}} ✨\n\nLembra: a *única vida que você tem é essa*. Não dá pra deixar pra próxima. Faz dela o que tu quer. Hoje. Começa hoje.\n\n\"Algum dia\" não existe." },
  { key: "motivacional_314", theme: "proposito", text: "{{name}}, *o pior cenário* se você tentar e não der: você aprendeu, virou criadora, ganhou habilidade.\n\n*O pior cenário se você não tentar*: você vai morrer com vontade de ter tentado. Tenta." },
  { key: "motivacional_315", theme: "proposito", text: "{{name}} 🌹\n\nIndependência financeira é coragem. *Coragem de não depender. De decidir. De recusar.*\n\nVocê tá construindo coragem todo dia. Bonito demais." },
  { key: "motivacional_316", theme: "proposito", text: "Oi {{name}}!\n\nMulher com renda própria *muda a árvore familiar*. Próxima geração não passa pela mesma falta. Tu tá construindo isso. Bem maior que tu mesma." },
  { key: "motivacional_317", theme: "proposito", text: "{{name}} 🔥\n\nNão tô te oferecendo \"renda extra\". Tô te oferecendo *uma vida nova possível*. Trabalho que cabe no teu tempo, no teu jeito.\n\nIsso é raro. Honra." },
  { key: "motivacional_318", theme: "proposito", text: "Oi {{name}} 💕\n\nNão importa a tua idade. Não importa o teu histórico. *Recomeçar é direito teu*. O TikTok Shop não pergunta diploma. Só pergunta consistência.\n\nVocê pode." },
  { key: "motivacional_319", theme: "proposito", text: "{{name}}, *você não precisa de permissão*. De ninguém. Pra construir o que quiser. A internet democratizou isso. Aproveita.\n\nAutorização tu se dá sozinha." },
  { key: "motivacional_320", theme: "proposito", text: "{{name}} ✨\n\nUm dia uma menina vai te ver e dizer \"eu quero ser assim\". Esse dia chega. *Faz por essa menina*.\n\nFaz por ti. E por ela." },
  { key: "motivacional_321", theme: "proposito", text: "Oi {{name}} 🌹\n\nO mundo precisa de mais mulheres construindo. Conquistando. Sendo dona. *Você faz parte disso quando aparece no TikTok Shop*. Não subestima." },
  { key: "motivacional_322", theme: "proposito", text: "{{name}}, *liberdade tem preço*. Não é grátis. O preço é o trabalho consistente nos próximos meses. Vale cada centavo.\n\nPaga o preço. Aproveita o prêmio." },
  { key: "motivacional_323", theme: "proposito", text: "{{name}} 💕\n\nVocê NÃO tá perdendo tempo. Tá *investindo*. Diferente. Cada hora aqui é hora plantada. Vai colher.\n\nConfia no processo." },
  { key: "motivacional_324", theme: "proposito", text: "Oi {{name}} 🔥\n\nUm ano que passa, passa de qualquer jeito. *Daqui 1 ano tu pode estar muito longe — se começar hoje*. Ou no mesmo lugar — se procrastinar.\n\nHoje conta." },
  { key: "motivacional_325", theme: "proposito", text: "{{name}}, *você é responsável pela tua vida*. Triste, lindo, mas verdadeiro. Ninguém vai te salvar. Só tu mesma. E tu é capaz.\n\nA chave é tua. Usa." },
  { key: "motivacional_326", theme: "proposito", text: "{{name}} 🌹\n\nO maior arrependimento das pessoas no fim da vida: \"queria ter tentado\". *Não seja parte desse grupo.* Tenta. Mesmo errado. Mesmo zoado.\n\nTenta hoje." },
  { key: "motivacional_327", theme: "proposito", text: "Oi {{name}} ✨\n\nLembra: você NÃO precisa ser exemplo de sucesso pra ninguém. *Precisa ser exemplo de COMEÇAR*. Quem começa, já é raro.\n\nVocê já começou." },
  { key: "motivacional_328", theme: "proposito", text: "{{name}}, *autonomia financeira é amor próprio em forma de planilha*.\n\nQuando tu não depende de ninguém, tu escolhe. E escolher é poder.\n\nConstrói teu poder hoje." },
  { key: "motivacional_329", theme: "proposito", text: "{{name}} 💕\n\nTu tá construindo uma versão tua que daqui 5 anos vai te orgulhar. Cada dia hoje é tijolo dela.\n\nHonra ela. Faz teu pouco hoje." },
  { key: "motivacional_330", theme: "proposito", text: "Oi {{name}} 🌹\n\n*Tu é mais forte do que pensa*. Aguentou tudo que veio. Aguenta mais um dia. Mais um vídeo. Mais um teste.\n\nA prova é que tu chegou até aqui." },
];

// =============================================================================
// 331-365: CELEBRACAO / PEQUENAS VITORIAS / GRATIDAO
// =============================================================================
const CELEBRACAO: MotivationalEntry[] = [
  { key: "motivacional_331", theme: "celebracao", text: "{{name}}, *celebra o pouco*.\n\n1 venda, 1 comentário bom, 1 dia de rotina batida. Cada vitória pequena recarrega tua bateria. Não despreza.\n\nLembra de UMA conquista tua hoje." },
  { key: "motivacional_332", theme: "celebracao", text: "Oi {{name}} 💕\n\nVocê tá MAIS LONGE do que estava mês passado. Promessa. Não dá pra perceber dia a dia, mas o caminho é real.\n\nReflete sobre o que mudou em ti." },
  { key: "motivacional_333", theme: "celebracao", text: "{{name}}, *vitória pequena merece print*. Primeira venda, primeiro comentário grande, primeira live. Salva. Olha quando bater desânimo.\n\nMemorias positivas alimentam quando o caminho fica pesado." },
  { key: "motivacional_334", theme: "celebracao", text: "{{name}} 🌹\n\nObrigada por confiar no método. Por aparecer. Por tentar. *Isso já é raro.* A maioria nem chega a começar. Tu chegou.\n\nReconhece teu mérito." },
  { key: "motivacional_335", theme: "celebracao", text: "Oi {{name}}!\n\nFinal de semana boa! *Descansa sem culpa.* Domingo não é dia de cobrar produtividade. É de recarregar.\n\nVolta segunda mais forte. Faz parte." },
  { key: "motivacional_336", theme: "celebracao", text: "{{name}} ✨\n\nFaz uma lista das tuas vitórias *do mês*. Pequenas, médias, grandes. Lê. Sorri.\n\nSer dura contigo é fácil. Reconhecer-te requer prática. Pratica." },
  { key: "motivacional_337", theme: "celebracao", text: "Oi {{name}} 💕\n\nTu cresceu nesse último mês. Mesmo se *parece* que não. Faz teste: lê uma aula que viu há 1 mês. Tu vai entender mais agora. Prova.\n\nProgresso silencioso é progresso real." },
  { key: "motivacional_338", theme: "celebracao", text: "{{name}}, *o dia em que tu menos quer trabalhar é o dia mais importante pra trabalhar*. Esses dias constroem o caráter de criadora.\n\nFaz hoje. Mesmo cansada. Vai te orgulhar." },
  { key: "motivacional_339", theme: "celebracao", text: "{{name}} 🔥\n\nLembra do dia em que tu *quase desistiu mas continuou*? Olha onde tu tá hoje. *Esse dia mudou tudo*. Vai ter outro dia desses. Continua.\n\nTu sabe o caminho." },
  { key: "motivacional_340", theme: "celebracao", text: "Oi {{name}} 🌹\n\nObrigada por estar aqui há tanto tempo. *A gente caminhou junto.* Não importa o quanto tu já cresceu — importa que tu não parou. Isso é raro." },
  { key: "motivacional_341", theme: "celebracao", text: "{{name}}, *comemora a tentativa, não só o resultado*. Tentou? Marca como vitória. Resultado vem. Mas tentar é mérito.\n\nFoco em tentar mais essa semana." },
  { key: "motivacional_342", theme: "celebracao", text: "{{name}} 💕\n\nUm vídeo tem 1000 views e tu acha pouco? *São 1000 pessoas.* Imagina 1000 pessoas num auditório te ouvindo. Não é pouco. É enorme.\n\nMuda perspectiva." },
  { key: "motivacional_343", theme: "celebracao", text: "Oi {{name}} ✨\n\nTudo que tu fez nos últimos 30 dias *NÃO seria possível há 1 ano*. Aprendeu, testou, falhou, voltou. Crescimento real.\n\nReconhece." },
  { key: "motivacional_344", theme: "celebracao", text: "{{name}}, *vitória existe mesmo sem dinheiro*. Você ficou mais clara sobre o que vende? Vitória. Aprendeu novo formato? Vitória.\n\nNão é só pix que conta." },
  { key: "motivacional_345", theme: "celebracao", text: "{{name}} 🌹\n\nDescansa hoje *sem culpa*. Descanso é parte do método também. Trabalhar exausta produz vídeo ruim. Recarrega.\n\nVolta amanhã." },
  { key: "motivacional_346", theme: "celebracao", text: "Oi {{name}}!\n\nPrimeira live? Marco. Primeiro produto? Marco. Primeira venda? Marco. Primeiro mês inteiro de rotina? Marco.\n\n*Tua jornada tem marcos. Reconhece cada um.*" },
  { key: "motivacional_347", theme: "celebracao", text: "{{name}} 🔥\n\nLembra: *progresso > perfeição*. Tu não precisa ser perfeita. Precisa estar melhor que ontem.\n\nHoje > ontem. Se sim, ganhou o dia." },
  { key: "motivacional_348", theme: "celebracao", text: "Oi {{name}} 💕\n\nA versão tua de daqui 1 ano *já tá te agradecendo* pelo trabalho que tu faz hoje. Sente isso. Cada vídeo é presente pra ela.\n\nFaz pra ela." },
  { key: "motivacional_349", theme: "celebracao", text: "{{name}}, *tu não tá só ganhando dinheiro*. Tá ganhando confiança. Voz. Presença. Habilidade.\n\nIsso tu leva pra vida. Pra sempre." },
  { key: "motivacional_350", theme: "celebracao", text: "{{name}} ✨\n\n*350 dias.* Eu te admiro por chegar aqui. Sério. A maioria não chega. Tu sim.\n\nAqui é só o começo. Bora pro próximo round." },
  { key: "motivacional_351", theme: "celebracao", text: "Oi {{name}} 🌹\n\nReconhece a coragem em ti. *Foi corajoso começar.* Foi corajoso ter comprado. Foi corajoso aparecer. Reconhece.\n\nCoragem não é ausência de medo. É fazer com medo. Tu tá." },
  { key: "motivacional_352", theme: "celebracao", text: "{{name}}, *cada feedback é progresso*. Comentário negativo? Aprendeu. Positivo? Confirmou. Nenhum? Hora de ajustar.\n\nTudo é informação. Tudo é vitória." },
  { key: "motivacional_353", theme: "celebracao", text: "{{name}} 💕\n\nVocê passa por tantas mudanças interiores no caminho de criadora. *Vira outra pessoa.* Mais segura. Mais decidida. Mais dona.\n\nEsse processo já vale ouro." },
  { key: "motivacional_354", theme: "celebracao", text: "Oi {{name}} 🔥\n\nO que tu construiu *é teu pra sempre*. Pode demorar pra dar resultado em dinheiro, mas tudo que tu aprendeu fica. Ninguém tira. Sempre.\n\nValorize." },
  { key: "motivacional_355", theme: "celebracao", text: "{{name}}, *celebra ter chegado até aqui*. 365 mensagens, 365 dias possíveis. Tu acompanhou. Mostra resistência. Vai longe.\n\nPróximo ano: ainda mais alto." },
  { key: "motivacional_356", theme: "celebracao", text: "{{name}} 🌹\n\nQuando tu fizer 1 ano completo no método, *escreve uma carta pra ti mesma do início*. Conta o que mudou. Salva.\n\nVai te lembrar de quem tu virou." },
  { key: "motivacional_357", theme: "celebracao", text: "Oi {{name}} ✨\n\nProgresso parece zero por meses. Aí *explode num dia*. Não é mágica — é acúmulo. Confia no acúmulo. Não pra agora.\n\nO dia da explosão chega." },
  { key: "motivacional_358", theme: "celebracao", text: "{{name}}, *alguma coisa em ti mudou desde que começou aqui*. Pequena que seja. Reconhece.\n\nMudança é prova de movimento. Movimento leva longe." },
  { key: "motivacional_359", theme: "celebracao", text: "{{name}} 💕\n\nObrigada por confiar. Por permitir que o método faça parte da tua história. Significa muito. *Tu é parte do nosso propósito.*\n\nA gente cresce junto." },
  { key: "motivacional_360", theme: "celebracao", text: "Oi {{name}} 🔥\n\n*Quase 1 ano de mensagens diárias*. Tu superou tudo. Trocou em ti mesma. Construiu hábito. Aprendeu. Aplicou.\n\nNão é pouca coisa. É enorme." },
  { key: "motivacional_361", theme: "celebracao", text: "{{name}}, *o caminho não terminou*. Vai recomeçar agora. Mas tu volta diferente. Mais sábia. Mais forte.\n\nPróxima volta vai ser outra coisa." },
  { key: "motivacional_362", theme: "celebracao", text: "{{name}} 🌹\n\nA tua jornada NÃO acaba aqui. Ela só *acelera*. Tudo que tu plantou nos últimos meses agora vira colheita. Confia.\n\nAs sementes germinam no tempo certo." },
  { key: "motivacional_363", theme: "celebracao", text: "Oi {{name}} 💕\n\nReconhece: tu chegou aqui por DECISÃO TUA. Ninguém te obrigou. Tu escolheu. Tu fez. *Tu é dona disso.*\n\nIsso é raro. Honra." },
  { key: "motivacional_364", theme: "celebracao", text: "{{name}}, *amanhã começa um novo ciclo*. Mais sábia, mais experiente. Mesma garra. *Bora pra outra volta.*\n\nObrigada pela companhia. Tô aqui." },
  { key: "motivacional_365", theme: "celebracao", text: "Oi {{name}} ✨\n\n*Último dia do ciclo de 365.* Você chegou. Tu é o exemplo. Tu é a prova. Tu é a criadora.\n\nPróximo ciclo: ainda mais alto. Bora juntas. _Yara · Método TTS_ 🌹" },
];

// =============================================================================
// EXPORTS
// =============================================================================

export const MOTIVATIONAL_LIBRARY: MotivationalEntry[] = [
  ...ROTINA,
  ...CONSTANCIA,
  ...COMPARACAO,
  ...CANSACO,
  ...FATURAMENTO,
  ...LIVE,
  ...COMUNIDADE,
  ...PRODUTO,
  ...APRENDIZADO,
  ...ESTRATEGIA,
  ...PROPOSITO,
  ...CELEBRACAO,
];

// Sanity check — em dev se algum dia desalinhar o numero, vai dar erro claro.
if (MOTIVATIONAL_LIBRARY.length !== 365) {
  throw new Error(
    `MOTIVATIONAL_LIBRARY tem ${MOTIVATIONAL_LIBRARY.length} entries, esperado 365.`,
  );
}

// =============================================================================
// TRIGGERS — separados da rotation motivacional (template_key diferente)
// =============================================================================

export const TRIGGER_DIA1_NAO_LOGOU_KEY = "trigger_dia1_nao_logou";

export function buildTriggerDia1NaoLogou(input: {
  firstName: string;
  loginUrl: string;
}): { text: string } {
  const name = firstName(input.firstName);
  const text = [
    `Oi ${name}! 👋`,
    ``,
    `Vi aqui que seu acesso ao *Método TTS* já tá liberado, mas você ainda não entrou no app.`,
    ``,
    `Quer que eu te ajude? É só clicar aqui:`,
    `🔗 ${input.loginUrl}`,
    ``,
    `Login = seu email da compra. Se perdeu a senha, no app mesmo tem o "Esqueci a senha".`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

export const TRIGGER_SUMIU_7D_KEY = "trigger_sumiu_7d";

export function buildTriggerSumiu7d(input: { firstName: string }): { text: string } {
  const name = firstName(input.firstName);
  const text = [
    `Oi ${name}, senti sua falta no app 💔`,
    ``,
    `Faz uma semana que você não entra. Tá tudo bem?`,
    ``,
    `Se travou em alguma coisa — dúvida técnica, dúvida de produto, falta de tempo — abre o app e a gente desbloqueia. O método foi feito pra isso.`,
    ``,
    `Lembra: *5 minutinhos por dia* já te coloca na frente de 90% das criadoras.`,
    ``,
    `Bora voltar?`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

export const TRIGGER_STREAK_3_KEY = "trigger_streak_3";

export function buildTriggerStreak3(input: { firstName: string }): { text: string } {
  const name = firstName(input.firstName);
  const text = [
    `${name} 🔥🔥🔥`,
    ``,
    `*3 dias seguidos batendo a rotina.*`,
    ``,
    `Sabe o que isso significa? Você acabou de virar o jogo. As meninas que viraram top do ranking começaram exatamente assim — pequenas vitórias diárias.`,
    ``,
    `Não para agora. Bora pra 7? 💪`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

// ============================================================
// TRIGGER: 1o faturamento registrado
// ============================================================
export const TRIGGER_PRIMEIRO_FATURAMENTO_KEY = "trigger_primeiro_faturamento";

export function buildTriggerPrimeiroFaturamento(input: { firstName: string }): {
  text: string;
} {
  const name = firstName(input.firstName);
  const text = [
    `🎉 ${name}!`,
    ``,
    `*PRIMEIRA VENDA REGISTRADA.* Você acabou de entrar pro time de quem JÁ vende no TikTok Shop.`,
    ``,
    `A partir daqui é só escalar. Próximo desafio: dobrar esse número até o fim do mês.`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

// ============================================================
// TRIGGER: tinha streak >=3 dias e parou (dois dias sem bater)
// ============================================================
export const TRIGGER_STREAK_QUEBRADO_KEY = "trigger_streak_quebrado";

export function buildTriggerStreakQuebrado(input: { firstName: string }): {
  text: string;
} {
  const name = firstName(input.firstName);
  const text = [
    `${name}, senti sua falta na rotina 💔`,
    ``,
    `Você tava num streak lindo. *Não larga agora* — quem volta no 1° dia perdido recupera mais rápido do que quem espera 1 semana.`,
    ``,
    `5 minutinhos. Abre o app.`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

// ============================================================
// TRIGGER: 1o produto cadastrado
// ============================================================
export const TRIGGER_PRIMEIRO_PRODUTO_KEY = "trigger_primeiro_produto";

export function buildTriggerPrimeiroProduto(input: { firstName: string }): {
  text: string;
} {
  const name = firstName(input.firstName);
  const text = [
    `${name}, 1° produto cadastrado! 📦`,
    ``,
    `Agora a parte mais legal: *gera roteiros pra ele*. A cola rápida + o agente do app fazem em 2 minutos.`,
    ``,
    `Vai lá e testa.`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

// ============================================================
// TRIGGER: 1o roteiro gerado
// ============================================================
export const TRIGGER_PRIMEIRO_ROTEIRO_KEY = "trigger_primeiro_roteiro";

export function buildTriggerPrimeiroRoteiro(input: { firstName: string }): {
  text: string;
} {
  const name = firstName(input.firstName);
  const text = [
    `${name}, 1° roteiro pronto! ✨`,
    ``,
    `Agora SÓ FALTA gravar. Pega o celular, lê o hook, mostra o produto, posta. *Não precisa estar perfeito.*`,
    ``,
    `O 1° vídeo é o mais difícil. Depois vicia.`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

// ============================================================
// TRIGGER: bateu meta mensal (faturamento >= meta_mensal_brl)
// ============================================================
export const TRIGGER_BATEU_META_MENSAL_KEY = "trigger_bateu_meta_mensal";

export function buildTriggerBateuMetaMensal(input: {
  firstName: string;
  meta_brl: number;
}): { text: string } {
  const name = firstName(input.firstName);
  const valor = input.meta_brl.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const text = [
    `${name}, META BATIDA 🔥🔥🔥`,
    ``,
    `Você cumpriu sua meta de *${valor}* esse mês. Isso é gente que joga pra ganhar.`,
    ``,
    `*Sobe a meta agora* pro próximo mês. Quem para de subir a régua, para de crescer.`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

// ============================================================
// TRIGGER: completou tour da home
// ============================================================
export const TRIGGER_TOUR_COMPLETO_KEY = "trigger_tour_completo";

export function buildTriggerTourCompleto(input: { firstName: string }): {
  text: string;
} {
  const name = firstName(input.firstName);
  const text = [
    `${name}, terminou o tour! 🎓`,
    ``,
    `Agora você sabe onde tudo fica. Hora de usar de verdade:`,
    ``,
    `1. Bate a rotina (5min)`,
    `2. Cadastra teu 1° produto`,
    `3. Gera teu 1° roteiro`,
    ``,
    `3 passos, 30 minutos. Você consegue.`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

// ============================================================
// TRIGGER: baixou 1o ebook
// ============================================================
export const TRIGGER_EBOOK_BAIXADO_KEY = "trigger_ebook_baixado";

export function buildTriggerEbookBaixado(input: { firstName: string }): {
  text: string;
} {
  const name = firstName(input.firstName);
  const text = [
    `${name}, baixou o ebook! 📚`,
    ``,
    `Dica de ouro: *lê 5 páginas por dia*. Não tudo de uma vez. 5 páginas com canetinha na mão pra anotar.`,
    ``,
    `Conhecimento aplicado vence conhecimento empilhado.`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

// ============================================================
// TRIGGER: bateu rotina em 30 dos ultimos 30 dias
// ============================================================
export const TRIGGER_ROTINA_30DIAS_KEY = "trigger_rotina_30dias";

export function buildTriggerRotina30Dias(input: { firstName: string }): {
  text: string;
} {
  const name = firstName(input.firstName);
  const text = [
    `${name}, 30 DIAS DE ROTINA 💪🌹`,
    ``,
    `Sabe o que você acabou de construir? *IDENTIDADE.* Você agora É uma criadora consistente. Não é mais "quero ser" — É.`,
    ``,
    `Próxima meta: 60 dias. Quem chega aos 30 chega aos 60 fácil.`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

// ============================================================
// TRIGGER: pagante com assinatura encerrando em 1-3 dias
// ============================================================
// Dispara pra alunas com plan_status='active'/'late' cujo
// plan_expires_at cai nas proximas 72h. Lembra de renovar com
// MESMO email pra nao perder dados/historico.
export const TRIGGER_PLANO_ENCERRANDO_3D_KEY = "trigger_plano_encerrando_3d";

export function buildTriggerPlanoEncerrando3d(input: {
  firstName: string;
  diasRestantes: number;
  email: string;
  checkoutUrl: string;
}): { text: string } {
  const name = firstName(input.firstName);
  const diasTxt =
    input.diasRestantes <= 1
      ? "*amanhã*"
      : input.diasRestantes === 2
        ? "em *2 dias*"
        : "em *3 dias*";
  const text = [
    `Oi ${name} 💕`,
    ``,
    `Sua assinatura do *Método TTS* encerra ${diasTxt}. Renova antes pra não perder acesso aos agentes, rotina e seu histórico no app.`,
    ``,
    `🔗 ${input.checkoutUrl}`,
    ``,
    `⚠️ *IMPORTANTE:* compra com o MESMO email da sua conta (*${input.email}*). Se usar outro, sua nova compra vai criar conta nova e você perde tudo o que construiu aqui.`,
    ``,
    `Se já renovou, ignora essa mensagem 🌹`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

// ============================================================
// TRIGGER: aluna em trial expirando em 1-3 dias
// ============================================================
// Pega quem ta usando trial e tem expires nas proximas 72h.
// CTA pra virar pagante mantendo MESMO email (preserva todo
// historico/rotina/produtos cadastrados no trial).
export const TRIGGER_TRIAL_EXPIRANDO_3D_KEY = "trigger_trial_expirando_3d";

export function buildTriggerTrialExpirando3d(input: {
  firstName: string;
  diasRestantes: number;
  email: string;
  checkoutUrl: string;
}): { text: string } {
  const name = firstName(input.firstName);
  const diasTxt =
    input.diasRestantes <= 1
      ? "*amanhã*"
      : input.diasRestantes === 2
        ? "*em 2 dias*"
        : "*em 3 dias*";
  const text = [
    `Oi ${name} 💕`,
    ``,
    `Seu período de teste do *Método TTS* termina ${diasTxt}. Pra não perder acesso aos agentes, rotina e tudo que você já cadastrou aqui — assina agora:`,
    ``,
    `🔗 ${input.checkoutUrl}`,
    ``,
    `⚠️ *IMPORTANTE:* compra com o MESMO email do seu trial (*${input.email}*). Assim sua conta é reativada na hora e você mantém TUDO. Email diferente = conta nova zerada.`,
    ``,
    `Se tiver dúvida me chama 🌹`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

// ============================================================
// TRIGGER: trial expirou (acabou de cair pra inactive)
// ============================================================
export const TRIGGER_TRIAL_EXPIROU_KEY = "trigger_trial_expirou";

export function buildTriggerTrialExpirou(input: {
  firstName: string;
  email: string;
  checkoutUrl: string;
}): { text: string } {
  const name = firstName(input.firstName);
  const text = [
    `Oi ${name} 😔`,
    ``,
    `Seu *teste do Método TTS acabou*. Seu acesso ao app foi pausado, mas seus dados (produtos, rotina, score, histórico) continuam guardadinhos aqui esperando você voltar.`,
    ``,
    `Pra retomar de onde parou, é só assinar:`,
    `🔗 ${input.checkoutUrl}`,
    ``,
    `⚠️ *COMPRE COM O MESMO EMAIL* (*${input.email}*). Aí sua conta reativa na hora e você não perde NADA. Email diferente = conta nova zerada.`,
    ``,
    `Tô aqui se precisar 🌹`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

// ============================================================
// TRIGGER: pagante teve plano cancelado/reembolsado
// ============================================================
export const TRIGGER_PLANO_CANCELOU_KEY = "trigger_plano_cancelou";

export function buildTriggerPlanoCancelou(input: {
  firstName: string;
  email: string;
  checkoutUrl: string;
}): { text: string } {
  const name = firstName(input.firstName);
  const text = [
    `Oi ${name} 💔`,
    ``,
    `Vimos que sua assinatura do *Método TTS* foi encerrada. Sentimos sua falta de verdade — sua conta fica guardada por aqui por enquanto, caso queira voltar.`,
    ``,
    `Se quiser retomar, é simples:`,
    `🔗 ${input.checkoutUrl}`,
    ``,
    `⚠️ *USA O MESMO EMAIL* (*${input.email}*) na nova compra. Aí sua conta reativa com tudo onde você parou — agentes, produtos, rotina, score, histórico.`,
    ``,
    `E se foi algo que poderíamos ter feito melhor, responde aqui — quero entender 🌹`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

// ============================================================
// TRIGGER: aluna reativou conta (voltou a ser pagante)
// ============================================================
export const TRIGGER_PLANO_REATIVADO_KEY = "trigger_plano_reativado";

// ============================================================
// TRIGGER: lembrete noturno de checkin (20:30 BRT)
// ============================================================
export const TRIGGER_LEMBRETE_CHECKIN_KEY = "trigger_lembrete_checkin";

export function buildLembreteCheckin(input: { firstName: string }): { text: string } {
  const name = firstName(input.firstName);
  const text = [
    `${name} 🌙`,
    ``,
    `Lembrete carinhoso: você ainda não bateu sua *rotina de hoje* no *Método TTS*.`,
    ``,
    `São 5 minutinhos. Fecha o dia em ordem, mantém o ritmo, e amanhã você já acorda em frente.`,
    ``,
    `🔗 https://www.metodotts.app`,
    ``,
    `Boa noite 💕`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

export function buildTriggerPlanoReativado(input: {
  firstName: string;
}): { text: string } {
  const name = firstName(input.firstName);
  const text = [
    `${name} 🎉`,
    ``,
    `BEM VINDA DE VOLTA! Sua conta no *Método TTS* foi reativada e seu acesso já tá liberado.`,
    ``,
    `Tudo que você tinha continua aqui: produtos, rotina, score, histórico. Bora retomar de onde parou:`,
    ``,
    `1. Abre o app e bate a rotina de hoje (5min)`,
    `2. Confere os agentes — sempre tem coisa nova`,
    `3. Marca teu próximo objetivo`,
    ``,
    `Que bom te ver de volta 💕`,
    ``,
    `_Yara · Método TTS_`,
  ].join("\n");
  return { text };
}

// ============================================================
// TRIGGER: aviso 24h antes de remocao do grupo
// ============================================================
// Dispara quando plano caiu (canceled/refunded/inactive/chargeback)
// e worker runGroupCleanup() vai remover dos grupos 24h depois.
// NAO comeca com 'motivacional_' -> NAO conta no weekly limit.
export const TRIGGER_GROUP_REMOVAL_WARNING_KEY = "trigger_group_removal_warning";

export function buildTriggerGroupRemovalWarning(input: {
  firstName: string | null;
}): { text: string } {
  const name = firstName(input.firstName);
  const text = [
    `Oi ${name}, tudo bem? 💕`,
    ``,
    `Aqui é do *Método TTS*. Notamos que seu plano foi encerrado e infelizmente seu acesso ao grupo das alunas será removido nas próximas 24h.`,
    ``,
    `Mas se quiser continuar com a gente, é só *acessar sua conta novamente e ativar seu plano* — você volta automaticamente pra comunidade:`,
    ``,
    `🔗 https://www.metodotts.app`,
    ``,
    `Boa sorte, viu? Tô torcendo muito por você 🌹`,
  ].join("\n");
  return { text };
}

// ============================================================
// LEAD: Mensagem 1 — quebra de padrao (primeiro contato pra
// lead que preencheu /formulario mas nunca foi abordado).
// NAO assina como Yara — apresenta como suporte. Pergunta
// aberta pra iniciar conversa. Mensagens 2-6 do funil ficam
// na conversa manual da atendente apos resposta da lead.
// ============================================================
export const TRIGGER_LEAD_FIRST_CONTACT_KEY = "trigger_lead_first_contact";

export function buildTriggerLeadFirstContact(input: {
  firstName: string | null;
}): { text: string } {
  const name = firstName(input.firstName);
  const text = [
    `Oi, ${name} ❤️`,
    ``,
    `FAÇO PARTE DO SUPORTE DA YARA DO MÉTODO TIKTOK SHOP, LEMBRA?`,
    ``,
    `Posso te fazer uma pergunta sincera?`,
    ``,
    `Você entrou no grupo porque realmente quer ganhar dinheiro com TikTok Shop ou porque ficou curiosa sobre como funciona?`,
  ].join("\n");
  return { text };
}
