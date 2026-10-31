// Nguồn dữ liệu: file tĩnh đã mã hoá, không có máy chủ.
//
// Máy chủ hết hạn, và GitHub Pages chỉ phục vụ file. Nên danh mục, đề thi,
// ngân hàng câu hỏi và cả tài liệu PDF đều nằm sẵn trong bản dựng, mã hoá
// bằng một mật khẩu chung cả lớp.
//
// Nói thẳng mức bảo vệ: đây KHÔNG phải bảo mật. Học viên biết mật khẩu thì
// chia sẻ được cho bất kỳ ai, và ai có mật khẩu thì có toàn bộ nội dung — kể
// cả đáp án. Việc nó làm được là chặn Google đánh chỉ mục và chặn người lạ mở
// trúng một trang Pages công khai. Đó là khoảng cách giữa "phân phối cho học
// viên" và "đăng lên Internet", và đó là khoảng cách đáng giữ.

const KHOA_LUU = 'hsa.khoa-lop';

let khoa = null; // CryptoKey
let cauHinh = null;
const dem = new Map();

/* ------------------------------------------------------------- cấu hình */

async function layCauHinh() {
  if (cauHinh) return cauHinh;
  const res = await fetch('du-lieu/cau-hinh.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Không đọc được cấu hình lớp.');
  cauHinh = await res.json();
  return cauHinh;
}

/* ---------------------------------------------------------------- khoá */

function docLuu(k) {
  try {
    return localStorage.getItem(k);
  } catch (e) {
    return null;
  }
}

function ghiLuu(k, v) {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch (e) {
    /* chế độ riêng tư khoá chặt localStorage — phiên này vẫn dùng được */
  }
}

const sangByte = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const sangB64 = (u8) => btoa(String.fromCharCode(...u8));

async function nhapKhoa(raw) {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt']);
}

/** Đã mở lớp trong phiên này, hoặc còn khoá nhớ từ lần trước. */
export function daMoLop() {
  return khoa !== null || docLuu(KHOA_LUU) !== null;
}

/** Nhận lại khoá đã nhớ. Gọi lúc khởi động, trước khi hỏi mật khẩu. */
export async function khoiPhuc() {
  if (khoa) return true;
  const luu = docLuu(KHOA_LUU);
  if (!luu) return false;
  try {
    khoa = await nhapKhoa(sangByte(luu));
    await thuKhoa();
    return true;
  } catch (e) {
    // Khoá hỏng hoặc bản dựng đã đổi muối. Quên đi và hỏi lại.
    khoa = null;
    ghiLuu(KHOA_LUU, null);
    return false;
  }
}

/**
 * Mở lớp bằng mật khẩu.
 *
 * PBKDF2 210 000 vòng — khuyến nghị của OWASP cho SHA-256. Mật khẩu cả lớp sẽ
 * ngắn và dễ đoán, nên chi phí dẫn khoá là thứ duy nhất làm việc dò đắt lên.
 * Trên điện thoại nó mất chưa tới một giây, và chỉ trả một lần.
 */
export async function moLop(matKhau) {
  const c = await layCauHinh();

  const goc = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(matKhau),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: sangByte(c.muoi), iterations: c.vong, hash: 'SHA-256' },
    goc,
    256,
  );

  khoa = await nhapKhoa(bits);
  try {
    await thuKhoa();
  } catch (e) {
    khoa = null;
    throw new Error('Mật khẩu không đúng.');
  }

  // Nhớ khoá đã dẫn, không nhớ mật khẩu: đỡ phải gõ lại mỗi lần mở, và cũng
  // đỡ phải giữ mật khẩu ở đâu đó để dẫn lại.
  ghiLuu(KHOA_LUU, sangB64(new Uint8Array(bits)));
  return true;
}

export function dongLop() {
  khoa = null;
  dem.clear();
  ghiLuu(KHOA_LUU, null);
}

/** Mẫu thử nhỏ, để kiểm mật khẩu mà không phải tải cả danh mục 400 KB. */
async function thuKhoa() {
  const r = await giaiMaFile('du-lieu/kiem.bin');
  const j = JSON.parse(new TextDecoder().decode(r));
  if (!j.ok) throw new Error('mẫu thử sai');
}

/* -------------------------------------------------------------- giải mã */

/**
 * Bố cục file: [12 byte IV][16 byte thẻ xác thực][bản mã].
 *
 * Node đưa thẻ ra riêng còn WebCrypto lại muốn nó nối vào cuối bản mã, nên
 * phải ghép lại ở đây. Sai chỗ này thì mọi file đều "mật khẩu không đúng".
 */
export async function giaiMaFile(duong) {
  if (!khoa) throw new Error('Chưa mở lớp.');

  const res = await fetch(duong);
  if (!res.ok) throw new Error(`Không tải được ${duong} (${res.status}).`);
  const buf = new Uint8Array(await res.arrayBuffer());

  const iv = buf.subarray(0, 12);
  const the = buf.subarray(12, 28);
  const than = buf.subarray(28);

  const banMa = new Uint8Array(than.length + the.length);
  banMa.set(than, 0);
  banMa.set(the, than.length);

  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, khoa, banMa);
}

async function layJson(duong) {
  if (dem.has(duong)) return dem.get(duong);
  const cho = giaiMaFile(duong).then((b) => JSON.parse(new TextDecoder().decode(b)));
  dem.set(duong, cho);
  return cho;
}

/* --------------------------------------------------------------- dữ liệu */

export const layDanhMuc = () => layJson('du-lieu/danh-muc.bin');
export const layDeThi = () => layJson('du-lieu/de-thi.bin');
export const layNganHang = () => layJson('du-lieu/ngan-hang.bin');

/** Tìm một bài theo mã, trong danh mục đã tải. */
export async function timBai(id) {
  const dm = await layDanhMuc();
  const so = Number(id);
  for (const p of dm.phan) {
    for (const n of p.nhom) {
      for (const b of n.bai) if (b.id === so) return { bai: b, phan: p };
    }
  }
  return null;
}

/**
 * Tài liệu PDF: tải từ Releases rồi giải mã trong trình duyệt.
 *
 * 1,8 GB không vừa giới hạn 1 GB mỗi site của Pages, nên tài liệu nằm ở vài
 * site Pages riêng của cùng tài khoản. Cùng gốc `<chủ>.github.io` nên không
 * vướng CORS — đó là chỗ GitHub Releases hỏng: nó không gửi
 * Access-Control-Allow-Origin, và trình duyệt không đọc được byte để giải mã.
 *
 * Tên file dẫn từ HMAC nên danh sách tên công khai không nối được với bài nào.
 */
export async function layTaiLieu(ma) {
  const c = await layCauHinh();
  const kho = c.taiLieuGoc || [];
  if (!kho.length) throw new Error('Bản dựng này chưa gắn kho tài liệu.');

  // Kho nào giữ file nào dẫn từ chính tên file, nên không cần bảng tra.
  const i = parseInt(ma[0], 16) % kho.length;
  const b = await giaiMaFile(`${kho[i].replace(/\/+$/, '')}/${ma}.bin`);
  return new Blob([b], { type: 'application/pdf' });
}

export function demBai(phan) {
  return phan.nhom.reduce((t, n) => t + n.bai.length, 0);
}

export function demVideo(phan) {
  return phan.nhom.reduce((t, n) => t + n.bai.filter((b) => b.youtubeId).length, 0);
}
