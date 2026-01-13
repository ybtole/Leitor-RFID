const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const readline = require('readline');

app.use(express.static(__dirname));

// Configuração do Terminal (para simular sem RFID)
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

// --- FUNÇÃO DE PROCESSAMENTO DE DADOS (SUA LÓGICA) ---
function processarEntrada(entrada) {
    const partes = entrada.trim().split('|');
    let idBruto = partes[0].toUpperCase();
    if (!idBruto) return;

    let idFinal, nome, sala, bloco;

    // Lógica específica para os seus cartões
    if (idBruto === "A6AE75F8") { 
        idFinal = "ID_PROF_MARCOS";
        nome = "PROFESSOR MARCOS";
        sala = "Laboratório de Redes";
        bloco = "BLOCO D";
    } 
    else if (idBruto === "CBEA540C") { 
        idFinal = "ID_PROF_MARCOS";
        nome = "PROFESSOR MARCOS";
        sala = "Sala de Reuniões";
        bloco = "BLOCO A";
    } 
    else if (partes.length === 4) {
        [idFinal, nome, sala, bloco] = partes.map(p => p.trim().toUpperCase());
    } else {
        idFinal = idBruto;
        nome = `USUÁRIO ${idBruto.substring(0, 4)}`;
        sala = "Entrada Geral";
        bloco = "GERAL";
    }

    const infoFinal = {
        id: idFinal,
        nome: nome,
        sala: sala,
        bloco: bloco,
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    console.log(`[EVENTO] ${infoFinal.nome} registrado em ${infoFinal.bloco} às ${infoFinal.hora}`);
    io.emit('atualizar-lista', infoFinal);
}

// --- FUNÇÃO PARA DETECTAR E CONECTAR ARDUINO AUTOMATICAMENTE ---
async function iniciarConexaoSerial() {
    try {
        const ports = await SerialPort.list();
        
        // Filtro para encontrar o Arduino
        const portaArduino = ports.find(p => 
            p.manufacturer?.includes('Arduino') || 
            p.pnpId?.includes('VID_2341') ||
            p.friendlyName?.includes('USB-SERIAL') ||
            p.path.includes('COM') // Tenta portas COM se nada mais for achado
        );

        if (portaArduino) {
            console.log(`✅ Arduino encontrado na porta: ${portaArduino.path}`);
            const port = new SerialPort({
                path: portaArduino.path,
                baudRate: 9600
            });

            const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
            parser.on('data', (data) => processarEntrada(data));
            
            port.on('error', (err) => console.log('Erro na porta Serial:', err.message));
        } else {
            console.log("⚠️ Nenhum Arduino detectado. O sistema aceitará apenas comandos via Terminal.");
        }
    } catch (err) {
        console.error("Erro ao listar portas:", err);
    }
}

// Escuta o Terminal
rl.on('line', (line) => processarEntrada(line));

// Inicia o Servidor e a busca pelo Arduino
http.listen(3000, () => {
    console.log('\n--- SISTEMA ATIVO (Porta 3000) ---');
    console.log('RFID conectado ou Terminal (Formato: ID|NOME|SALA|BLOCO)');
    iniciarConexaoSerial();
});