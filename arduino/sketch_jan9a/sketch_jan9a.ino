#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 53 // SDA
#define RST_PIN 5 // RST

MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("Arduino OK");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uidString = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    uidString += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    uidString += String(rfid.uid.uidByte[i], HEX);
  }
  uidString.toUpperCase();

  Serial.println(uidString); // ID -> Node.js

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1000);
}
