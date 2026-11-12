import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  escapeHtml,
  fillTemplate,
  missingDocumentFields,
  normalizePersonName,
  readVietnameseNumber,
  readVndInWords,
  TEMPLATE_VARIABLES,
  templatePlaceholders,
  unknownTemplateVariables,
} from '../dist/index.js';

describe('readVndInWords', () => {
  const cases = [
    [0, 'Không đồng'],
    [5, 'Năm đồng'],
    [10, 'Mười đồng'],
    [15, 'Mười lăm đồng'],
    [21, 'Hai mươi mốt đồng'],
    [25, 'Hai mươi lăm đồng'],
    [101, 'Một trăm linh một đồng'],
    [110, 'Một trăm mười đồng'],
    [1_000, 'Một nghìn đồng'],
    [10_000, 'Mười nghìn đồng'],
    [250_000, 'Hai trăm năm mươi nghìn đồng'],
    [1_000_000, 'Một triệu đồng'],
    [1_005_000, 'Một triệu không trăm linh năm nghìn đồng'],
    [1_050_000, 'Một triệu không trăm năm mươi nghìn đồng'],
    [3_500_000, 'Ba triệu năm trăm nghìn đồng'],
    [4_215_000, 'Bốn triệu hai trăm mười lăm nghìn đồng'],
    [12_000_000, 'Mười hai triệu đồng'],
    [1_000_000_000, 'Một tỷ đồng'],
    [2_000_001_000, 'Hai tỷ không trăm linh một nghìn đồng'],
    [1_000_000_000_000, 'Một nghìn tỷ đồng'],
    [-500_000, 'Âm năm trăm nghìn đồng'],
  ];

  for (const [amount, words] of cases)
    test(`${amount}`, () => assert.equal(readVndInWords(amount), words));

  test('rejects fractions', () => assert.throws(() => readVietnameseNumber(1.5)));
});

describe('template helpers', () => {
  test('placeholders, unknown keys and filling', () => {
    const html = '<p>{{ ben_thue.ho_ten }} – {{phong.ma}} – {{khong.co}} {{phong.ma}}</p>';

    assert.deepEqual(templatePlaceholders(html), ['ben_thue.ho_ten', 'phong.ma', 'khong.co']);
    assert.deepEqual(unknownTemplateVariables(html), ['khong.co']);
    assert.equal(
      fillTemplate(html, { 'ben_thue.ho_ten': 'An', 'phong.ma': 'P1' }),
      '<p>An – P1 – {{khong.co}} P1</p>',
    );
  });

  test('variables are unique and cover the spec groups', () => {
    const keys = TEMPLATE_VARIABLES.map((item) => item.key);

    assert.equal(new Set(keys).size, keys.length);
    assert.ok(keys.includes('hop_dong.gia_thue_bang_chu'));
  });

  test('missing marks, escaping and name comparison', () => {
    assert.deepEqual(
      missingDocumentFields(
        '<span data-missing="ben_thue.cccd">x</span><span data-missing="ben_thue.cccd"></span>',
      ),
      ['ben_thue.cccd'],
    );
    assert.equal(escapeHtml('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
    assert.equal(normalizePersonName('  NGUYỄN   văn  An '), 'nguyễn văn an');
    assert.notEqual(normalizePersonName('Nguyen Van An'), normalizePersonName('Nguyễn Văn An'));
  });
});
