// Dựng đề bài: chữ, công thức LaTeX, định dạng, và bảng số liệu.
//
// Cùng quy ước với bản cũ, vì dữ liệu trên máy chủ không đổi:
//
//   $...$        công thức; `\$` là dấu đô la thật
//   <u> <i> <b>  gạch chân, nghiêng, đậm — gạch chân là phần bị hỏi trong đề Văn
//   ' | '        một dòng có dấu này là một hàng bảng; các hàng liền nhau gom
//                thành một bảng, hàng đầu là đầu cột
//
// KaTeX nạp muộn, và chỉ nạp một lần: 292 KB không nên nằm trên đường vào danh
// sách bài giảng, nơi không có công thức nào.

let dangNap = null;

function napKatex() {
  if (dangNap) return dangNap;

  dangNap = new Promise((xong, hong) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'vendor/katex/katex.min.css';
    document.head.append(css);

    const js = document.createElement('script');
    js.src = 'vendor/katex/katex.min.js';
    js.onload = () => xong(window.katex);
    js.onerror = () => hong(new Error('không nạp được KaTeX'));
    document.head.append(js);
  });

  return dangNap;
}

/**
 * @param {string} chu
 * @param {{khoi?: boolean}} tuyChon  khoi=true cho đề bài, false cho phương án
 * @returns {HTMLElement}
 */
export function veToan(chu, { khoi = true } = {}) {
  const goc = document.createElement(khoi ? 'div' : 'span');
  goc.className = 'toan';

  const dong = String(chu ?? '').split('\n');
  if (!dong.some(laHang)) {
    veDoan(goc, chu ?? '');
    return goc;
  }

  // Hàng liền nhau gom thành bảng; chữ ở giữa vẫn là chữ.
  let hang = [];
  let van = [];

  const xaBang = () => {
    if (!hang.length) return;
    goc.append(veBang(hang));
    hang = [];
  };
  const xaVan = () => {
    if (!van.length) return;
    const p = document.createElement('p');
    veDoan(p, van.join('\n'));
    goc.append(p);
    van = [];
  };

  for (const d of dong) {
    if (laHang(d)) {
      xaVan();
      hang.push(d);
    } else {
      xaBang();
      if (d.trim()) van.push(d);
    }
  }
  xaVan();
  xaBang();

  return goc;
}

const laHang = (d) => d.includes(' | ');

function veBang(hang) {
  const o = hang.map((h) => h.split('|').map((c) => c.trim()));
  const soCot = o.reduce((m, r) => Math.max(m, r.length), 0);

  const bang = document.createElement('table');
  bang.className = 'bang-so';

  o.forEach((r, i) => {
    const tr = document.createElement('tr');
    for (let c = 0; c < soCot; c++) {
      // Hàng đầu là đầu cột trong mọi bảng của bộ đề này.
      const o2 = document.createElement(i === 0 ? 'th' : 'td');
      veDoan(o2, r[c] ?? '');
      tr.append(o2);
    }
    bang.append(tr);
  });

  // Cuộn ngang chứ không ép xuống dòng: một bảng sáu cột bóp cho vừa màn hình
  // điện thoại thì mỗi ô thành một cột chữ dựng đứng.
  const boc = document.createElement('div');
  boc.className = 'cuon-ngang';
  boc.append(bang);
  return boc;
}

/** Một đoạn: cắt ra chữ, công thức, và các khoảng có định dạng. */
function veDoan(noi, chu) {
  let dem = '';
  const kieu = { u: false, i: false, b: false };

  const xa = () => {
    if (!dem) return;
    noi.append(bocKieu(document.createTextNode(dem), kieu));
    dem = '';
  };

  for (let i = 0; i < chu.length; i++) {
    const c = chu[i];

    if (c === '\\' && chu[i + 1] === '$') {
      dem += '$';
      i++;
      continue;
    }

    if (c === '<') {
      const het = chu.indexOf('>', i);
      if (het > 0) {
        const dong = chu.startsWith('</', i);
        const ten = chu.slice(i + (dong ? 2 : 1), het);
        if (ten === 'u' || ten === 'i' || ten === 'b') {
          xa();
          kieu[ten] = !dong;
          i = het;
          continue;
        }
      }
      dem += c;
      continue;
    }

    if (c !== '$') {
      dem += c;
      continue;
    }

    // Dấu mở: tìm dấu đóng chưa bị thoát.
    let het = -1;
    for (let j = i + 1; j < chu.length; j++) {
      if (chu[j] === '\\') {
        j++;
        continue;
      }
      if (chu[j] === '$') {
        het = j;
        break;
      }
    }

    // Không có dấu đóng thì đây là một dấu đô la lạc, không phải công thức.
    if (het < 0) {
      dem += c;
      continue;
    }

    xa();
    noi.append(congThuc(chu.slice(i + 1, het)));
    i = het;
  }

  xa();
}

function bocKieu(nut, kieu) {
  let ra = nut;
  if (kieu.b) ra = boc('b', ra);
  if (kieu.i) ra = boc('i', ra);
  if (kieu.u) ra = boc('u', ra);
  return ra;
}

function boc(tag, con) {
  const el = document.createElement(tag);
  el.append(con);
  return el;
}

function congThuc(latex) {
  // Hiện ngay nguyên văn LaTeX, rồi thay bằng công thức khi KaTeX nạp xong.
  // Chờ KaTeX rồi mới vẽ gì cả thì đề bài trống trong lúc chờ; và nếu KaTeX
  // hỏng thì học viên vẫn đọc được công thức ở dạng thô, hơn là một ô rỗng.
  const el = document.createElement('span');
  el.className = 'ct-tho';
  el.textContent = latex;

  napKatex().then(
    (katex) => {
      try {
        katex.render(latex, el, { throwOnError: false, displayMode: false, output: 'html' });
        el.className = 'ct';
      } catch (e) {
        /* giữ nguyên văn */
      }
    },
    () => {
      /* không nạp được thì giữ nguyên văn */
    },
  );

  return el;
}
