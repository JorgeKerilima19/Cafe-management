// lib/printer.ts
import { promises as fs } from "fs";
import { readFileSync } from "fs";

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

  push(Buffer.from([0x1b, 0x61, 0x01])); // Center
  push(Buffer.from([0x1d, 0x21, 0x11])); // Double height + width (size 2)
  push(Buffer.from([0x1b, 0x45, 0x01])); // Bold ON
  push(encodeText("Cafetería La Goutte\n"));
  push(Buffer.from([0x1b, 0x45, 0x00])); // Bold OFF
  push(Buffer.from([0x1d, 0x21, 0x00])); // Back to normal size

  // Date
  push(encodeText(new Date().toLocaleString("es-PE") + "\n\n"));

  // --- ORDER DETAILS ---
  push(Buffer.from([0x1b, 0x61, 0x00])); // Left align
  push(encodeText("--------------------------------\n"));
  push(encodeText(`Cliente: ${customerName}\n\n`));

  // Items
  for (const item of items) {
    const itemNameLine = `${item.name} x${item.quantity}`;
    const priceLine = `S/ ${(item.price * item.quantity).toFixed(2)}`;

    if (itemNameLine.length <= 24) {
      const spaces = " ".repeat(32 - itemNameLine.length - priceLine.length);
      push(encodeText(`${itemNameLine}${spaces}${priceLine}\n`));
    } else {
      push(encodeText(`${itemNameLine}\n`));
      const spaces = " ".repeat(32 - priceLine.length);
      push(encodeText(`${spaces}${priceLine}\n`));
    }
  }

  push(encodeText("\n"));
  push(encodeText("--------------------------------\n"));

  // Total (bold)
  push(Buffer.from([0x1b, 0x45, 0x01])); // Bold ON
  push(encodeText(`TOTAL: S/ ${total.toFixed(2)}\n`));
  push(Buffer.from([0x1b, 0x45, 0x00])); // Bold OFF

  push(encodeText("\n"));

  // Payment method
  if (paymentMethod === "CASH") {
    push(encodeText("Pago: EFECTIVO\n"));
  } else if (paymentMethod === "YAPE") {
    push(encodeText("Pago: YAPE\n"));
  } else {
    push(encodeText(`Efectivo: S/ ${cashAmount.toFixed(2)}\n`));
    push(encodeText(`Yape: S/ ${yapeAmount.toFixed(2)}\n`));
  }

  // --- CENTERED THANK YOU ---
  push(Buffer.from([0x1b, 0x61, 0x01])); // Center
  push(encodeText("\n¡Gracias por su compra!\n"));

  // Extra bottom margin
  push(Buffer.from([0x1b, 0x61, 0x00])); // Left
  push(Buffer.from([0x1b, 0x64, 0x06])); // Feed 6 lines

  // Cut
  push(Buffer.from([0x1d, 0x56, 0x00]));

  return buffer;
}

/**
 * Encodes Spanish characters (CP850/CP437 hybrid).
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
    ü: 0x81,
    Ü: 0x9a,
  };

  let result = "";
  for (const ch of text) {
    result += map[ch] ? String.fromCharCode(map[ch]) : ch;
  }
  return Buffer.from(result, "binary");
}

/**
 * Prints directly to shared printer.
 */
export async function printReceiptToPOS(content: Buffer): Promise<void> {
  console.log(
    "🖨️ [printReceiptToPOS] Writing raw bytes directly to \\\\localhost\\POS80...",
  );
  try {
    await fs.writeFile("\\\\localhost\\POS80", content);
    console.log("✅ Printed successfully!");
  } catch (err: any) {
    console.error("❌ Print failed:", err.message);
    throw new Error(`Print failed: ${err.message}`);
  }
}
