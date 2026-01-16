const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const readline = require('readline');

// --- CONFIGURAÇÕES ---
const blocosDisponiveis = ["1", "2", "A", "D"]; // Removido "BLOCO" para normalizar
let historico = []; // Armazena os registros da sessão atual

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
    
    // Ignora entradas vazias ou mensagens de boot do Arduino
    if (!idBruto || idBruto.includes("ARDUINO OK")) return;
    
    let idFinal, nome, sala, bloco;
    const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // 1. Lógica de Unificação (Professor Marcos)
    if (idBruto === "A6AE75F8" || idBruto === "CBEA540C") { 
        idFinal = "PROF_MARCOS_UNICO";
        nome = "PROFESSOR MARCOS";
        if (idBruto === "A6AE75F8") {
            sala = "Laboratório de Redes";
            bloco = "D";
        } else {
            sala = "Sala de Reuniões";
            bloco = "A";
        }
    } 
    // 2. Entrada Completa via Terminal (ID|NOME|SALA|BLOCO)
    else if (partes.length === 4) {
        [idFinal, nome, sala, bloco] = partes.map(p => p.trim().toUpperCase().replace("BLOCO", "").trim());
    } 
    // 3. Entrada por Sensor ou ID avulso
    else {
        idFinal = idBruto;
        nome = `USUÁRIO ${idBruto.substring(0, 4)}`; 
        sala = Math.floor(Math.random() * 500);
        bloco = blocosDisponiveis[Math.floor(Math.random() * blocosDisponiveis.length)];
    }

    const registro = { id: idFinal, nome, sala, bloco, hora: agora };

    // Evita duplicados idênticos seguidos no histórico (opcional)
    historico.push(registro);
    
    console.log(`[LOG] ${nome} registrado no BLOCO ${bloco}`);

    // EMISSÃO VIA SOCKET: Envia o histórico atualizado para todos
    io.emit('atualizar-lista', historico);
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
            console.log("⚠️ Aguardando conexão do Arduino... (Use o terminal para testar)");
        }
    } catch (err) {
        console.error("❌ Erro Serial:", err);
    }
}

// --- GESTÃO DE CONEXÕES SOCKET ---
io.on('connection', (socket) => {
    console.log('📱 Novo dispositivo conectado ao painel');
    // Assim que o site abre, ele recebe o histórico que já existe no servidor
    socket.emit('atualizar-lista', historico);
});

rl.on('line', (line) => processarEntrada(line));

http.listen(3000, () => {
    console.log('\n--------------------------------------------');
    console.log('🚀 SERVIDOR ONLINE: http://localhost:3000');
    console.log('--------------------------------------------');
    iniciarConexaoSerial();
});