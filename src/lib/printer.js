// src/lib/printer.js

export const printReceipt = (orderOrTable, type = "KITCHEN") => {
  // type: "KITCHEN" (Mutfak Fişi - Fiyat gizli) | "CUSTOMER" (Müşteri Adisyonu - Fiyatlı)
  
  const tableNumber = orderOrTable.tableNumber || "?";
  const items = orderOrTable.items || [];
  const totalAmount = orderOrTable.totalAmount || 0;
  const note = orderOrTable.note || "";
  const date = new Date().toLocaleString("tr-TR");

  // Arka planda görünmez bir iFrame oluşturuyoruz (Ekranda görünmeden yazdırmak için)
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "-9999px";
  iframe.style.bottom = "-9999px";
  document.body.appendChild(iframe);

  // 80mm Termal Kağıt için özel HTML/CSS Tasarımı
  const content = `
    <html>
      <head>
        <style>
          @page { margin: 0; } /* Tarayıcı tarihini ve linkini gizler */
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: 72mm; /* 80mm kağıt genişliği */
            margin: 0 auto; 
            padding: 15px 5px;
            color: #000;
            font-size: 14px;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .border-bottom { border-bottom: 1px dashed #000; margin: 10px 0; padding-bottom: 5px; }
          .flex-between { display: flex; justify-content: space-between; }
          .text-xl { font-size: 24px; }
          .text-lg { font-size: 18px; }
          table { width: 100%; text-align: left; border-collapse: collapse; margin-top: 10px; }
          th, td { padding: 5px 0; font-size: 15px; vertical-align: top; }
          .qty { width: 25px; font-weight: bold; font-size: 16px; }
          .price { text-align: right; font-weight: bold; }
          .note { border: 2px solid #000; padding: 8px; margin-top: 15px; font-weight: bold; text-transform: uppercase; }
          .footer-space { height: 40px; } /* Kesici için boşluk */
        </style>
      </head>
      <body>
        <div class="center bold text-lg">KARDEŞLER LOKALİ</div>
        <div class="center border-bottom">${type === "KITCHEN" ? "MUTFAK SİPARİŞİ" : "MÜŞTERİ ADİSYONU"}</div>
        
        <div class="flex-between">
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
                <div class="bold">${item.name}</div>
                ${item.variationLabel ? `<div style="font-size: 12px; margin-left: 2px;">- ${item.variationLabel}</div>` : ''}
              </td>
              ${type === "CUSTOMER" ? `<td class="price">${item.totalPrice} TL</td>` : ''}
            </tr>
          `).join('')}
        </table>
        
        ${type === "CUSTOMER" ? `
          <div class="border-bottom"></div>
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
          ${type === "CUSTOMER" ? "Afiyet olsun! Bizi tercih ettiğiniz için tesekkürler." : "Lütfen siparisi hemen hazirlayiniz."}
        </div>
        <div class="footer-space"></div>
      </body>
    </html>
  `;

  // iFrame'in içine fiş tasarımını yazdır
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(content);
  doc.close();

  // Yüklenmesini bekleyip saniyesinde yazdırma (kiosk) komutunu tetikle
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    // Yazdırma işlemi bitince görünmez iFrame'i sil (belleği şişirmemek için)
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  }, 500);
};