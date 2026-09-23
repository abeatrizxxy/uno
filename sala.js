const nome =
    localStorage.getItem("nomeJogador");

const codigo =
    localStorage.getItem("codigoSala");

const jogadorId =
    localStorage.getItem("jogadorId");


document.getElementById("codigo")
    .textContent = codigo;


// ========================================
// CARREGAR JOGADORES
// ========================================

async function carregarJogadoras() {

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

        return;
    }


    const trio1 =
        data.filter(
            jogador =>
                jogador.trio === 1
        );


    const trio2 =
        data.filter(
            jogador =>
                jogador.trio === 2
        );


    // ========================================
    // TRIO 1
    // ========================================

    const elementoTrio1 =
        document.getElementById("trio1");

    elementoTrio1.innerHTML = "";


    trio1.forEach(jogador => {

        const p =
            document.createElement("p");

        p.textContent =
            🔴 ${jogador.nome_jogador};

        elementoTrio1.appendChild(p);

    });


    if (trio1.length === 0) {

        elementoTrio1.innerHTML =
            "<p>Aguardando jogadoras...</p>";
    }


    // ========================================
    // TRIO 2
    // ========================================

    const elementoTrio2 =
        document.getElementById("trio2");

    elementoTrio2.innerHTML = "";


    trio2.forEach(jogador => {

        const p =
            document.createElement("p");

        p.textContent =
            🔵 ${jogador.nome_jogador};

        elementoTrio2.appendChild(p);

    });


    if (trio2.length === 0) {

        elementoTrio2.innerHTML =
            "<p>Aguardando jogadoras...</p>";
    }


    // ========================================
    // QUANTIDADE
    // ========================================

    document.getElementById(
        "quantidade"
    ).textContent =
        ${data.length}/6 jogadoras;


    // ========================================
    // MEU TRIO
    // ========================================

    const eu =
        data.find(
            jogador =>
                jogador.jogador_id ===
                jogadorId
        );


    const meuTrio =
        document.getElementById(
            "meuTrio"
        );


    if (eu && eu.trio === 1) {

        meuTrio.textContent =
            "Você está no 🔴 Trio 1";

    }
    else if (eu && eu.trio === 2) {

        meuTrio.textContent =
            "Você está no 🔵 Trio 2";

    }
    else {

        meuTrio.textContent =
            "Você ainda não escolheu um trio.";
    }


    // ========================================
    // ESCOLHA DO TRIO
    // ========================================

    const escolhaTrio =
        document.getElementById(
            "escolhaTrio"
        );


    if (eu && eu.trio !== 0) {

        escolhaTrio.style.display =
            "none";

    }
    else {

        escolhaTrio.style.display =
            "block";
    }


    // ========================================
    // BOTÃO COMEÇAR
    // ========================================

    const botao =
        document.getElementById(
            "botaoComecar"
        );


    if (
        trio1.length === 3 &&
        trio2.length === 3
    ) {

        botao.disabled = false;

        botao.textContent =
            "🎮 Começar partida";

    }
    else {

        botao.disabled = true;

        botao.textContent =
            "Aguardando 3 × 3";
    }
}


// ========================================
// ESCOLHER TRIO
// ========================================

async function escolherTrio(
    trioEscolhido
) {

    const { data, error } =
        await supabaseClient
            .from("partidas_truco")
            .select("trio")
            .eq(
                "codigo_sala",
                codigo
            );


    if (error) {

        console.error(error);

        alert(
            "Erro ao verificar os trios."
        );

        return;
    }


    const quantidade =
        data.filter(
            jogador =>
                jogador.trio ===
                trioEscolhido
        ).length;


    if (quantidade >= 3) {

        alert(
            "Esse trio já está cheio!"
        );

        return;
    }


    const { error: erroAtualizacao } =
        await supabaseClient
            .from("partidas_truco")
            .update({
                trio: trioEscolhido
            })
            .eq(
                "jogador_id",
                jogadorId
            );


    if (erroAtualizacao) {

        console.error(
            erroAtualizacao
        );

        alert(
            "Não foi possível entrar no trio."
        );

        return;
    }


    carregarJogadoras();
}


// ========================================
// COPIAR CÓDIGO
// ========================================

function copiarCodigo() {

    navigator.clipboard.writeText(
        codigo
    );

    alert(
        "Código da sala copiado! 🃏"
    );
}


// ========================================
// COMEÇAR JOGO
// ========================================

async function comecarJogo() {

    const { data, error } =
        await supabaseClient
            .from("partidas_truco")
            .select("*")
            .eq(
                "codigo_sala",
                codigo
            );


    if (error) {

        console.error(error);

        return;
    }


    const trio1 =
        data.filter(
            jogador =>
                jogador.trio === 1
        );


    const trio2 =
        data.filter(
            jogador =>
                jogador.trio === 2
        );


    if (
        trio1.length !== 3 ||
        trio2.length !== 3
    ) {

        alert(
            "A partida precisa ter 3 jogadoras em cada trio!"
        );

        return;
    }


    window.location.href =
        "jogo.html";
}


// ========================================
// TEMPO REAL
// ========================================

supabaseClient
    .channel(
        "sala-" + codigo
    )
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "partidas_truco",
            filter:
                codigo_sala=eq.${codigo}
        },
        () => {

            carregarJogadoras();

        }
    )
    .subscribe();


// ========================================
// INICIAR
// ========================================

carregarJogadoras();
