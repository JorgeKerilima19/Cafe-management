// lib/printer.ts
import { promises as fs } from 'fs';

/**
 * Generates a raw ESC/POS receipt as a Buffer with proper CP850 encoding for Spanish characters.
 */
export function generateEscPosReceipt(
  customerName: string,
  items: Array<{ name: string; price: number; quantity: number }>,
  total: number,
  paymentMethod: string,
  cashAmount: number,
  yapeAmount: number,
): Buffer {
  let buffer = Buffer.alloc(0);

  const push = (data: Buffer) => {
    buffer = Buffer.concat([buffer, data]);
  };

  // Initialize printer
  push(Buffer.from([0x1b, 0x40])); // ESC @

  // Center alignment
  push(Buffer.from([0x1b, 0x61, 0x01]));

  push(encodeText("CAFETERÍA\n"));
  push(encodeText("POS-80 SERIES\n"));
  push(encodeText(new Date().toLocaleString("es-PE") + "\n\n"));

  // Left alignment
  push(Buffer.from([0x1b, 0x61, 0x00]));
  push(encodeText("--------------------------------\n"));
  push(encodeText(`Cliente/Mesa: ${customerName}\n\n`));

  for (const item of items) {
    push(encodeText(`${item.name} x${item.quantity}\n`));
    push(encodeText(`  S/ ${(item.price * item.quantity).toFixed(2)}\n`));
  }

  push(encodeText("--------------------------------\n"));
  push(encodeText(`TOTAL: S/ ${total.toFixed(2)}\n\n`));

  if (paymentMethod === "CASH") {
    push(encodeText("Pago: EFECTIVO\n"));
  } else if (paymentMethod === "YAPE") {
    push(encodeText("Pago: YAPE\n"));
  } else {
    push(encodeText(`Efectivo: S/ ${cashAmount.toFixed(2)}\n`));
    push(encodeText(`Yape: S/ ${yapeAmount.toFixed(2)}\n`));
  }

  push(encodeText("\n¡Gracias por su compra!\n\n"));

  // Cut paper
  push(Buffer.from([0x1d, 0x56, 0x00])); // GS V 0

  // Feed lines
  push(Buffer.from([0x1b, 0x64, 0x03]));

  return buffer;
}

/**
 * Encodes Spanish characters to CP850 byte values used by ESC/POS printers.
 */
function encodeText(text: string): Buffer {
  const map: Record<string, number> = {
    á: 0xa0,
    é: 0x82,
    í: 0xa1,
    ó: 0xa2,
    ú: 0xa3,
    ñ: 0xa4,
    Á: 0xb7,
    É: 0x90,
    Í: 0xd6,
    Ó: 0xe0,
    Ú: 0xe9,
    Ñ: 0xa5,
  };

  let result = "";
  for (const ch of text) {
    result += map[ch] ? String.fromCharCode(map[ch]) : ch;
  }

  return Buffer.from(result, "binary");
}

/**
 * Prints the receipt by writing raw bytes directly to the shared printer \\localhost\POS80.
 * This is the most reliable method for ESC/POS on Windows.
 */
export async function printReceiptToPOS(content: Buffer): Promise<void> {
  console.log("🖨️ [printReceiptToPOS] Writing raw bytes directly to \\\\localhost\\POS80...");
  
  try {
    await fs.writeFile('\\\\localhost\\POS80', content);
    console.log("✅ [printReceiptToPOS] Printed successfully!");
  } catch (err: any) {
    console.error("❌ [printReceiptToPOS] Print failed:", err.message);
    throw new Error(`Failed to print receipt: ${err.message}`);
  }
}