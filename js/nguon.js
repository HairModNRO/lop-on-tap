// Nguồn dữ liệu: file tĩnh đã mã hoá, không có máy chủ.
//
// Máy chủ hết hạn, và GitHub Pages chỉ phục vụ file. Nên danh mục, đề thi,
// ngân hàng câu hỏi và cả tài liệu PDF đều nằm sẵn trong bản dựng, mã hoá
// AES-GCM.
//
// Khoá đi kèm bản dựng, trong `du-lieu/cau-hinh.json`. Không ai phải gõ mật
// khẩu, và cũng không có cổng nào: ai mở được trang thì giải mã được tất cả,
// kể cả đáp án. Việc mã hoá còn làm được là giữ nội dung ngoài tầm máy —
// Google và các bộ thu thập chỉ thấy khối nhị phân. Chỉ chừng đó.

let cauHinh = null;
let khoaCho = null; // Promise<CryptoKey>, dẫn một lần rồi dùng lại
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

const sangByte = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/** Khoá lớp, nhập một lần. Mọi lời gọi sau dùng lại chính Promise đó, nên
 *  nhiều màn hình mở cùng lúc không nhập lại khoá mấy lần. */
function layKhoa() {
  if (!khoaCho) {
    khoaCho = (async () => {
      const c = await layCauHinh();
      if (!c.khoa) throw new Error('Bản dựng thiếu khoá lớp — dựng lại bằng build-static.mjs.');
      return crypto.subtle.importKey('raw', sangByte(c.khoa), { name: 'AES-GCM' }, false, [
        'decrypt',
      ]);
    })();
  }
  return khoaCho;
}

/* -------------------------------------------------------------- giải mã */

/**
 * Bố cục file: [12 byte IV][16 byte thẻ xác thực][bản mã].
 *
 * Node đưa thẻ ra riêng còn WebCrypto lại muốn nó nối vào cuối bản mã, nên
 * phải ghép lại ở đây. Sai chỗ này thì mọi file đều "mật khẩu không đúng".
 */
export async function giaiMaFile(duong) {
  const khoa = await layKhoa();

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
 * Tài liệu PDF: tải từ kho Pages rồi giải mã trong trình duyệt.
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
