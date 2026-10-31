// Khung chung của một màn hình: thanh đầu dính trên, thân cuộn.
//
// Tách ra vì mười hai màn hình dùng chung, và vì thanh đầu phải chừa lề an
// toàn của iPhone (tai thỏ) — một chỗ rất dễ làm đúng ở màn hình này và quên ở
// màn hình kia.

import { h, bt, dangTai, baoLoi } from './ui.js';
import { quayLai } from './router.js';

/**
 * @param {{
 *   tieuDe: string,
 *   quayVe?: string|false,   đường quay về; false thì không có nút lùi
 *   nut?: Node[],            nút bên phải thanh đầu
 *   than?: boolean,          bọc nội dung trong lề chuẩn (mặc định có)
 * }} tuyChon
 */
export function trang(tuyChon, ...noiDung) {
  const { tieuDe, quayVe, nut = [], tran = false, dai = false } = tuyChon;

  const dau = h(
    'header',
    { class: 'dau' },
    quayVe !== false &&
      h(
        'button',
        {
          class: 'bieu-tuong',
          'aria-label': 'Quay lại',
          onclick: () => quayLai(quayVe || '/'),
        },
        bt('arrow_back'),
      ),
    h('h1', { class: dai ? 'dai' : null }, tieuDe),
    ...nut,
  );

  // `tran` là màn hình danh sách: chúng chạy sát hai mép như ListView của
  // Flutter, nên lề nằm trong từng dòng chứ không nằm ở khung.
  return h('div', null, dau, h('main', { class: tran ? 'than' : 'than le' }, ...noiDung));
}

/**
 * Thay phần thân của một trang đã dựng, giữ nguyên thanh đầu.
 *
 * Dùng cho màn hình tải dữ liệu xong mới vẽ được: dựng khung ngay để có thanh
 * đầu và nút lùi, rồi đổ nội dung vào sau. Nếu đợi dữ liệu rồi mới dựng cả
 * trang thì trong lúc chờ không có gì trên màn hình, kể cả nút thoát.
 */
export function datThan(el, ...noiDung) {
  const main = el.querySelector('main');
  if (main) main.replaceChildren(...noiDung.filter(Boolean));
  return el;
}

/**
 * Dựng khung trước, nạp dữ liệu sau.
 *
 * @param {object} tuyChon như `trang`
 * @param {() => Promise<any>} nap
 * @param {(du: any, el: HTMLElement) => Node|Node[]} ve
 */
export function trangNap(tuyChon, nap, ve) {
  const el = trang(tuyChon, dangTai());

  const chay = () => {
    datThan(el, dangTai());
    nap().then(
      (du) => {
        const ra = ve(du, el);
        datThan(el, ...(Array.isArray(ra) ? ra : [ra]));
      },
      (loi) => {
        console.error(loi);
        datThan(el, baoLoi(loi, chay));
      },
    );
  };

  chay();
  return el;
}
