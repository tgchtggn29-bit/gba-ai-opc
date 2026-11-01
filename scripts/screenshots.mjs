// 给 wqai.ltd 的 OPC 相关页面截图，输出到 screenshots/ 目录。
// 本地运行：npm i -D playwright && npx playwright install chromium && node scripts/screenshots.mjs
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.SITE || 'https://wqai.ltd';
const OUT = 'screenshots';

const desktop = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const mobile = {
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
};

// [文件名, 路径, 设备, 是否整页]
const shots = [
  // 社区名录
  ['space',         '/space/index.html',            desktop, false],
  ['space-full',    '/space/index.html',            desktop, true],
  // 互动地图
  ['map',           '/space/map.html',              desktop, false],
  // 九市政策
  ['policy',        '/opc/index.html',              desktop, false],
  ['policy-sz',     '/opc/shenzhen.html',           desktop, false],
  ['policy-gz',     '/opc/guangzhou.html',          desktop, false],
  // 白皮书
  ['report',        '/report/',                     desktop, false],
  ['report-read',   '/report/opc-2026/index.html',  desktop, false],
  // 手机版
  ['mobile-space',  '/space/index.html',            mobile,  false],
  ['mobile-map',    '/space/map.html',              mobile,  false],
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
let failed = 0;
for (const [name, path, device, fullPage] of shots) {
  const ctx = await browser.newContext({ ...device, locale: 'zh-CN', colorScheme: 'light' });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 });
    // 触发懒加载与滚动计数动画，再回到顶部
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
    console.log('ok  ', name, BASE + path);
  } catch (e) {
    failed++;
    console.error('fail', name, BASE + path, e.message);
  }
  await ctx.close();
}
await browser.close();
console.log('failed:', failed, '/', shots.length);
if (failed === shots.length) process.exit(1);
