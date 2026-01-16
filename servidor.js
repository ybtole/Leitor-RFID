/* * Copyright (c) 2026 [ybtole]. Todos os direitos reservados.
 * * É estritamente proibida a reprodução, distribuição ou revenda deste código,
 * total ou parcial, sem a autorização prévia e por escrito do autor.
 * Este software é fornecido para fins [Ex: Acadêmicos/Pessoais].
*/

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { SerialPort } = require('serialport'); // Comunicação com a porta serial (USB)
const { ReadlineParser } = require('@serialport/parser-readline'); // Traduz os dados do Arduino para texto
const readline = require('readline'); // Permite testar via terminal sem Arduino

// --- CONFIGURAÇÕES DO ESTADO ---
const blocosDisponiveis = ["1", "2", "A", "B", "C", "D"];
let listaProfessores = []; // Estado atual (Onde cada professor está agora)
let logMovimentacoes = []; // Histórico (Logs de idas e vindas)

app.use(express.static(__dirname)); // Serve os arquivos HTML/CSS/JS

// Interface de leitura do terminal para testes manuais
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

// --- LÓGICA CENTRAL DE PROCESSAMENTO ---
// Esta função recebe a string (UID ou Dados) e decide o que fazer
function processarEntrada(entrada) {
    const partes = entrada.trim().split('|');
    let idBruto = partes[0].toUpperCase();
    if (!idBruto || idBruto.includes("ARDUINO OK")) return; // Ignora mensagens de inicialização
    
    let idFinal, nome, sala, bloco;
    const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 1. Identificação do Professor (Lógica especial para o Professor Marcos)
    if (idBruto === "A6AE75F8" || idBruto === "CBEA540C") { 
        idFinal = "PROF_MARCOS_UNICO";
        nome = "PROFESSOR MARCOS";
        if (idBruto === "A6AE75F8") { sala = "Laboratório de Redes"; bloco = "D"; } 
        else { sala = "Sala de Reuniões"; bloco = "A"; }
    } else if (partes.length === 4) {
        // Se a entrada vier completa: ID|NOME|SALA|BLOCO
        [idFinal, nome, sala, bloco] = partes.map(p => p.trim().toUpperCase().replace("BLOCO", "").trim());
    } else {
        // Se for um ID desconhecido, gera dados aleatórios para demonstração
        idFinal = idBruto;
        nome = `USUÁRIO ${idBruto.substring(0, 4)}`; 
        sala = "SALA " + Math.floor(Math.random() * 500);
        bloco = blocosDisponiveis[Math.floor(Math.random() * blocosDisponiveis.length)];
    }

    const novoRegistro = { id: idFinal, nome, sala, bloco, hora: agora };

    // 2. Lógica de Movimentação (Detecta se o professor mudou de bloco)
    const indexExistente = listaProfessores.findIndex(p => p.id === idFinal);
    let blocoAnterior = "-----";

    if (indexExistente !== -1) {
        blocoAnterior = listaProfessores[indexExistente].bloco;
        // Só registra no log se o bloco novo for diferente do anterior
        if (blocoAnterior !== bloco) {
            listaProfessores[indexExistente] = novoRegistro; // Atualiza a posição atual
            logMovimentacoes.push({ ...novoRegistro, de: blocoAnterior }); // Adiciona ao histórico
        }
    } else {
        // Primeira vez que o cartão é lido na sessão
        listaProfessores.push(novoRegistro);
        logMovimentacoes.push({ ...novoRegistro, de: "------" });
    }

    // 3. Emite os dados atualizados para todos os navegadores conectados
    io.emit('atualizar-lista', { 
        professores: listaProfessores, 
        historico: logMovimentacoes 
    });
}

// --- COMUNICAÇÃO SERIAL (ARDUINO) ---
async function iniciarConexaoSerial() {
    try {
        const ports = await SerialPort.list();
        // Tenta encontrar o Arduino automaticamente entre as portas COM/USB
        const portaArduino = ports.find(p => 
            (p.manufacturer?.includes('Arduino') || 
             p.pnpId?.includes('VID_2341') ||
             p.friendlyName?.includes('USB-SERIAL') ||
             (p.path.includes('COM') && p.path !== 'COM1'))
        );

        if (portaArduino) {
            console.log(`✅ Conexão Serial em: ${portaArduino.path}`);
            const port = new SerialPort({ path: portaArduino.path, baudRate: 9600 });
            const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
            // Sempre que o Arduino mandar algo via Serial.println, executa processarEntrada
            parser.on('data', (data) => processarEntrada(data));
        } else {
            console.log("⚠️ Aguardando conexão do Arduino...");
        }
    } catch (err) {
        console.error("❌ Erro Serial:", err);
    }
}

// --- GESTÃO DE CONEXÕES SOCKET ---
io.on('connection', (socket) => {
    // Quando um novo computador abrir o site, ele recebe os dados atuais imediatamente
    socket.emit('atualizar-lista', { professores: listaProfessores, historico: logMovimentacoes });
    
    // Escuta o comando de limpeza enviado pelo Admin
    socket.on('limpar-dados-servidor', () => {
        listaProfessores = [];
        logMovimentacoes = [];
        io.emit('atualizar-lista', { professores: [], historico: [] });
    });

    // --- NOVA FUNÇÃO ADICIONADA AQUI ---
    // Escuta a string enviada pela caixa de texto do site
    socket.on('comando-web', (comando) => {
        console.log(`[Entrada Web]: ${comando}`);
        processarEntrada(comando); // Chama a mesma função que o terminal e o Arduino usam
    });
});

// Permite simular entradas digitando no console (Ex: 123|JOAO|SALA1|A)
rl.on('line', (line) => processarEntrada(line));

// Inicia o servidor na porta 3000
http.listen(3000, () => {
    console.log('\n--------------------------------------------');
    console.log('🚀 SERVIDOR ONLINE: http://localhost:3000');
    console.log('Teste o Terminal: ID|NOME|SALA|BLOCO');
    console.log('--------------------------------------------');
    iniciarConexaoSerial();
});