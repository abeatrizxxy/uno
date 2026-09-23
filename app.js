// ========================================
// GERAR CÓDIGO DA SALA
// ========================================

function gerarCodigo() {

    const caracteres =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let codigo = "";

    for (let i = 0; i < 6; i++) {

        codigo += caracteres.charAt(
            Math.floor(
                Math.random() * caracteres.length
            )
        );
    }

    return codigo;
}


// ========================================
// CRIAR SALA
// ========================================

async function criarSala() {

    const nome =
        document
            .getElementById("nome")
            .value
            .trim();

    if (!nome) {

        alert("Digite seu nome!");

        return;
    }

    const codigo = gerarCodigo();

    const jogadorId = crypto.randomUUID();


    const { error } =
        await supabaseClient
            .from("partidas_truco")
            .insert({

                codigo_sala: codigo,

                jogador_id: jogadorId,

                nome_jogador: nome,

                trio: 0,

                cartas: [],

                pontos: 0,

                turno: false,

                status: "aguardando"
            });


    if (error) {

        console.error(error);

        alert(
            "Não foi possível criar a sala."
        );

        return;
    }


    localStorage.setItem(
        "jogadorId",
        jogadorId
    );

    localStorage.setItem(
        "nomeJogador",
        nome
    );

    localStorage.setItem(
        "codigoSala",
        codigo
    );


    window.location.href =
        "sala.html";
}


// ========================================
// ENTRAR NA SALA
// ========================================

async function entrarSala() {

    const nome =
        document
            .getElementById("nome")
            .value
            .trim();

    const codigo =
        document
            .getElementById("codigoSala")
            .value
            .trim()
            .toUpperCase();


    if (!nome) {

        alert("Digite seu nome!");

        return;
    }


    if (!codigo) {

        alert(
            "Digite o código da sala!"
        );

        return;
    }


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

        alert(
            "Erro ao procurar a sala."
        );

        return;
    }


    if (data.length === 0) {

        alert(
            "Sala não encontrada!"
        );

        return;
    }


    if (data.length >= 6) {

        alert(
            "Essa sala já está cheia!"
        );

        return;
    }


    const jogadorId =
        crypto.randomUUID();


    const { error: erroEntrada } =
        await supabaseClient
            .from("partidas_truco")
            .insert({

                codigo_sala: codigo,

                jogador_id: jogadorId,

                nome_jogador: nome,

                trio: 0,

                cartas: [],

                pontos: 0,

                turno: false,

                status: "aguardando"
            });


    if (erroEntrada) {

        console.error(erroEntrada);

        alert(
            "Não foi possível entrar na sala."
        );

        return;
    }


    localStorage.setItem(
        "jogadorId",
        jogadorId
    );

    localStorage.setItem(
        "nomeJogador",
        nome
    );

    localStorage.setItem(
        "codigoSala",
        codigo
    );


    window.location.href =
        "sala.html";
}
