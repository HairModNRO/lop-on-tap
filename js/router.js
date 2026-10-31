// Điều hướng bằng phần sau dấu # của địa chỉ.
//
// Dùng hash chứ không dùng History API, và đó là chủ ý: với hash thì máy chủ
// không bao giờ nhìn thấy đường dẫn trong ứng dụng, nên không cần cấu hình lại
// route nào, không có 404 khi học viên bấm tải lại giữa bài thi, và bản cài
// vào màn hình chính mở lại đúng chỗ. Đổi sang History API là phải sửa cả máy
// chủ lẫn service worker để đổi lấy một địa chỉ đẹp hơn.

const tuyen = [];
let dangVe = null;

/**
 * @param {string} mau ví dụ '/bai/:id' — mỗi đoạn `:ten` thành một tham số
 * @param {(tham: Record<string,string>) => Promise<Node>|Node} ve
 */
export function dat(mau, ve) {
  const ten = [];
  const re = new RegExp(
    '^' +
      mau
        .replace(/\/:([A-Za-z]+)/g, (_, t) => {
          ten.push(t);
          return '/([^/]+)';
        })
        .replace(/\//g, '\\/') +
      '$',
  );
  tuyen.push({ re, ten, ve });
}

export function di(duong, { thay = false } = {}) {
  const dich = '#' + duong;
  if (location.hash === dich) return;
  if (thay) location.replace(dich);
  else location.hash = dich;
}

export function quayLai(macDinh = '/') {
  // history.length > 1 không đáng tin trong tab đã cài vào màn hình chính:
  // nó đếm cả trang trước khi vào ứng dụng. Mốc riêng thì chắc chắn.
  if (window.__hsaDaDieuHuong) history.back();
  else di(macDinh, { thay: true });
}

export function duongHienTai() {
  return location.hash.slice(1) || '/';
}

/** Nơi mọi màn hình được gắn vào. */
let khung = null;

export function batDau(el, khiKhongThay) {
  khung = el;
  addEventListener('hashchange', () => {
    window.__hsaDaDieuHuong = true;
    chay(khiKhongThay);
  });
  chay(khiKhongThay);
}

let lan = 0;

async function chay(khiKhongThay) {
  const duong = duongHienTai();
  const toi = ++lan;

  for (const t of tuyen) {
    const khop = t.re.exec(duong);
    if (!khop) continue;

    const tham = {};
    t.ten.forEach((ten, i) => (tham[ten] = decodeURIComponent(khop[i + 1])));

    // Màn hình cũ được báo trước khi bị gỡ, để nó dừng đồng hồ và huỷ hẹn giờ.
    if (dangVe && dangVe.dong) dangVe.dong();
    dangVe = null;

    let noiDung;
    try {
      noiDung = await t.ve(tham);
    } catch (loi) {
      console.error(loi);
      noiDung = document.createTextNode(loi.message || 'Có lỗi xảy ra.');
    }

    // Đổi địa chỉ lần nữa trong lúc màn hình đang dựng thì bản dựng dở này
    // không được phép ghi đè bản mới.
    if (toi !== lan) return;

    dangVe = noiDung && noiDung.__manHinh ? noiDung.__manHinh : null;
    khung.replaceChildren(noiDung);
    // Mỗi màn hình bắt đầu từ đầu trang, như khi bấm sang một trang khác.
    scrollTo(0, 0);
    return;
  }

  khiKhongThay(duong);
}
