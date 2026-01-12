const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const readline = require('readline');

app.use(express.static(__dirname));

// Porta Serial (Arduino)
const port = new SerialPort({ path: 'COM3', baudRate: 9600 }, (err) => {
    if (err) console.log("Aviso: Arduino not detected on COM3.");
});
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

function processarEntrada(entrada) {
    const partes = entrada.trim().split('|');
    let idBruto = partes[0].toUpperCase();
    if (!idBruto) return;

    let idFinal, nome, sala, bloco;

    if (idBruto === "A6AE75F8") { // Troque pelo ID do seu cartão // Change with the ID of your card chip
        idFinal = "ID_PROF_MARCOS";
        nome = "PROFESSOR MARCOS";
        sala = "Laboratório de Redes";
        bloco = "BLOCO D";
    } 
    else if (idBruto === "CBEA540C") { //Troque pelo ID do seu cartão // Change with the ID of your card chip 
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
        hora: new Date().toLocaleTimeString('pt-BR')
    };

    console.log(`[EVENTO] ${infoFinal.nome} registrado em ${infoFinal.bloco}`);
    io.emit('atualizar-lista', infoFinal);
}

parser.on('data', (data) => processarEntrada(data));
rl.on('line', (line) => processarEntrada(line));

http.listen(3000, () => {
    console.log('\n--- SISTEMA ATIVO (Porta 3000) ---');
    console.log('RFID / Terminal (ID|NOME|SALA|BLOCO).\n');
});

