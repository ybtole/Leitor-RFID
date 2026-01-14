const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const readline = require('readline');

// Configuração de blocos para o sorteio
const blocosDisponiveis = ["BLOCO 1", "BLOCO 2", "BLOCO A", "BLOCO D"];

app.use(express.static(__dirname));

// Configuração do Terminal (para simular sem RFID)
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

// --- FUNÇÃO DE PROCESSAMENTO DE DADOS (LÓGICA CENTRAL) ---
function processarEntrada(entrada) {
    const partes = entrada.trim().split('|');
    let idBruto = partes[0].toUpperCase();
    if (!idBruto) return;

    let idFinal, nome, sala, bloco;
    const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 1. Lógica para Cartões Cadastrados (Fixos)
    if (idBruto === "A6AE75F8") { 
        idFinal = idBruto;
        nome = "PROFESSOR MARCOS";
        sala = "Laboratório de Redes";
        bloco = "BLOCO D";
    } 
    else if (idBruto === "CBEA540C") { 
        idFinal = idBruto;
        nome = "PROFESSOR MARCOS";
        sala = "Sala de Reuniões";
        bloco = "BLOCO A";
    } 
    // 2. Se a entrada vier completa via Terminal (ID|NOME|SALA|BLOCO)
    else if (partes.length === 4) {
        [idFinal, nome, sala, bloco] = partes.map(p => p.trim().toUpperCase());
    } 
    // 3. SORTEIO: Se for um ID novo ou aleatório do Arduino
    else {
        idFinal = idBruto;
        nome = `USUÁRIO ${idBruto.substring(0, 4)}`;
        sala = "SALA " + Math.floor(Math.random() * 500); // Gera sala aleatória
        
        // Sorteia um dos blocos da lista
        bloco = blocosDisponiveis[Math.floor(Math.random() * blocosDisponiveis.length)];
    }

    const infoFinal = {
        id: idFinal,
        nome: nome,
        sala: sala,
        bloco: bloco,
        hora: agora
    };

    console.log(`[EVENTO] ${infoFinal.nome} enviado para ${infoFinal.bloco} às ${infoFinal.hora}`);
    io.emit('atualizar-lista', infoFinal);
}

// --- FUNÇÃO PARA DETECTAR E CONECTAR ARDUINO AUTOMATICAMENTE ---
async function iniciarConexaoSerial() {
    try {
        const ports = await SerialPort.list();
        
        // Filtro aprimorado: ignora COM1 e procura por Arduinos reais ou USB-SERIAL
        const portaArduino = ports.find(p => 
            (p.manufacturer?.includes('Arduino') || 
             p.pnpId?.includes('VID_2341') ||
             p.friendlyName?.includes('USB-SERIAL') ||
             (p.path.includes('COM') && p.path !== 'COM1')) // Ignora especificamente a COM1
        );

        if (portaArduino) {
            console.log(`✅ Arduino REAL encontrado na porta: ${portaArduino.path}`);
            const port = new SerialPort({
                path: portaArduino.path,
                baudRate: 9600
            });

            const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
            parser.on('data', (data) => processarEntrada(data));
            
            port.on('error', (err) => console.log('Erro na porta Serial:', err.message));
        } else {
            console.log("⚠️ Nenhum Arduino detectado (COM1 ignorada). Use o Terminal para simular.");
        }
    } catch (err) {
        console.error("Erro ao listar portas:", err);
    }
}

// Escuta o Terminal para simulações manuais
rl.on('line', (line) => processarEntrada(line));

// Inicia o Servidor e a busca pelo Arduino
http.listen(3000, () => {
    console.log('\n--- SISTEMA ATIVO (Porta 3000) ---');
    console.log('Envie um ID via terminal seguindo o formato: ID|NOME|SALA|BLOCO .');
    iniciarConexaoSerial();
});