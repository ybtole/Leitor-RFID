const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const readline = require('readline');

app.use(express.static(__dirname));

// Configuração da Porta Serial (Arduino)
const port = new SerialPort({ path: 'COM3', baudRate: 9600 }, (err) => {
    if (err) console.log("Aviso: Arduino não detectado na COM3.");
});
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Interface do terminal melhorada para permitir Backspace e Colar
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true // Ativa suporte a comandos de terminal
});

function processarEntrada(entrada) {
    const partes = entrada.trim().split('|');
    let idBruto = partes[0].toUpperCase();
    if (!idBruto) return;

    let idFinal, nome, sala, bloco;

    // --- LÓGICA DE ALTERNÂNCIA (Unifica as Tags RFID) ---
    if (idBruto === "A6AE75F8") {
        idFinal = "ID_PROF_MARCOS"; // ID interno único
        nome = "PROFESSOR MARCOS";
        sala = "Laboratório de Redes";
        bloco = "BLOCO D";
    } 
    else if (idBruto === "CBEA540C") {
        idFinal = "ID_PROF_MARCOS"; // Mesmo ID interno
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
        id: idFinal, // O Front-end só vê este ID
        nome: nome,
        sala: sala,
        bloco: bloco,
        hora: new Date().toLocaleTimeString('pt-BR')
    };

    console.log(`[EVENTO] ${infoFinal.nome} registrado em ${infoFinal.bloco}`);
    io.emit('atualizar-lista', infoFinal);
}

// Vincula tanto o sensor quanto o teclado à mesma função
parser.on('data', (data) => processarEntrada(data));
rl.on('line', (line) => processarEntrada(line));

http.listen(3000, () => {
    console.log('\n--- SISTEMA ATIVO (Porta 3000) ---');
    console.log('RFID ou Terminal (ID|NOME|SALA|BLOCO) prontos.\n');
});