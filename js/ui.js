// Mấy hàm nhỏ để dựng DOM và định dạng. Không phải framework — chỉ là những
// thứ gõ lại ở hai chục chỗ thì nên có tên.

import { ICON } from '../vendor/icon/icon.js';
import { layAnh } from './nguon.js';

/**
 * Dựng một phần tử.
 *
 *   h('div', { class: 'the' }, 'Chữ', h('b', null, 'đậm'))
 *
 * Thuộc tính đặc biệt: `class`, `style` (chuỗi hoặc object), `html` (đặt
 * innerHTML — chỉ dùng cho nội dung đã tự sinh ra, không bao giờ cho chữ từ
 * máy chủ), và bất cứ khoá nào bắt đầu bằng `on` thì gắn làm trình xử lý.
 */
export function h(tag, props, ...children) {
  const el = document.createElement(tag);

  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;

    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }

  them(el, children);
  return el;
}

function them(el, children) {
  for (const con of children) {
    if (con === null || con === undefined || con === false) continue;
    if (Array.isArray(con)) them(el, con);
    // textContent chứ không innerHTML: tên bài giảng và đề bài đến từ máy chủ,
    // và chúng có dấu ngoặc nhọn thật.
    else el.append(con instanceof Node ? con : document.createTextNode(String(con)));
  }
}

/**
 * Một biểu tượng Material.
 *
 * Cùng cách Flutter làm: một ký tự trong font icon, không phải ảnh hay SVG.
 * Font là đúng file Flutter dùng, cắt xuống còn 37 glyph — 3 KB thay vì 1,6 MB
 * — nên biểu tượng ở đây giống hệt bản cũ chứ không phải trông giống.
 */
/**
 * Hình của một câu hỏi — một danh sách, vì có câu kèm hai hình.
 *
 * Nhiều câu hình học, thí nghiệm và biểu đồ có đề bài NẰM TRONG hình, nên thiếu
 * nó thì câu không trả lời được. Vì vậy khi tải lỗi thì nói ra, thay vì để lại
 * một ô trống trông như câu hỏi vốn chỉ có mấy dòng chữ.
 */
export function veAnh(ds) {
  if (!ds || !ds.length) return null;

  const khung = h('div', { class: 'khung-anh' }, dangTai('Đang tải hình…'));

  Promise.all(ds.map(layAnh))
    .then((duong) => {
      xoaHet(khung);
      khung.append(
        ...duong.map((d) => h('img', { class: 'anh-cau', src: d, alt: 'Hình của câu hỏi' })),
      );
    })
    .catch((loi) => {
      console.error(loi);
      xoaHet(khung);
      khung.append(h('p', { class: 'mo' }, 'Không tải được hình của câu này.'));
    });

  return khung;
}

export function bt(ten, them = '') {
  const el = document.createElement('span');
  el.className = 'mi' + (them ? ' ' + them : '');
  el.setAttribute('aria-hidden', 'true');
  el.textContent = ICON[ten] || '';
  return el;
}

export function xoaHet(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/* --------------------------------------------------------------- định dạng */

/** 7 chứ không phải 7.0; 7,5 chứ không phải 7.5. */
export function soDiem(n) {
  if (n === null || n === undefined) return '—';
  const lam = Math.round(n * 10) / 10;
  return (Number.isInteger(lam) ? String(lam) : lam.toFixed(1)).replace('.', ',');
}

export function hai(n) {
  return String(n).padStart(2, '0');
}

/** 125 -> "2:05". Dùng cho đồng hồ đếm ngược. */
export function dongHo(giay) {
  const g = Math.max(0, Math.floor(giay));
  const phut = Math.floor(g / 60);
  if (phut >= 60) return `${Math.floor(phut / 60)}:${hai(phut % 60)}:${hai(g % 60)}`;
  return `${phut}:${hai(g % 60)}`;
}

/** 125 -> "2 phút 05s". Dùng cho kết quả đã xong, đọc chứ không nhìn liếc. */
export function khoangThoiGian(giay) {
  if (giay === null || giay === undefined) return '';
  const phut = Math.floor(giay / 60);
  const con = giay % 60;
  return phut > 0 ? `${phut} phút ${hai(con)}s` : `${con}s`;
}

export function ngayGio(iso) {
  const t = new Date(iso);
  return `${hai(t.getDate())}/${hai(t.getMonth() + 1)}/${t.getFullYear()} ${hai(t.getHours())}:${hai(t.getMinutes())}`;
}

/* ------------------------------------------------------------ khối dùng lại */

export function dangTai(loi = 'Đang tải…') {
  return h('div', { class: 'giua' }, h('div', { class: 'quay' }), h('p', { class: 'mo' }, loi));
}

export function baoLoi(loi, thuLai) {
  return h(
    'div',
    { class: 'giua' },
    bt('error_outline', 'to-48'),
    h('p', { class: 'loi' }, loi.message || String(loi)),
    thuLai && h('button', { class: 'vien', onclick: thuLai }, bt('refresh', 'vua'), 'Thử lại'),
  );
}

export function trong(loi) {
  return h('div', { class: 'giua mo' }, h('p', null, loi));
}

/** Thanh thông báo trượt lên từ đáy rồi tự đi. */
export function nhan(loi) {
  const cu = document.querySelector('.nhan');
  if (cu) cu.remove();
  const el = h('div', { class: 'nhan' }, loi);
  document.body.append(el);
  setTimeout(() => el.classList.add('hien'));
  setTimeout(() => {
    el.classList.remove('hien');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}
