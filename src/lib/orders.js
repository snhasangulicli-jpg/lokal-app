import { supabase } from './supabase';
import { detectMenuType } from '@/lib/menu';

// Veritabanı verisini uygulama formatına (camelCase) dönüştürür
function mapFromDb(o) {
  if (!o) return null;
  return {
    id: o.id,
    tableNumber: o.table_number,
    menuType: o.menu_type,
    currentStage: o.current_stage,
    stageTimestamps: o.stage_timestamps || {},
    items: o.items || [],
    totalAmount: o.total_amount,
    status: o.status,
    waiterName: o.waiter_name,
    customerName: o.customer_name,
    paymentStatus: o.payment_status,
    completedAt: o.completed_at,
    paidAt: o.paid_at,
    created_date: o.created_at,
    created_at: o.created_at
  };
}

// Tüm siparişleri canlı veritabanından getirir
export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Siparişler çekilemedi:', error);
    return [];
  }
  return data.map(mapFromDb);
}

// Yeni sipariş oluşturur
export async function createOrder({ tableNumber, items, waiterName, customerName = '' }) {
  const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || item.unitPrice * item.quantity), 0);
  const menuType = detectMenuType(items);
  const now = new Date().toISOString();

  const newOrder = {
    id: `order-${Date.now()}`,
    table_number: String(tableNumber),
    menu_type: menuType,
    current_stage: 0,
    stage_timestamps: { 0: now },
    items,
    total_amount: totalAmount,
    status: 'pending',
    waiter_name: waiterName || 'Garson',
    customer_name: customerName,
    payment_status: null,
    completed_at: null,
    paid_at: null
  };

  const { data, error } = await supabase.from('orders').insert([newOrder]).select();
  if (error) {
    console.error('Sipariş eklenemedi:', error);
    return null;
  }
  return mapFromDb(data[0]);
}

// Mutfak aşamasını günceller (0-8)
export async function updateOrderStage(orderId, stageNumber) {
  const now = new Date().toISOString();

  const { data: currentOrder } = await supabase
    .from('orders')
    .select('stage_timestamps')
    .eq('id', orderId)
    .single();

  const updatedTimestamps = { ...(currentOrder?.stage_timestamps || {}), [stageNumber]: now };

  const updates = {
    current_stage: stageNumber,
    stage_timestamps: updatedTimestamps,
    status: stageNumber === 8 ? 'completed' : 'pending'
  };

  if (stageNumber === 8) {
    updates.completed_at = now;
  }

  await supabase.from('orders').update(updates).eq('id', orderId);
  return getOrders();
}

// Ödeme ve Kasa durumu güncelleme (Nakit/Kredi Kartı veya Veresiye/Borç)
export async function updateOrderPayment(orderId, { paymentStatus, customerName }) {
  const now = new Date().toISOString();

  const updates = {
    payment_status: paymentStatus,
    paid_at: now
  };

  if (customerName) {
    updates.customer_name = customerName;
  }

  await supabase.from('orders').update(updates).eq('id', orderId);
  return getOrders();
}

// Mutfak ve Garson Ekranları için Anlık (Realtime) Dinleyici
export function subscribeToOrders(onUpdate) {
  return supabase
    .channel('orders-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
      onUpdate();
    })
    .subscribe();
}