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
        document.getElementById("nome")
            .value
            .trim();


    if (!nome) {

        alert("Digite seu nome!");

        return;
    }


    // Gera o código
    const codigo =
        gerarCodigo();


    // Gera ID do jogador
    const jogadorId =
        crypto.randomUUID();


    console.log(
        "Código gerado:",
        codigo
    );


    // ====================================
    // SALVAR NO SUPABASE
    // ====================================

    const { error } =
        await supabaseClient
            .from("partidas_truco")
            .insert({

                codigo_sala:
                    codigo,

                jogador_id:
                    jogadorId,

                nome_jogador:
                    nome,

                trio:
                    0,

                cartas:
                    [],

                pontos:
                    0,

                turno:
                    false,

                status:
                    "aguardando"

            });


    if (error) {

        console.error(
            "Erro ao criar sala:",
            error
        );

        alert(
            "Erro ao criar a sala.\n\n" +
            error.message
        );

        return;
    }


    // ====================================
    // SALVAR NO NAVEGADOR
    // ====================================

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


    console.log(
        "Sala criada:",
        codigo
    );


    // ====================================
    // IR PARA A SALA
    // ENVIA O CÓDIGO PELA URL
    // ====================================

    window.location.href =
        "sala.html?codigo=" +
        encodeURIComponent(codigo);
}


// ========================================
// ENTRAR EM UMA SALA
// ========================================

async function entrarSala() {

    const nome =
        document.getElementById("nome")
            .value
            .trim();


    const codigo =
        document.getElementById("codigoSala")
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


    // ====================================
    // PROCURAR SALA
    // ====================================

    const { data, error } =
        await supabaseClient
            .from("partidas_truco")
            .select("*")
            .eq(
                "codigo_sala",
                codigo
            );


    if (error) {

        console.error(
            "Erro ao procurar sala:",
            error
        );

        alert(
            "Erro ao procurar a sala.\n\n" +
            error.message
        );

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        alert(
            "Sala não encontrada!"
        );

        return;
    }


    // ====================================
    // VERIFICAR LIMITE
    // ====================================

    if (data.length >= 6) {

        alert(
            "Essa sala já está cheia!"
        );

        return;
    }


    // ====================================
    // CRIAR JOGADOR
    // ====================================

    const jogadorId =
        crypto.randomUUID();


    const { error: erroEntrada } =
        await supabaseClient
            .from("partidas_truco")
            .insert({

                codigo_sala:
                    codigo,

                jogador_id:
                    jogadorId,

                nome_jogador:
                    nome,

                trio:
                    0,

                cartas:
                    [],

                pontos:
                    0,

                turno:
                    false,

                status:
                    "aguardando"

            });


    if (erroEntrada) {

        console.error(
            "Erro ao entrar:",
            erroEntrada
        );

        alert(
            "Não foi possível entrar na sala.\n\n" +
            erroEntrada.message
        );

        return;
    }


    // ====================================
    // SALVAR DADOS
    // ====================================

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


    // ====================================
    // IR PARA A SALA
    // ====================================

    window.location.href =
        "sala.html?codigo=" +
        encodeURIComponent(codigo);
}