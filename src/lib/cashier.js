export function isToday(dateStr) {
  if (!dateStr) return false;
  try {
    return new Date(dateStr).toDateString() === new Date().toDateString();
  } catch {
    return false;
  }
}

export function aggregateTables(orders) {
  const map = {};
  orders.forEach((o) => {
    if (!map[o.tableNumber]) map[o.tableNumber] = [];
    map[o.tableNumber].push(o);
  });
  return Object.entries(map)
    .map(([tableNumber, tblOrders]) => {
      const itemMap = {};
      tblOrders.forEach((order) => {
        (order.items || []).forEach((item) => {
          const key = item.variationLabel ? `${item.name}__${item.variationLabel}` : item.name;
          if (!itemMap[key]) {
            itemMap[key] = {
              name: item.name,
              variationLabel: item.variationLabel || "",
              quantity: 0,
              unitPrice: item.unitPrice || 0,
            };
          }
          itemMap[key].quantity += item.quantity || 0;
        });
      });
      const items = Object.values(itemMap).map((i) => ({
        name: i.name,
        variationLabel: i.variationLabel,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.quantity * i.unitPrice,
      }));
      const totalAmount = tblOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
      return {
        tableNumber,
        items,
        totalAmount,
        orderCount: tblOrders.length,
        orderIds: tblOrders.map((o) => o.id),
      };
    })
    .sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, "tr", { numeric: true }));
}

export function aggregateProducts(orders) {
  const map = {};
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const key = item.variationLabel ? `${item.name} (${item.variationLabel})` : item.name;
      map[key] = (map[key] || 0) + (item.quantity || 0);
    });
  });
  return Object.entries(map)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty);
}

export function groupDebtByTable(debtOrders) {
  const map = {};
  debtOrders.forEach((o) => {
    const key = `${o.tableNumber}__${o.customerName}`;
    if (!map[key]) {
      map[key] = { customerName: o.customerName || "—", tableNumber: o.tableNumber, total: 0 };
    }
    map[key].total += o.totalAmount || 0;
  });
  return Object.values(map);
}