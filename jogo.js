const codigo =
    localStorage.getItem("codigoSala");

const jogadorId =
    localStorage.getItem("jogadorId");


// ========================================
// CONFIGURAÇÕES DO JOGO
// ========================================

const ORDEM_CARTAS = [
    "4",
    "5",
    "6",
    "7",
    "Q",
    "J",
    "K",
    "A",
    "2",
    "3"
];

const FORCA_NORMAL = [
    "4",
    "5",
    "6",
    "7",
    "Q",
    "J",
    "K",
    "A",
    "2",
    "3"
];

const NAIPES = [
    {
        nome: "paus",
        simbolo: "♣",
        forca: 4
    },
    {
        nome: "copas",
        simbolo: "♥",
        forca: 3
    },
    {
        nome: "espadas",
        simbolo: "♠",
        forca: 2
    },
    {
        nome: "ouros",
        simbolo: "♦",
        forca: 1
    }
];

const VALORES_MAO = [
    1,
    3,
    6,
    9,
    12
];


// ========================================
// BARALHO DE TRUCO
// 40 CARTAS
// ========================================

function criarBaralho() {

    const cartas = [];

    ORDEM_CARTAS.forEach(valor => {

        NAIPES.forEach(naipe => {

            cartas.push({

                id:
                    `${valor}-${naipe.nome}`,

                valor:
                    valor,

                naipe:
                    naipe.nome,

                simbolo:
                    naipe.simbolo

            });

        });

    });

    return cartas;
}


// ========================================
// EMBARALHAR
// ========================================

function embaralhar(cartas) {

    const copia = [...cartas];

    for (
        let i = copia.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            copia[i],
            copia[j]
        ] = [
            copia[j],
            copia[i]
        ];
    }

    return copia;
}


// ========================================
// TEXTO DA CARTA
// ========================================

function nomeCarta(carta) {

    if (!carta) {
        return "";
    }

    return `${carta.valor}${carta.simbolo}`;
}


// ========================================
// PRÓXIMA CARTA DA SEQUÊNCIA
// ========================================

function descobrirManilha(valorVira) {

    const indice =
        ORDEM_CARTAS.indexOf(valorVira);

    const proximoIndice =
        (indice + 1) %
        ORDEM_CARTAS.length;

    return ORDEM_CARTAS[
        proximoIndice
    ];
}


// ========================================
// FORÇA DA CARTA
// ========================================

function forcaCarta(
    carta,
    manilha
) {

    if (!carta) {
        return 0;
    }


    // Manilha
    if (
        carta.valor === manilha
    ) {

        const naipe =
            NAIPES.find(
                n =>
                    n.nome ===
                    carta.naipe
            );

        return 100 +
            naipe.forca;
    }


    // Carta normal
    return (
        FORCA_NORMAL.indexOf(
            carta.valor
        ) + 1
    );
}


// ========================================
// BUSCAR JOGADORES
// ========================================

async function buscarJogadores() {

    const { data, error } =
        await supabaseClient
            .from("partidas_truco")
            .select("*")
            .eq(
                "codigo_sala",
                codigo
            )
            .order(
                "criado_em",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        return [];
    }


    return data || [];
}


// ========================================
// JOGADOR PRINCIPAL DA PARTIDA
// ========================================
// O primeiro jogador criado na sala
// fica como responsável pelo estado
// compartilhado da mesa.

async function buscarResponsavel() {

    const jogadores =
        await buscarJogadores();

    return jogadores[0] || null;
}


// ========================================
// ESTADO PADRÃO
// ========================================

function criarEstadoInicial() {

    return {

        fase:
            "preparando",

        rodada:
            1,

        valorMao:
            1,

        vira:
            null,

        manilha:
            null,

        jogadas:
            [],

        rodadas:
            [],

        vitoriasTrio1:
            0,

        vitoriasTrio2:
            0,

        pontosTrio1:
            0,

        pontosTrio2:
            0,

        turnoInicial:
            null,

        pedidoTruco:
            null,

        mensagem:
            "Preparando a partida..."

    };
}


// ========================================
// PEGAR ESTADO
// ========================================

async function buscarEstado() {

    const responsavel =
        await buscarResponsavel();


    if (
        !responsavel ||
        !responsavel.cartas_mesa
    ) {

        return null;
    }


    let estado =
        responsavel.cartas_mesa;


    // Compatibilidade com o formato antigo
    if (Array.isArray(estado)) {

        estado =
            criarEstadoInicial();
    }


    return estado;
}


// ========================================
// SALVAR ESTADO
// ========================================

async function salvarEstado(
    estado,
    status = "jogando"
) {

    const responsavel =
        await buscarResponsavel();


    if (!responsavel) {
        return false;
    }


    const { error } =
        await supabaseClient
            .from("partidas_truco")
            .update({

                cartas_mesa:
                    estado,

                status:
                    status

            })
            .eq(
                "jogador_id",
                responsavel.jogador_id
            );


    if (error) {

        console.error(error);

        return false;
    }


    return true;
}


// ========================================
// ATUALIZAR TURNO
// ========================================

async function definirTurno(
    jogadorIdDestino
) {

    const jogadores =
        await buscarJogadores();


    for (
        const jogador of jogadores
    ) {

        await supabaseClient
            .from("partidas_truco")
            .update({

                turno:
                    jogador.jogador_id ===
                    jogadorIdDestino

            })
            .eq(
                "jogador_id",
                jogador.jogador_id
            );
    }
}


// ========================================
// ORGANIZAR MESA
// 🔴 🔵 🔴 🔵 🔴 🔵
// ========================================

async function organizarMesa() {

    const jogadores =
        await buscarJogadores();


    if (
        jogadores.length !== 6
    ) {
        return;
    }


    const trio1 =
        jogadores.filter(
            jogador =>
                jogador.trio === 1
        );


    const trio2 =
        jogadores.filter(
            jogador =>
                jogador.trio === 2
        );


    if (
        trio1.length !== 3 ||
        trio2.length !== 3
    ) {
        return;
    }


    const ordem = [

        trio1[0],
        trio2[0],

        trio1[1],
        trio2[1],

        trio1[2],
        trio2[2]

    ];


    ordem.forEach(
        (jogador, index) => {

            const elemento =
                document.getElementById(
                    `jogadora${index + 1}`
                );


            if (elemento) {

                elemento.textContent =
                    jogador.jogador_id ===
                    jogadorId

                        ? `Você - ${jogador.nome_jogador}`

                        : jogador.nome_jogador;
            }

        }
    );


    // Posiciona a mão do jogador
    // no lugar correto da mesa.

    const lugares =
        document.querySelectorAll(
            ".jogadora"
        );


    const indiceMeuJogador =
        ordem.findIndex(
            jogador =>
                jogador.jogador_id ===
                jogadorId
        );


    if (
        indiceMeuJogador >= 0 &&
        lugares[indiceMeuJogador]
    ) {

        const minhaArea =
            document.getElementById(
                "minhasCartas"
            );


        if (minhaArea) {

            lugares[
                indiceMeuJogador
            ].appendChild(
                minhaArea
            );

        }
    }
}


// ========================================
// INICIAR PARTIDA
// ========================================

async function iniciarPartida() {

    const jogadores =
        await buscarJogadores();


    if (
        jogadores.length !== 6
    ) {

        mostrarMensagem(
            "Aguardando 6 jogadores..."
        );

        return;
    }


    const trio1 =
        jogadores.filter(
            j => j.trio === 1
        );


    const trio2 =
        jogadores.filter(
            j => j.trio === 2
        );


    if (
        trio1.length !== 3 ||
        trio2.length !== 3
    ) {

        mostrarMensagem(
            "Aguardando 3 jogadores em cada trio..."
        );

        return;
    }


    const responsavel =
        jogadores[0];


    /*
     * Somente um navegador consegue
     * assumir o início da partida.
     */

    const { data, error } =
        await supabaseClient
            .from("partidas_truco")
            .update({

                status:
                    "iniciando"

            })
            .eq(
                "jogador_id",
                responsavel.jogador_id
            )
            .eq(
                "status",
                "aguardando"
            )
            .select();


    if (error) {

        console.error(error);

        return;
    }


    // Se não conseguiu assumir,
    // outro jogador já está iniciando.

    if (
        !data ||
        data.length === 0
    ) {

        await esperarPartida();

        return;
    }


    await distribuirNovaMao(
        jogadores
    );
}


// ========================================
// DISTRIBUIR NOVA MÃO
// ========================================

async function distribuirNovaMao(
    jogadores,
    pontuacaoAtual = null,
    primeiroJogadorId = null
) {

    let pontosTrio1 = 0;
    let pontosTrio2 = 0;


    if (pontuacaoAtual) {

        pontosTrio1 =
            pontuacaoAtual.pontosTrio1;

        pontosTrio2 =
            pontuacaoAtual.pontosTrio2;

    }
    else {

        const estadoAnterior =
            await buscarEstado();

        if (estadoAnterior) {

            pontosTrio1 =
                estadoAnterior.pontosTrio1 || 0;

            pontosTrio2 =
                estadoAnterior.pontosTrio2 || 0;
        }
    }


    const ordem = [
        ...jogadores
    ];


    let indiceInicial = 0;


    if (primeiroJogadorId) {

        const indice =
            ordem.findIndex(
                jogador =>
                    jogador.jogador_id ===
                    primeiroJogadorId
            );


        if (indice >= 0) {
            indiceInicial = indice;
        }

    }


    const baralho =
        embaralhar(
            criarBaralho()
        );


    const maos = {};


    jogadores.forEach(
        jogador => {

            maos[
                jogador.jogador_id
            ] = [];

        }
    );


    // Distribui 3 cartas
    // para cada jogador.

    for (let i = 0; i < 3; i++) {

        for (let j = 0; j < ordem.length; j++) {

            const indice =
                (
                    indiceInicial +
                    j
                ) % ordem.length;


            const jogador =
                ordem[indice];


            maos[
                jogador.jogador_id
            ].push(
                baralho.shift()
            );
        }
    }


    // A próxima carta vira.

    const vira =
        baralho.shift();


    const manilha =
        descobrirManilha(
            vira.valor
        );


    const estado =
        criarEstadoInicial();


    estado.fase =
        "jogando";

    estado.vira =
        vira;

    estado.manilha =
        manilha;

    estado.pontosTrio1 =
        pontosTrio1;

    estado.pontosTrio2 =
        pontosTrio2;

    estado.turnoInicial =
        ordem[indiceInicial]
            .jogador_id;

    estado.mensagem =
        `Vira: ${nomeCarta(vira)} — Manilha: ${manilha}`;


    // Salva as cartas de cada jogador.

    for (
        const jogador of jogadores
    ) {

        await supabaseClient
            .from("partidas_truco")
            .update({

                cartas:
                    maos[
                        jogador.jogador_id
                    ],

                turno:
                    jogador.jogador_id ===
                    ordem[indiceInicial]
                        .jogador_id,

                pontos:
                    jogador.trio === 1
                        ? pontosTrio1
                        : pontosTrio2,

                status:
                    "jogando"

            })
            .eq(
                "jogador_id",
                jogador.jogador_id
            );
    }


    const responsavel =
        jogadores[0];


    await supabaseClient
        .from("partidas_truco")
        .update({

            cartas_mesa:
                estado,

            status:
                "jogando"

        })
        .eq(
            "jogador_id",
            responsavel.jogador_id
        );


    renderizarTudo();
}


// ========================================
// ESPERAR PARTIDA
// ========================================

async function esperarPartida() {

    const estado =
        await buscarEstado();


    if (
        estado &&
        estado.fase === "jogando"
    ) {

        renderizarTudo();

        return;
    }


    mostrarMensagem(
        "Preparando cartas..."
    );


    setTimeout(
        iniciarPartida,
        1200
    );
}


// ========================================
// MINHAS CARTAS
// ========================================

async function carregarMinhaMao() {

    const { data, error } =
        await supabaseClient
            .from("partidas_truco")
            .select("cartas")
            .eq(
                "jogador_id",
                jogadorId
            )
            .single();


    if (error) {

        console.error(error);

        return;
    }


    mostrarCartas(
        data.cartas || []
    );
}


// ========================================
// MOSTRAR CARTAS
// ========================================

function mostrarCartas(
    cartas
) {

    const area =
        document.getElementById(
            "minhasCartas"
        );


    if (!area) {
        return;
    }


    area.innerHTML = "";


    cartas.forEach(
        (carta, index) => {

            const botao =
                document.createElement(
                    "button"
                );


            botao.className =
                "carta-jogavel";


            botao.textContent =
                nomeCarta(carta);


            botao.title =
                `${carta.valor} de ${carta.naipe}`;


            botao.onclick =
                () => {

                    jogarCarta(
                        index
                    );

                };


            area.appendChild(
                botao
            );

        }
    );
}


// ========================================
// JOGAR CARTA
// ========================================

async function jogarCarta(
    indiceCarta
) {

    const estado =
        await buscarEstado();


    if (
        !estado ||
        estado.fase !== "jogando"
    ) {
        return;
    }


    if (estado.pedidoTruco) {

        alert(
            "Responda ao pedido antes de jogar."
        );

        return;
    }


    const jogadores =
        await buscarJogadores();


    const eu =
        jogadores.find(
            jogador =>
                jogador.jogador_id ===
                jogadorId
        );


    if (!eu) {
        return;
    }


    if (!eu.turno) {

        alert(
            "Não é a sua vez!"
        );

        return;
    }


    if (
        !eu.cartas ||
        !eu.cartas[indiceCarta]
    ) {
        return;
    }


    const carta =
        eu.cartas[indiceCarta];


    const novasCartas =
        [...eu.cartas];


    novasCartas.splice(
        indiceCarta,
        1
    );


    const jogada = {

        jogador_id:
            eu.jogador_id,

        nome:
            eu.nome_jogador,

        trio:
            eu.trio,

        carta:
            carta

    };


    const novasJogadas =
        [
            ...(estado.jogadas || []),
            jogada
        ];


    estado.jogadas =
        novasJogadas;


    estado.mensagem =
        `${eu.nome_jogador} jogou ${nomeCarta(carta)}`;


    // Remove o turno do jogador atual.

    await supabaseClient
        .from("partidas_truco")
        .update({

            cartas:
                novasCartas,

            turno:
                false

        })
        .eq(
            "jogador_id",
            jogadorId
        );


    // Se os 6 jogadores já jogaram,
    // resolve a rodada.

    if (
        novasJogadas.length === 6
    ) {

        await salvarEstado(
            estado,
            "jogando"
        );


        await finalizarRodada();

        return;
    }


    // Próximo jogador.

    const proximo =
        descobrirProximoJogador(
            jogadores,
            eu.jogador_id
        );


    await salvarEstado(
        estado,
        "jogando"
    );


    if (proximo) {

        await definirTurno(
            proximo.jogador_id
        );

    }


    renderizarTudo();
}


// ========================================
// DESCOBRIR PRÓXIMO JOGADOR
// ========================================

function descobrirProximoJogador(
    jogadores,
    jogadorAtualId
) {

    const indice =
        jogadores.findIndex(
            jogador =>
                jogador.jogador_id ===
                jogadorAtualId
        );


    if (indice < 0) {
        return null;
    }


    const proximoIndice =
        (
            indice + 1
        ) % jogadores.length;


    return jogadores[
        proximoIndice
    ];
}


// ========================================
// FINALIZAR RODADA
// ========================================

async function finalizarRodada() {

    const estado =
        await buscarEstado();


    if (
        !estado ||
        estado.jogadas.length !== 6
    ) {
        return;
    }


    const jogadores =
        await buscarJogadores();


    const vencedor =
        descobrirVencedorRodada(
            estado.jogadas,
            estado.manilha
        );


    const numeroRodada =
        estado.rodadas.length + 1;


    const resultadoRodada = {

        numero:
            numeroRodada,

        vencedor:
            vencedor
                ? vencedor.trio
                : null,

        vencedorJogador:
            vencedor
                ? vencedor.jogador_id
                : null,

        jogadas:
            estado.jogadas

    };


    estado.rodadas.push(
        resultadoRodada
    );


    if (vencedor) {

        if (
            vencedor.trio === 1
        ) {

            estado.vitoriasTrio1++;

        }
        else {

            estado.vitoriasTrio2++;

        }


        estado.mensagem =
            `🔔 Trio ${vencedor.trio} venceu a rodada!`;
    }
    else {

        estado.mensagem =
            "🤝 Rodada empatada!";
    }


    // ====================================
    // VERIFICAR SE ALGUÉM JÁ GANHOU
    // 2 RODADAS
    // ====================================

    if (
        estado.vitoriasTrio1 >= 2
    ) {

        await finalizarMao(
            estado,
            1
        );

        return;
    }


    if (
        estado.vitoriasTrio2 >= 2
    ) {

        await finalizarMao(
            estado,
            2
        );

        return;
    }


    // ====================================
    // TERCEIRA RODADA
    // ====================================

    if (
        estado.rodadas.length >= 3
    ) {

        const vencedorMao =
            descobrirVencedorMao(
                estado.rodadas
            );


        if (vencedorMao) {

            await finalizarMao(
                estado,
                vencedorMao
            );

        }
        else {

            await finalizarMao(
                estado,
                null
            );

        }

        return;
    }


    // ====================================
    // PRÓXIMA RODADA
    // ====================================

    let proximoId = null;


    if (vencedor) {

        proximoId =
            vencedor.jogador_id;

    }
    else {

        // Em caso de empate,
        // quem iniciou a rodada continua.

        proximoId =
            estado.jogadas[0]
                .jogador_id;
    }


    estado.jogadas = [];

    estado.rodada++;


    await salvarEstado(
        estado,
        "jogando"
    );


    await definirTurno(
        proximoId
    );


    renderizarTudo();
}


// ========================================
// DESCOBRIR VENCEDOR DA RODADA
// ========================================

function descobrirVencedorRodada(
    jogadas,
    manilha
) {

    if (
        !jogadas ||
        jogadas.length === 0
    ) {
        return null;
    }


    let maiorForca = -1;

    let melhores = [];


    jogadas.forEach(
        jogada => {

            const forca =
                forcaCarta(
                    jogada.carta,
                    manilha
                );


            if (
                forca >
                maiorForca
            ) {

                maiorForca =
                    forca;

                melhores = [
                    jogada
                ];

            }
            else if (
                forca ===
                maiorForca
            ) {

                melhores.push(
                    jogada
                );

            }

        }
    );


    // Apenas um jogador possui
    // a carta mais forte.

    if (
        melhores.length === 1
    ) {

        return melhores[0];
    }


    // Se as cartas mais fortes
    // forem do mesmo trio,
    // o trio vence.

    const trios =
        [
            ...new Set(
                melhores.map(
                    j => j.trio
                )
            )
        ];


    if (
        trios.length === 1
    ) {

        return melhores[0];
    }


    // Forças iguais de trios diferentes
    // = empate.

    return null;
}


// ========================================
// VENCEDOR DA MÃO
// ========================================

function descobrirVencedorMao(
    rodadas
) {

    /*
     * Regras:
     *
     * empate na 1ª:
     * quem ganhar a 2ª leva.
     *
     * empate na 2ª:
     * quem ganhou a 1ª leva.
     *
     * empate na 3ª:
     * quem ganhou a 1ª leva.
     *
     * empate 1ª + 2ª:
     * quem ganhar a 3ª leva.
     *
     * empate nas 3:
     * ninguém leva.
     */


    const r1 =
        rodadas[0]?.vencedor ||
        null;

    const r2 =
        rodadas[1]?.vencedor ||
        null;

    const r3 =
        rodadas[2]?.vencedor ||
        null;


    // 1ª rodada teve vencedor

    if (r1) {

        // Se a segunda empatou,
        // quem ganhou a primeira leva.

        if (!r2 && !r3) {
            return r1;
        }


        if (
            r2 === r1
        ) {
            return r1;
        }


        if (
            !r2 &&
            r3 === r1
        ) {
            return r1;
        }


        if (
            !r2 &&
            r3
        ) {
            return r3;
        }


        if (
            r2 &&
            r2 !== r1 &&
            !r3
        ) {
            return r1;
        }
    }


    // 1ª empatou.
    // A segunda decide.

    if (
        !r1 &&
        r2
    ) {

        return r2;
    }


    // 1ª e 2ª empataram.
    // A terceira decide.

    if (
        !r1 &&
        !r2 &&
        r3
    ) {

        return r3;
    }


    return null;
}


// ========================================
// FINALIZAR MÃO
// ========================================

async function finalizarMao(
    estado,
    vencedorTrio
) {

    // Impede duas finalizações simultâneas.

    const responsavel =
        await buscarResponsavel();


    if (!responsavel) {
        return;
    }


    const jogadores =
        await buscarJogadores();


    // Tenta assumir o encerramento.

    const { data, error } =
        await supabaseClient
            .from("partidas_truco")
            .update({

                status:
                    "finalizando"

            })
            .eq(
                "jogador_id",
                responsavel.jogador_id
            )
            .eq(
                "status",
                "jogando"
            )
            .select();


    if (error) {

        console.error(error);

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        return;
    }


    // ====================================
    // SOMAR PONTOS
    // ====================================

    if (vencedorTrio === 1) {

        estado.pontosTrio1 +=
            estado.valorMao;

    }


    if (vencedorTrio === 2) {

        estado.pontosTrio2 +=
            estado.valorMao;

    }


    // ====================================
    // VERIFICAR VENCEDOR DA PARTIDA
    // ====================================

    if (
        estado.pontosTrio1 >= 12
    ) {

        estado.fase =
            "finalizada";

        estado.mensagem =
            "🏆 TRIO 1 VENCEU A PARTIDA!";

        await salvarEstado(
            estado,
            "finalizada"
        );

        await limparTurnos();

        renderizarTudo();

        return;
    }


    if (
        estado.pontosTrio2 >= 12
    ) {

        estado.fase =
            "finalizada";

        estado.mensagem =
            "🏆 TRIO 2 VENCEU A PARTIDA!";

        await salvarEstado(
            estado,
            "finalizada"
        );

        await limparTurnos();

        renderizarTudo();

        return;
    }


    // ====================================
    // PREPARAR NOVA MÃO
    // ====================================

    let proximoPrimeiro =
        estado.turnoInicial;


    // Se alguém ganhou a mão,
    // o vencedor começa a próxima.

    if (vencedorTrio) {

        const ultimaRodada =
            estado.rodadas[
                estado.rodadas.length - 1
            ];


        if (
            ultimaRodada &&
            ultimaRodada.vencedorJogador
        ) {

            proximoPrimeiro =
                ultimaRodada.vencedorJogador;

        }
    }


    // Em caso de empate,
    // mantém o jogador inicial.

    if (!proximoPrimeiro) {

        proximoPrimeiro =
            jogadores[0]
                .jogador_id;
    }


    const novaPontuacao = {

        pontosTrio1:
            estado.pontosTrio1,

        pontosTrio2:
            estado.pontosTrio2

    };


    // Limpa cartas antigas.

    for (
        const jogador of jogadores
    ) {

        await supabaseClient
            .from("partidas_truco")
            .update({

                cartas: [],

                turno: false,

                pontos:
                    jogador.trio === 1
                        ? estado.pontosTrio1
                        : estado.pontosTrio2

            })
            .eq(
                "jogador_id",
                jogador.jogador_id
            );

    }


    // Distribui a nova mão.

    await distribuirNovaMao(
        jogadores,
        novaPontuacao,
        proximoPrimeiro
    );
}


// ========================================
// LIMPAR TURNOS
// ========================================

async function limparTurnos() {

    await supabaseClient
        .from("partidas_truco")
        .update({

            turno: false

        })
        .eq(
            "codigo_sala",
            codigo
        );
}


// ========================================
// PEDIR TRUCO
// ========================================

async function pedirTruco() {

    const estado =
        await buscarEstado();


    if (
        !estado ||
        estado.fase !== "jogando"
    ) {
        return;
    }


    if (estado.pedidoTruco) {

        alert(
            "Já existe um pedido aguardando resposta."
        );

        return;
    }


    const jogadores =
        await buscarJogadores();


    const eu =
        jogadores.find(
            j =>
                j.jogador_id ===
                jogadorId
        );


    if (!eu || !eu.turno) {

        alert(
            "Só é possível pedir Truco na sua vez."
        );

        return;
    }


    // Mão de 11 não permite pedido.

    if (
        estado.pontosTrio1 >= 11 ||
        estado.pontosTrio2 >= 11
    ) {

        alert(
            "Nesta mão não é permitido pedir Truco."
        );

        return;
    }


    const indice =
        VALORES_MAO.indexOf(
            estado.valorMao
        );


    const proximoValor =
        VALORES_MAO[
            indice + 1
        ];


    if (!proximoValor) {
        return;
    }


    estado.pedidoTruco = {

        por:
            jogadorId,

        trio:
            eu.trio,

        novoValor:
            proximoValor

    };


    estado.mensagem =
        `${eu.nome_jogador} pediu ${nomePedido(proximoValor)}!`;


    await salvarEstado(
        estado,
        "jogando"
    );


    renderizarTudo();
}


// ========================================
// RESPONDER AO TRUCO
// ========================================

async function responderTruco(
    resposta
) {

    const estado =
        await buscarEstado();


    if (
        !estado ||
        !estado.pedidoTruco
    ) {
        return;
    }


    const jogadores =
        await buscarJogadores();


    const eu =
        jogadores.find(
            j =>
                j.jogador_id ===
                jogadorId
        );


    if (!eu) {
        return;
    }


    const pedido =
        estado.pedidoTruco;


    // Somente o trio adversário responde.

    if (
        eu.trio ===
        pedido.trio
    ) {

        alert(
            "Seu trio fez o pedido."
        );

        return;
    }


    // ====================================
    // CORRER
    // ====================================

    if (
        resposta === "correr"
    ) {

        const valorAnterior =
            VALORES_MAO[
                VALORES_MAO.indexOf(
                    pedido.novoValor
                ) - 1
            ];


        const pontos =
            valorAnterior || 1;


        if (
            pedido.trio === 1
        ) {

            estado.pontosTrio1 +=
                pontos;

        }
        else {

            estado.pontosTrio2 +=
                pontos;

        }


        estado.pedidoTruco =
            null;


        estado.mensagem =
            `Trio ${eu.trio} correu. Trio ${pedido.trio} ganhou ${pontos} ponto(s).`;


        await salvarEstado(
            estado,
            "jogando"
        );


        // Verifica vitória.

        if (
            estado.pontosTrio1 >= 12
        ) {

            estado.fase =
                "finalizada";

            estado.mensagem =
                "🏆 TRIO 1 VENCEU A PARTIDA!";

            await salvarEstado(
                estado,
                "finalizada"
            );

            await limparTurnos();

            renderizarTudo();

            return;
        }


        if (
            estado.pontosTrio2 >= 12
        ) {

            estado.fase =
                "finalizada";

            estado.mensagem =
                "🏆 TRIO 2 VENCEU A PARTIDA!";

            await salvarEstado(
                estado,
                "finalizada"
            );

            await limparTurnos();

            renderizarTudo();

            return;
        }


        await reiniciarDepoisDoTruco(
            estado
        );

        return;
    }


    // ====================================
    // ACEITAR
    // ====================================

    if (
        resposta === "aceitar"
    ) {

        estado.valorMao =
            pedido.novoValor;


        estado.mensagem =
            `${nomePedido(estado.valorMao)} aceito! A mão vale ${estado.valorMao}.`;


        const jogadorQuePediu =
            pedido.por;


        estado.pedidoTruco =
            null;


        await salvarEstado(
            estado,
            "jogando"
        );


        await definirTurno(
            jogadorQuePediu
        );


        renderizarTudo();

        return;
    }


    // ====================================
    // AUMENTAR
    // ====================================

    if (
        resposta === "aumentar"
    ) {

        const indice =
            VALORES_MAO.indexOf(
                pedido.novoValor
            );


        const proximoValor =
            VALORES_MAO[
                indice + 1
            ];


        if (!proximoValor) {

            alert(
                "A mão já está em 12."
            );

            return;
        }


        estado.pedidoTruco = {

            por:
                jogadorId,

            trio:
                eu.trio,

            novoValor:
                proximoValor

        };


        estado.mensagem =
            `${eu.nome_jogador} pediu ${nomePedido(proximoValor)}!`;


        await salvarEstado(
            estado,
            "jogando"
        );


        renderizarTudo();
    }
}


// ========================================
// REINICIAR APÓS CORRER
// ========================================

async function reiniciarDepoisDoTruco(
    estado
) {

    const jogadores =
        await buscarJogadores();


    let primeiro =
        estado.turnoInicial;


    if (!primeiro) {

        primeiro =
            jogadores[0]
                .jogador_id;
    }


    await salvarEstado(
        estado,
        "finalizando"
    );


    // Procura o responsável.

    const responsavel =
        jogadores[0];


    const { data } =
        await supabaseClient
            .from("partidas_truco")
            .update({

                status:
                    "finalizando"

            })
            .eq(
                "jogador_id",
                responsavel.jogador_id
            )
            .eq(
                "status",
                "jogando"
            )
            .select();


    if (
        !data ||
        data.length === 0
    ) {
        return;
    }


    await distribuirNovaMao(
        jogadores,
        {
            pontosTrio1:
                estado.pontosTrio1,

            pontosTrio2:
                estado.pontosTrio2
        },
        primeiro
    );
}


// ========================================
// NOME DO PEDIDO
// ========================================

function nomePedido(
    valor
) {

    if (valor === 3) {
        return "🔥 TRUCO";
    }

    if (valor === 6) {
        return "🔥 SEIS";
    }

    if (valor === 9) {
        return "🔥 NOVE";
    }

    if (valor === 12) {
        return "🔥 DOZE";
    }

    return valor;
}


// ========================================
// RENDERIZAR VIRA
// ========================================

function mostrarVira(
    estado
) {

    const elemento =
        document.getElementById(
            "vira"
        );


    if (!elemento) {
        return;
    }


    if (!estado.vira) {

        elemento.innerHTML =
            "";

        return;
    }


    elemento.innerHTML = `

        <div class="vira-titulo">
            VIRA
        </div>

        <div class="carta-vira">
            ${nomeCarta(estado.vira)}
        </div>

        <div class="manilha-info">
            Manilha: <strong>
                ${estado.manilha}
            </strong>
        </div>

    `;
}


// ========================================
// RENDERIZAR CARTAS DA MESA
// ========================================

function mostrarCartasMesa(
    estado
) {

    const area =
        document.getElementById(
            "cartasMesa"
        );


    if (!area) {
        return;
    }


    area.innerHTML = "";


    if (
        !estado.jogadas ||
        estado.jogadas.length === 0
    ) {

        area.innerHTML =
            "<span>🃏</span>";

        return;
    }


    estado.jogadas.forEach(
        jogada => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "carta-na-mesa";


            div.innerHTML = `

                <strong>
                    ${nomeCarta(jogada.carta)}
                </strong>

                <small>
                    ${jogada.nome}
                </small>

            `;


            area.appendChild(
                div
            );

        }
    );
}


// ========================================
// RENDERIZAR PLACAR
// ========================================

function mostrarPlacar(
    estado
) {

    const pontos1 =
        document.getElementById(
            "pontosTrio1"
        );


    const pontos2 =
        document.getElementById(
            "pontosTrio2"
        );


    if (pontos1) {

        pontos1.textContent =
            estado.pontosTrio1 || 0;

    }


    if (pontos2) {

        pontos2.textContent =
            estado.pontosTrio2 || 0;

    }
}


// ========================================
// MOSTRAR VEZ
// ========================================

async function mostrarVez(
    estado
) {

    const elemento =
        document.getElementById(
            "vez"
        );


    if (!elemento) {
        return;
    }


    const jogadores =
        await buscarJogadores();


    const jogadorDaVez =
        jogadores.find(
            jogador =>
                jogador.turno === true
        );


    if (!jogadorDaVez) {

        elemento.textContent =
            estado.mensagem ||
            "Aguardando...";

        return;
    }


    if (
        jogadorDaVez.jogador_id ===
        jogadorId
    ) {

        elemento.textContent =
            "🔥 É a sua vez!";

    }
    else {

        elemento.textContent =
            `Vez de ${jogadorDaVez.nome_jogador}`;

    }
}


// ========================================
// BOTÕES DE TRUCO
// ========================================

async function mostrarAcoesTruco(
    estado
) {

    const area =
        document.getElementById(
            "acoesTruco"
        );


    if (!area) {
        return;
    }


    area.innerHTML = "";


    if (
        estado.fase ===
        "finalizada"
    ) {
        return;
    }


    const jogadores =
        await buscarJogadores();


    const eu =
        jogadores.find(
            j =>
                j.jogador_id ===
                jogadorId
        );


    if (!eu) {
        return;
    }


    // Existe pedido esperando resposta.

    if (
        estado.pedidoTruco
    ) {

        if (
            estado.pedidoTruco.trio ===
            eu.trio
        ) {

            const esperando =
                document.createElement(
                    "p"
                );


            esperando.textContent =
                "⏳ Aguardando resposta do adversário...";


            area.appendChild(
                esperando
            );


            return;
        }


        const titulo =
            document.createElement(
                "p"
            );


        titulo.textContent =
            `${nomePedido(
                estado.pedidoTruco.novoValor
            )}!`;


        area.appendChild(
            titulo
        );


        const aceitar =
            document.createElement(
                "button"
            );


        aceitar.textContent =
            `✅ Aceitar ${estado.pedidoTruco.novoValor}`;


        aceitar.className =
            "botao-acao";


        aceitar.onclick =
            () =>
                responderTruco(
                    "aceitar"
                );


        area.appendChild(
            aceitar
        );


        const correr =
            document.createElement(
                "button"
            );


        correr.textContent =
            "🏃 Correr";


        correr.className =
            "botao-acao"


        correr.onclick =
            () =>
                responderTruco(
                    "correr"
                );


        area.appendChild(
            correr
        );


        const valor =
            estado.pedidoTruco.novoValor;


        if (
            valor < 12
        ) {

            const aumentar =
                document.createElement(
                    "button"
                );


            const proximo =
                VALORES_MAO[
                    VALORES_MAO.indexOf(
                        valor
                    ) + 1
                ];


            aumentar.textContent =
                `${nomePedido(proximo)}`;


            aumentar.className =
                "botao-acao"


            aumentar.onclick =
                () =>
                    responderTruco(
                        "aumentar"
                    );


            area.appendChild(
                aumentar
            );
        }


        return;
    }


    // Só mostra o botão de pedir
    // se for sua vez.

    if (
        eu.turno &&
        eu.cartas &&
        eu.cartas.length > 0
    ) {

        if (
            estado.pontosTrio1 < 11 &&
            estado.pontosTrio2 < 11 &&
            estado.valorMao < 12
        ) {

            const botao =
                document.createElement(
                    "button"
                );


            botao.id =
                "botaoTruco";


            botao.textContent =
                nomePedido(
                    VALORES_MAO[
                        VALORES_MAO.indexOf(
                            estado.valorMao
                        ) + 1
                    ]
                );


            botao.onclick =
                pedirTruco;


            area.appendChild(
                botao
            );
        }
    }
}


// ========================================
// MENSAGEM
// ========================================

function mostrarMensagem(
    texto
) {

    const elemento =
        document.getElementById(
            "vez"
        );


    if (elemento) {

        elemento.textContent =
            texto;

    }
}


// ========================================
// RENDERIZAR TUDO
// ========================================

async function renderizarTudo() {

    const estado =
        await buscarEstado();


    if (!estado) {
        return;
    }


    mostrarVira(
        estado
    );


    mostrarCartasMesa(
        estado
    );


    mostrarPlacar(
        estado
    );


    await organizarMesa();

    await carregarMinhaMao();

    await mostrarVez(
        estado
    );

    await mostrarAcoesTruco(
        estado
    );


    const mensagem =
        document.getElementById(
            "statusMao"
        );


    if (mensagem) {

        mensagem.textContent =
            estado.mensagem || "";

    }


    // ====================================
    // PARTIDA FINALIZADA
    // ====================================

    if (
        estado.fase ===
        "finalizada"
    ) {

        const vez =
            document.getElementById(
                "vez"
            );


        if (vez) {

            vez.textContent =
                estado.mensagem;

        }


        const area =
            document.getElementById(
                "acoesTruco"
            );


        if (area) {

            area.innerHTML = `
                <div class="mensagem-final">
                    ${estado.mensagem}
                </div>
            `;

        }

    }
}


// ========================================
// INICIALIZAÇÃO
// ========================================

async function iniciar() {

    const jogadores =
        await buscarJogadores();


    if (
        jogadores.length !== 6
    ) {

        mostrarMensagem(
            "Aguardando os 6 jogadores..."
        );

        return;
    }


    const estado =
        await buscarEstado();


    if (
        !estado ||
        estado.fase ===
        "preparando"
    ) {

        await iniciarPartida();

        return;
    }


    renderizarTudo();
}


iniciar();


// ========================================
// TEMPO REAL
// ========================================

supabaseClient
    .channel(
        "jogo-" + codigo
    )
    .on(
        "postgres_changes",
        {
            event: "*",

            schema: "public",

            table: "partidas_truco",

            filter:
                `codigo_sala=eq.${codigo}`

        },

        async () => {

            await renderizarTudo();

        }
    )
    .subscribe();