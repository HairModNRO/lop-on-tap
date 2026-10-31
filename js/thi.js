// Sinh đề, chấm bài và giữ lịch sử — tất cả trong trình duyệt.
//
// Trước đây máy chủ làm phần này, và nó làm được một việc mà ở đây không làm
// được: giữ đáp án cho riêng mình. Giờ đáp án nằm trong file tải về, nên học
// viên chịu khó mở DevTools là thấy. Với một bộ đề để tự luyện thì đó là cái
// giá chấp nhận được; với một kỳ thi tính điểm thì không, và đừng dùng nó như
// thế.
//
// Đồng hồ cũng vậy: nó chạy bằng đồng hồ máy, và máy thì vặn được.

import { layDeThi, layNganHang } from './nguon.js';

const K_LICH_SU = 'hsa.lich-su';
const K_DANG_LAM = 'hsa.dang-lam';
const K_DA_GAP = 'hsa.da-gap';

/** Giữ bao nhiêu bài trong lịch sử. Mỗi bài 50 câu nặng chừng 50 KB, mà
 *  localStorage thường chỉ có 5 MB — để không giới hạn là một ngày nào đó
 *  không lưu được bài mới, và chỗ hỏng lại là lúc nộp. */
const TOI_DA_LICH_SU = 40;

/* ---------------------------------------------------------------- lưu */

function doc(k, macDinh) {
  try {
    const s = localStorage.getItem(k);
    return s ? JSON.parse(s) : macDinh;
  } catch (e) {
    return macDinh;
  }
}

function ghi(k, v) {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    /* hết chỗ hoặc bị chặn — bài vẫn làm được, chỉ là không nhớ */
  }
}

/* ------------------------------------------------------------- ngẫu nhiên */

/** Fisher-Yates với nguồn ngẫu nhiên thật. Math.random cũng đủ cho việc này,
 *  nhưng crypto đã có sẵn và không đắt hơn ở cỡ vài chục phần tử. */
function tron(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

/* --------------------------------------------------------------- sinh đề */

/** Một đề cố định: giữ nguyên thứ tự câu và thứ tự phương án như đề gốc. */
export async function batDauDe(deId) {
  const ds = await layDeThi();
  const de = ds.find((d) => d.id === Number(deId));
  if (!de) throw new Error('Không có đề này.');

  return luuDangLam({
    ma: 'de-' + de.id,
    ten: de.ten,
    mon: null,
    phut: de.phut,
    phan: de.phan.map((p) => ({ ten: p.ten, cau: p.cau })),
  });
}

/**
 * Một đề thi thử theo môn: rút câu chưa gặp, trộn câu, trộn phương án.
 *
 * Phương án được **đặt lại nhãn** A/B/C/D sau khi trộn. Trong bộ đề gốc đáp án
 * nằm ở B nhiều hơn mức ngẫu nhiên; giữ nguyên nhãn là dạy học viên đoán.
 */
export async function batDauThiThu(monMa) {
  const nh = await layNganHang();
  const mon = nh.mon.find((m) => m.ma === monMa);
  if (!mon) throw new Error('Không có môn này.');

  const tatCa = nh.cau[monMa] || [];
  if (tatCa.length < mon.soCau) {
    throw new Error(`Ngân hàng môn ${mon.ten} mới có ${tatCa.length} câu, chưa đủ một đề ${mon.soCau} câu.`);
  }

  const daGap = new Set((doc(K_DA_GAP, {})[monMa] || []));
  let chon = tatCa.filter((c) => !daGap.has(c.id));
  let dungLai = false;

  if (chon.length < mon.soCau) {
    // Hết câu mới thì nói ra chứ không lặng lẽ phát lại, và cũng không cắt đề
    // ngắn đi — một đề ít câu hơn làm điểm lần này không so được với lần trước.
    chon = tatCa;
    dungLai = true;
  }

  const rut = tron(chon).slice(0, mon.soCau);

  const gap = doc(K_DA_GAP, {});
  gap[monMa] = [...new Set([...(gap[monMa] || []), ...rut.map((c) => c.id)])];
  ghi(K_DA_GAP, gap);

  return luuDangLam({
    ma: 'thi-thu-' + monMa + '-' + Date.now(),
    ten: 'Thi thử · ' + mon.ten,
    mon: monMa,
    phut: mon.phut,
    dungLai,
    phan: [{ ten: mon.ten, cau: rut.map(tronPhuongAn) }],
  });
}

function tronPhuongAn(c) {
  if (!c.dapAn.length) return c;
  const NHAN = ['A', 'B', 'C', 'D', 'E', 'F'];
  return {
    ...c,
    dapAn: tron(c.dapAn).map((d, i) => ({ ...d, nhan: NHAN[i] ?? d.nhan })),
  };
}

/** Còn bao nhiêu đề không trùng cho mỗi môn. */
export async function tinhMon() {
  const nh = await layNganHang();
  const gap = doc(K_DA_GAP, {});
  return nh.mon.map((m) => {
    const tong = (nh.cau[m.ma] || []).length;
    const daGap = new Set(gap[m.ma] || []).size;
    return {
      ...m,
      tong,
      chuaGap: Math.max(0, tong - daGap),
      conDe: Math.floor(Math.max(0, tong - daGap) / m.soCau),
      sanSang: tong >= m.soCau,
    };
  });
}

/* ------------------------------------------------------------- đang làm */

function luuDangLam(bai) {
  const d = { ...bai, batDauLuc: Date.now(), traLoi: {} };
  ghi(K_DANG_LAM, d);
  return d;
}

export const layDangLam = () => doc(K_DANG_LAM, null);

export function ghiTraLoi(cauId, giaTri) {
  const d = doc(K_DANG_LAM, null);
  if (!d) return;
  d.traLoi[cauId] = giaTri;
  ghi(K_DANG_LAM, d);
}

export function boDangLam() {
  ghi(K_DANG_LAM, null);
}

/** Số giây còn lại, tính từ lúc bắt đầu. Đồng hồ máy vặn được, nhưng ở đây
 *  không có đồng hồ nào khác. */
export function conLai(bai) {
  return Math.max(0, Math.round(bai.phut * 60 - (Date.now() - bai.batDauLuc) / 1000));
}

/* ----------------------------------------------------------------- chấm */

/** So đáp án điền: bỏ khoảng trắng hai đầu, không phân biệt hoa thường, và
 *  coi dấu phẩy thập phân như dấu chấm — học viên gõ "0,5" còn đáp án ghi
 *  "0.5" thì đó là cùng một số. */
function bangNhau(a, b) {
  const chuan = (s) =>
    String(s ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(',', '.');
  return chuan(a) === chuan(b) && chuan(a) !== '';
}

export function cham(bai) {
  const cau = bai.phan.flatMap((p) => p.cau);
  const ra = [];
  let dung = 0;
  let daLam = 0;

  for (const c of cau) {
    const da = bai.traLoi[c.id];
    const coLam = da !== undefined && da !== null && String(da) !== '';
    if (coLam) daLam++;

    let ok = false;
    if (c.dapAn.length) ok = coLam && c.dapAn.some((d) => d.nhan === da && d.dung);
    else ok = coLam && bangNhau(da, c.chuDung);
    if (ok) dung++;

    ra.push({ ...c, daChon: coLam ? da : null, dung: ok });
  }

  const banGhi = {
    ma: bai.ma,
    ten: bai.ten,
    mon: bai.mon ?? null,
    nopLuc: Date.now(),
    giay: Math.round((Date.now() - bai.batDauLuc) / 1000),
    soCau: cau.length,
    dung,
    daLam,
    diem: cau.length ? (dung / cau.length) * 10 : 0,
    phan: bai.phan.map((p) => ({
      ten: p.ten,
      dung: p.cau.filter((c) => ra.find((r) => r.id === c.id)?.dung).length,
      soCau: p.cau.length,
    })),
    cau: ra,
  };

  const ls = doc(K_LICH_SU, []);
  ls.unshift(banGhi);
  ghi(K_LICH_SU, ls.slice(0, TOI_DA_LICH_SU));
  boDangLam();

  return banGhi;
}

/* ------------------------------------------------------------- lịch sử */

export const layLichSu = () => doc(K_LICH_SU, []);
export const timBaiDaLam = (ma) => doc(K_LICH_SU, []).find((b) => b.ma === ma) ?? null;

export function xoaLichSu() {
  ghi(K_LICH_SU, null);
  ghi(K_DA_GAP, null);
  ghi(K_DANG_LAM, null);
}
