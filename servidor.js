const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const readline = require('readline');

// --- CONFIGURAÇÕES ---
const blocosDisponiveis = ["1", "2", "A", "D"];
let listaProfessores = []; 
let logMovimentacoes = []; 

app.use(express.static(__dirname));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

// --- LÓGICA CENTRAL DE PROCESSAMENTO ---
function processarEntrada(entrada) {
    const partes = entrada.trim().split('|');
    let idBruto = partes[0].toUpperCase();
    if (!idBruto || idBruto.includes("ARDUINO OK")) return;
    
    let idFinal, nome, sala, bloco;
    const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 1. Identificação do Professor
    if (idBruto === "A6AE75F8" || idBruto === "CBEA540C") { 
        idFinal = "PROF_MARCOS_UNICO";
        nome = "PROFESSOR MARCOS";
        if (idBruto === "A6AE75F8") { sala = "Laboratório de Redes"; bloco = "D"; } 
        else { sala = "Sala de Reuniões"; bloco = "A"; }
    } else if (partes.length === 4) {
        [idFinal, nome, sala, bloco] = partes.map(p => p.trim().toUpperCase().replace("BLOCO", "").trim());
    } else {
        idFinal = idBruto;
        nome = `USUÁRIO ${idBruto.substring(0, 4)}`; 
        sala = "SALA " + Math.floor(Math.random() * 500);
        bloco = blocosDisponiveis[Math.floor(Math.random() * blocosDisponiveis.length)];
    }

    const novoRegistro = { id: idFinal, nome, sala, bloco, hora: agora };

    // 2. Lógica de Movimentação (Detecta mudança real)
    const indexExistente = listaProfessores.findIndex(p => p.id === idFinal);
    let blocoAnterior = "-----";

    if (indexExistente !== -1) {
        blocoAnterior = listaProfessores[indexExistente].bloco;
        // Só registra se o bloco realmente mudou
        if (blocoAnterior !== bloco) {
            listaProfessores[indexExistente] = novoRegistro;
            logMovimentacoes.push({ ...novoRegistro, de: blocoAnterior });
        }
    } else {
        listaProfessores.push(novoRegistro);
        logMovimentacoes.push({ ...novoRegistro, de: "------" });
    }

    // 3. Envia os dois conjuntos de dados
    io.emit('atualizar-lista', { 
        professores: listaProfessores, 
        historico: logMovimentacoes 
    });
}

// --- COMUNICAÇÃO SERIAL (ARDUINO) ---
async function iniciarConexaoSerial() {
    try {
        const ports = await SerialPort.list();
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
    socket.emit('atualizar-lista', { professores: listaProfessores, historico: logMovimentacoes });
    
    socket.on('limpar-dados-servidor', () => {
        listaProfessores = [];
        logMovimentacoes = [];
        io.emit('atualizar-lista', { professores: [], historico: [] });
    });
});

rl.on('line', (line) => processarEntrada(line));

http.listen(3000, () => {
    console.log('\n--------------------------------------------');
    console.log('🚀 SERVIDOR ONLINE: http://localhost:3000');
    console.log('Teste o Terminal: ID|NOME|SALA|BLOCO');
    console.log('--------------------------------------------');
    iniciarConexaoSerial();
});