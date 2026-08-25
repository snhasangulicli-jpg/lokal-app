// src/lib/printer.js

export const printReceipt = (orderOrTable, type = "KITCHEN") => {
  const tableNumber = orderOrTable.tableNumber || "?";
  const items = orderOrTable.items || [];
  const totalAmount = orderOrTable.totalAmount || 0;
  const note = orderOrTable.note || "";
  const date = new Date().toLocaleString("tr-TR");

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "-9999px";
  iframe.style.bottom = "-9999px";
  document.body.appendChild(iframe);

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { margin: 0; }
          html, body { margin: 0; padding: 0; width: 100%; background: #fff; }
          body { 
            font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; /* Termal yazıcıya uygun net font */
            width: 76mm; /* 80mm için güvenli alan */
            padding: 10px 5px 10px 5px; 
            color: #000;
            font-size: 15px;
            box-sizing: border-box;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .border-bottom { border-bottom: 2px dashed #000; margin: 8px 0; padding-bottom: 8px; }
          .flex-between { display: flex; justify-content: space-between; }
          .text-xl { font-size: 26px; }
          .text-lg { font-size: 20px; }
          table { width: 100%; text-align: left; border-collapse: collapse; margin-top: 15px; }
          th, td { padding: 5px 0; vertical-align: top; }
          .qty { width: 30px; font-weight: bold; font-size: 18px; }
          .item-name { font-weight: bold; font-size: 16px; }
          .variation { font-size: 13px; font-weight: normal; margin-top: 2px; }
          .price { text-align: right; font-weight: bold; font-size: 16px; }
          .note { border: 2px solid #000; padding: 8px; margin-top: 20px; font-weight: bold; font-size: 16px; text-transform: uppercase; }
          .footer-space { height: 40px; }
        </style>
      </head>
      <body>
        <div class="center bold text-lg">KTSABD LOKALI</div>
        <div class="center border-bottom">${type === "KITCHEN" ? "MUTFAK SIPARISI" : "MUSTERI ADISYONU"}</div>
        
        <div class="flex-between" style="font-size: 12px; margin-top: 5px;">
          <span>Tarih:</span>
          <span>${date}</span>
        </div>
        
        <div class="center border-bottom text-xl bold" style="margin-top: 10px; padding-bottom: 10px;">
          MASA ${tableNumber}
        </div>

        <table>
          ${items.map(item => `
            <tr>
              <td class="qty">${item.quantity}x</td>
              <td>
                <div class="item-name">${item.name}</div>
                ${item.variationLabel ? `<div class="variation">- ${item.variationLabel}</div>` : ''}
              </td>
              ${type === "CUSTOMER" ? `<td class="price">${item.totalPrice} TL</td>` : ''}
            </tr>
          `).join('')}
        </table>
        
        ${type === "CUSTOMER" ? `
          <div class="border-bottom" style="margin-top: 15px;"></div>
          <div class="flex-between bold text-xl" style="margin-top: 15px;">
            <span>TOPLAM:</span>
            <span>${totalAmount} TL</span>
          </div>
        ` : ''}

        ${note && type === "KITCHEN" ? `
          <div class="note">
            NOT: ${note}
          </div>
        ` : ''}

        <div class="center" style="margin-top: 30px; font-size: 12px;">
          ${type === "CUSTOMER" ? "Afiyet olsun!<br>Bizi tercih ettiginiz icin tesekkurler." : "Lutfen siparisi hemen hazirlayiniz."}
        </div>
        <div class="footer-space"></div>
      </body>
    </html>
  `;

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(content);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  }, 500);
};